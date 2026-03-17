import { JSDOM } from "jsdom";

async function run() {
    console.log("Fetching iframe...");
    const url = "https://www.hdfilmcehennemi.nl/playerr/qo63rs0pov5w/";
    const res = await fetch(url);
    const html = await res.text();

    console.log("Setting up JSDOM...");

    // Create a virtual console to catch logs or errors
    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.on("error", () => { /* ignore */ });
    virtualConsole.on("warn", () => { /* ignore */ });
    virtualConsole.on("info", () => { /* ignore */ });
    virtualConsole.on("dir", () => { /* ignore */ });

    const dom = new JSDOM(html, {
        url: url,
        referrer: "https://www.hdfilmcehennemi.nl/",
        contentType: "text/html",
        includeNodeLocations: true,
        runScripts: "dangerously", // Required to execute the obfuscated scripts
        virtualConsole,
        pretendToBeVisual: true,
    });

    const window = dom.window;

    // We can inject a proxy or poll the window object to find the player configuration
    console.log("Waiting for scripts to execute...");
    
    // Give it a brief moment to run synchronous scripts
    await new Promise(r => setTimeout(r, 100));

    // Jwplayer or typical players attach themselves to Window. 
    // Let's find any .m3u8 or .mp4 URLs in the global scope or script tags
    
    let foundUrl = null;

    // 1. Check if the script dumped it into a global variable
    for (const key of Object.getOwnPropertyNames(window)) {
        try {
            const val = (window as any)[key];
            if (typeof val === "string" && (val.includes(".m3u8") || val.includes(".mp4"))) {
                console.log(`Found candidate in window.${key}:`, val);
                foundUrl = val;
            }
        } catch { /* Ignore cross-origin or restricted properties */ }
    }

    // 2. Check document body for newly injected elements
    const elementsWithSrc = window.document.querySelectorAll("[src]");
    elementsWithSrc.forEach((el: any) => {
        const src = el.src || el.getAttribute("src");
        if (src && (src.includes(".m3u8") || src.includes(".mp4"))) {
            console.log("Found active DOM element with src:", src);
            foundUrl = src;
        }
    });

    // 3. Since we executed the code, we can also just serialize the whole DOM and regex check it
    // The obfuscator might have written down `<script>var file_link = "..."</script>`
    const newHtml = window.document.documentElement.innerHTML;
    const regex = /https?:\/\/[^"'\s]+\.(?:m3u8|mp4)[^"'\s]*/i;
    const match = newHtml.match(regex);
    if (match) {
        console.log("Found URL in rendered HTML body:", match[0]);
        foundUrl = match[0];
    } else {
        console.log("No URL found in rendered HTML.");
    }

    // Clean up
    dom.window.close();
}

import * as jsdom from "jsdom";
run();
