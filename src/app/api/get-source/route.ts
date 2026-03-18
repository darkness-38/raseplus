import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-extra';
import chromium from '@sparticuz/chromium';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

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

function slugify(text: string) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '+')           // Replace spaces with +
        .replace(/[öÖ]/g, 'o')
        .replace(/[üÜ]/g, 'u')
        .replace(/[ıİ]/g, 'i')
        .replace(/[şŞ]/g, 's')
        .replace(/[çÇ]/g, 'c')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[^\w\+]+/g, '')       // Remove all non-word chars
        .replace(/\+\++/g, '+');        // Replace multiple + with single +
}

export const dynamic = 'force-dynamic';
export const maxDuration = 60; 

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function getBrowser() {
    applyStealth();
    try {
        if (process.env.NODE_ENV === 'production') {
            // Vercel deployment often requires specific flags for @sparticuz/chromium
            const executablePath = await chromium.executablePath();
            console.log(`[Scraper] Launching Production Chrome at ${executablePath}`);
            
            return await puppeteer.launch({
                args: [
                   ...chromium.args,
                   '--no-sandbox',
                   '--disable-setuid-sandbox',
                   '--disable-dev-shm-usage',
                   '--disable-gpu',
                ],
                defaultViewport: chromium.defaultViewport,
                executablePath: executablePath,
                headless: chromium.headless,
            });
        } else {
            console.log(`[Scraper] Launching Local Chrome at ${CHROME_PATH}`);
            return await puppeteer.launch({
                executablePath: CHROME_PATH,
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
        }
    } catch (launchError: any) {
        console.error('[Scraper] Browser launch failed:', launchError.message);
        // Special case for binary path issues: log the error details
        if (launchError.message.includes('directory') || launchError.message.includes('brotli')) {
            console.error('[Scraper] This is a known Vercel/Chromium bundling issue.');
        }
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

        const searchUrl = `https://www.fullhdfilmizlesene.live/arama/${slugify(title)}`;
        console.log(`[Scraper] Searching Source 2: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check if we were redirected directly to a movie page
        const isOnMoviePage = await page.evaluate(() => !!document.querySelector('#plx, figure.ply, .video-play-button'));
        
        let movieUrl = isOnMoviePage ? page.url() : null;

        if (!movieUrl) {
            console.log(`[Scraper] Not redirected. Waiting for search results...`);
            await page.waitForSelector('span.t, a.tt, .film-box a', { timeout: 15000 }).catch(() => {});

            movieUrl = await page.evaluate(() => {
                const span = document.querySelector('span.t');
                const link = span ? span.closest('a') : (document.querySelector('a.tt') || document.querySelector('.film-box a'));
                return link ? (link as HTMLAnchorElement).href : null;
            });
        }

        if (!movieUrl) {
            console.log(`[Scraper] No movie URL found for ${title} on Source 2`);
            return null;
        }

        if (!isOnMoviePage) {
            console.log(`[Scraper] Navigating to movie page: ${movieUrl}`);
            await page.goto(movieUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        }

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('#plx iframe, figure iframe, .plx iframe, iframe[src*="rapidvid"], iframe[src*="vidmoly"]') as HTMLIFrameElement;
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
        console.log(`[Scraper] Searching Source 3: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Check if we can use a direct search query if dropdown fails
        const directSearchUrl = `https://www.hdfilmcehennemi.nl/?s=${slugify(title)}`;
        await page.goto(directSearchUrl, { waitUntil: 'networkidle2', timeout: 30000 });

        // Check if redirected directly
        const isOnMoviePage = await page.evaluate(() => !!document.querySelector('#player, .video-content, iframe.close'));
        let movieUrl = isOnMoviePage ? page.url() : null;

        if (!movieUrl) {
            await page.waitForSelector('.poster-container a, a.search-result', { timeout: 15000 }).catch(() => {});
            movieUrl = await page.evaluate(() => {
                const link = document.querySelector('.poster-container a, a.search-result') as HTMLAnchorElement;
                return link ? link.href : null;
            });
        }

        if (!movieUrl) {
            console.log(`[Scraper] No movie URL found for ${title} on Source 3`);
            return null;
        }

        if (!isOnMoviePage) {
            console.log(`[Scraper] Navigating to movie page: ${movieUrl}`);
            await page.goto(movieUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        }

        await page.waitForSelector('#player, iframe, .embed-responsive', { timeout: 10000 }).catch(() => {});

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('iframe.close, #player iframe, .embed-responsive iframe, iframe[src*="hdfilmcehennemi.mobi"]') as HTMLIFrameElement;
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
    const tmdbId = searchParams.get('tmdbId');
    const type = searchParams.get('type') || 'movie';

    if (!title || !provider) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Try to get Turkish title for better scraping accuracy on TR sites
    const turkishTitle = tmdbId ? await getTurkishTitle(tmdbId, type) : null;
    const searchTerms = turkishTitle && turkishTitle !== title ? [turkishTitle, title] : [title];

    console.log(`[Scraper] Initializing for ${title} (TR: ${turkishTitle || 'N/A'}) using terms: ${searchTerms.join(', ')}`);

    let result = null;
    for (const term of searchTerms) {
        if (provider === 'source2') {
            result = await scrapeSource2(term);
        } else if (provider === 'source3') {
            result = await scrapeSource3(term);
        }
        if (result) break; // Stop if we found a source
    }

    if (result) {
        return NextResponse.json(result);
    } else {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }
}
