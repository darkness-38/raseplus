import { NextResponse } from 'next/server';
import puppeteerCore from 'puppeteer-core';

// Configuration
export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '+')
        .replace(/[öÖ]/g, 'o').replace(/[üÜ]/g, 'u').replace(/[ıİ]/g, 'i')
        .replace(/[şŞ]/g, 's').replace(/[çÇ]/g, 'c').replace(/[ğĞ]/g, 'g')
        .replace(/[^\w\+]+/g, '')
        .replace(/\+\++/g, '+');
}

async function getTurkishTitle(id: string, type: string): Promise<string | null> {
    if (!TMDB_API_KEY || !id) return null;
    try {
        const res = await fetch(`${TMDB_BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=tr-TR`);
        if (!res.ok) return null;
        const data = await res.json();
        return data.title || data.name || null;
    } catch (e) {
        return null;
    }
}

async function getBrowser() {
    if (process.env.NODE_ENV === 'production') {
        // PRODUCTION (Vercel)
        const chromium = require('@sparticuz/chromium-min');
        const executablePath = await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar');
        
        console.log(`[Scraper] Vercel Launch. Path: ${executablePath ? 'Remote Binary' : 'Failed'}`);
        
        return await puppeteerCore.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless,
        });
    } else {
        // LOCAL DEVELOPMENT
        const puppeteerExtra = require('puppeteer-extra');
        const StealthPlugin = require('puppeteer-extra-plugin-stealth');
        try { puppeteerExtra.use(StealthPlugin()); } catch (e) {}
        
        console.log(`[Scraper] Local Launch: ${CHROME_PATH}`);
        return await puppeteerExtra.launch({
            executablePath: CHROME_PATH,
            headless: true,
            args: ['--no-sandbox']
        });
    }
}

// ── Scrapers ──────────────────────────────────────────────────────────────────

async function scrapeSource2(title: string) {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchUrl = `https://www.fullhdfilmizlesene.live/arama/${slugify(title)}`;
        console.log(`[Scraper] S2: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const isOnMoviePage = await page.evaluate(() => !!document.querySelector('#plx, .video-play-button'));
        let movieUrl = isOnMoviePage ? page.url() : await page.evaluate(() => {
            const span = document.querySelector('span.t');
            const link = span?.closest('a') || document.querySelector('a.tt');
            return link ? (link as HTMLAnchorElement).href : null;
        });

        if (!movieUrl) return null;
        if (!isOnMoviePage) await page.goto(movieUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('#plx iframe, figure iframe, iframe[src*="rapidvid"]') as HTMLIFrameElement;
            return iframe ? iframe.src : null;
        });
        
        return videoSource ? { url: videoSource, type: 'iframe' } : null;
    } catch (error) {
        console.error('S2 Error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

async function scrapeSource3(title: string) {
    let browser;
    try {
        browser = await getBrowser();
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchUrl = `https://www.hdfilmcehennemi.nl/?s=${slugify(title)}`;
        console.log(`[Scraper] S3: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        const isOnMoviePage = await page.evaluate(() => !!document.querySelector('#player, iframe.close'));
        let movieUrl = isOnMoviePage ? page.url() : await page.evaluate(() => {
            const link = document.querySelector('a.search-result, .poster-container a') as HTMLAnchorElement;
            return link ? link.href : null;
        });

        if (!movieUrl) return null;
        if (!isOnMoviePage) await page.goto(movieUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('iframe.close, #player iframe, iframe[src*="hdfilmcehennemi.mobi"]') as HTMLIFrameElement;
            return iframe ? iframe.src : null;
        });
        
        return videoSource ? { url: videoSource, type: 'iframe' } : null;
    } catch (error) {
        console.error('S3 Error:', error);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const provider = searchParams.get('provider');
    const tmdbId = searchParams.get('tmdbId');
    const type = searchParams.get('type') || 'movie';

    if (!title || !provider) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

    try {
        const trTitle = tmdbId ? await getTurkishTitle(tmdbId, type) : null;
        const searchTerms = trTitle && trTitle !== title ? [trTitle, title] : [title];

        console.log(`[Scraper] Request: ${title} (TR: ${trTitle || 'N/A'}) - Provider: ${provider}`);

        let result = null;
        for (const term of searchTerms) {
            if (provider === 'source2') result = await scrapeSource2(term);
            else if (provider === 'source3') result = await scrapeSource3(term);
            if (result) break;
        }

        return result ? NextResponse.json(result) : NextResponse.json({ error: 'Not found' }, { status: 404 });
    } catch (err: any) {
        console.error('[Scraper] API Fatal:', err.message);
        return NextResponse.json({ error: `Launch Failed: ${err.message}` }, { status: 500 });
    }
}
