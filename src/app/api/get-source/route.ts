import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';

// Apply Stealth Plugin globally (safely)
try {
    const plugin = StealthPlugin();
    puppeteer.use(plugin);
} catch (e) {
    console.warn('Stealth plugin initialization warning:', e);
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds (Vercel Pro/Enterprise or local dev)

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function getBrowser() {
    if (process.env.NODE_ENV === 'production') {
        // Vercel / Production environment
        return await puppeteer.launch({
            args: chromium.args,
            defaultViewport: (chromium as any).defaultViewport || { width: 1280, height: 720 },
            executablePath: await chromium.executablePath(),
            headless: (chromium as any).headless || true,
        });
    } else {
        // Local development
        return await puppeteer.launch({
            executablePath: CHROME_PATH,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
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
