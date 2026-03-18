import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import chromium from '@sparticuz/chromium';
// Safe Stealth Plugin initialization
let stealthApplied = false;
function applyStealth() {
    if (stealthApplied) return;
    try {
        console.log('[Scraper] Applying Stealth Plugin...');
        // Use require for better compatibility in serverless
        const Stealth = require('puppeteer-extra-plugin-stealth');
        puppeteer.use(Stealth());
        stealthApplied = true;
        console.log('[Scraper] Stealth Plugin applied successfully.');
    } catch (e) {
        console.error('[Scraper] Stealth plugin initialization error:', e);
    }
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function getBrowser() {
    applyStealth();
    try {
        if (process.env.NODE_ENV === 'production') {
            const executablePath = await chromium.executablePath();
            console.log(`[Scraper] Launching Production Chrome at ${executablePath}`);
            return await puppeteer.launch({
                args: chromium.args,
                defaultViewport: (chromium as any).defaultViewport || { width: 1280, height: 720 },
                executablePath: executablePath,
                headless: (chromium as any).headless || true,
            });
        } else {
            console.log(`[Scraper] Launching Local Chrome at ${CHROME_PATH}`);
            return await puppeteer.launch({
                executablePath: CHROME_PATH,
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
        }
    } catch (launchError) {
        console.error('[Scraper] Browser launch failed:', launchError);
        throw launchError;
    }
}

// Source 2 Scraper (FullHDFilmizlesene)
async function scrapeSource2(title: string) {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchUrl = `https://www.fullhdfilmizlesene.live/arama/${encodeURIComponent(title).replace(/%20/g, '+')}`;
        console.log(`[Scraper] Searching Source 2: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Wait for results
        await page.waitForSelector('span.t, a.tt', { timeout: 10000 }).catch(() => {});

        const firstResult = await page.evaluate(() => {
            const span = document.querySelector('span.t');
            const link = span ? span.closest('a') : document.querySelector('a.tt');
            return link ? (link as HTMLAnchorElement).href : null;
        });

        if (!firstResult) {
            console.log(`[Scraper] No results found for ${title} on Source 2`);
            return null;
        }

        console.log(`[Scraper] Found movie page: ${firstResult}`);
        await page.goto(firstResult, { waitUntil: 'networkidle2', timeout: 30000 });

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('#plx iframe, figure iframe, iframe[src*="rapidvid"]') as HTMLIFrameElement;
            return iframe ? iframe.src : null;
        });
        
        if (videoSource) return { url: videoSource, type: 'iframe' };

        // Fallback for data-src
        const dataSrc = await page.evaluate(() => {
            const iframe = document.querySelector('#plx iframe') as HTMLIFrameElement;
            return iframe ? iframe.getAttribute('data-src') || iframe.src : null;
        });

        if (dataSrc) return { url: dataSrc, type: 'iframe' };

        const content = await page.content();
        const m3u8Match = content.match(/file:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/i);
        if (m3u8Match) return { url: m3u8Match[1], type: 'hls' };

        return null;
    } catch (error) {
        console.error('Source 2 Scrape Error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// Source 3 Scraper (HDFilmCehennemi)
async function scrapeSource3(title: string) {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchUrl = `https://www.hdfilmcehennemi.nl/`;
        console.log(`[Scraper] Searching Source 3 via dropdown: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Use the search input to trigger dropdown
        await page.click('input[name="s"], #search-input').catch(() => {});
        await page.type('input[name="s"], #search-input', title, { delay: 100 });
        
        // Wait for dropdown results
        await page.waitForSelector('a.search-result', { timeout: 15000 }).catch(() => {});

        const firstResult = await page.evaluate(() => {
            const link = document.querySelector('a.search-result') as HTMLAnchorElement;
            return link ? link.href : null;
        });

        if (!firstResult) {
            console.log(`[Scraper] No results found for ${title} on Source 3`);
            return null;
        }

        console.log(`[Scraper] Found movie page: ${firstResult}`);
        await page.goto(firstResult, { waitUntil: 'networkidle2', timeout: 30000 });
        await page.waitForSelector('#player, .embed-responsive, iframe', { timeout: 10000 }).catch(() => {});

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('iframe.close, #player iframe, iframe[src*="hdfilmcehennemi.mobi"]') as HTMLIFrameElement;
            return iframe ? iframe.src : null;
        });

        if (videoSource) return { url: videoSource, type: 'iframe' };

        return null;
    } catch (error) {
        console.error('Source 3 Scrape Error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const provider = searchParams.get('provider');

    if (!title || !provider) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    let result = null;
    if (provider === 'source2') {
        result = await scrapeSource2(title);
    } else if (provider === 'source3') {
        result = await scrapeSource3(title);
    }

    if (result) {
        return NextResponse.json(result);
    } else {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
}
