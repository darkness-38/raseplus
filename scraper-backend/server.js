const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();
puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Source 2: FullHDFilmizlesene
async function scrapeSource2(title, tmdbId, type, season, episode) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchUrl = `https://www.fullhdfilmizlesene.pw/arama/${encodeURIComponent(title)}`;
        console.log(`Searching Source 2: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const firstResult = await page.evaluate(() => {
            const link = document.querySelector('.film-liste .film-box a');
            return link ? link.href : null;
        });

        if (!firstResult) throw new Error('No result found on Source 2');

        console.log(`Found result page: ${firstResult}`);
        await page.goto(firstResult, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('iframe[src*="vidmoly"], iframe[src*="fembed"], iframe[src*="ok.ru"], iframe[src*="mixdrop"]');
            return iframe ? iframe.src : null;
        });

        if (videoSource) return { url: videoSource, type: 'iframe' };

        const content = await page.content();
        const m3u8Match = content.match(/file:\s*"(https?:\/\/[^"]+\.m3u8[^"]*)"/i);
        if (m3u8Match) return { url: m3u8Match[1], type: 'hls' };

        return null;
    } catch (error) {
        console.error('Source 2 Scrape Error:', error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

// Source 3: HDFilmCehennemi
async function scrapeSource3(title, tmdbId, type, season, episode) {
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        const searchUrl = `https://www.hdfilmcehennemi.life/?s=${encodeURIComponent(title)}`;
        console.log(`Searching Source 3: ${searchUrl}`);
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const firstResult = await page.evaluate(() => {
            const link = document.querySelector('.poster-container a');
            return link ? link.href : null;
        });

        if (!firstResult) throw new Error('No result found on Source 3');

        console.log(`Found result page: ${firstResult}`);
        await page.goto(firstResult, { waitUntil: 'domcontentloaded', timeout: 30000 });

        const videoSource = await page.evaluate(() => {
            const iframe = document.querySelector('iframe');
            return iframe ? iframe.src : null;
        });

        if (videoSource) return { url: videoSource, type: 'iframe' };

        return null;
    } catch (error) {
        console.error('Source 3 Scrape Error:', error.message);
        return null;
    } finally {
        if (browser) await browser.close();
    }
}

app.get('/api/get-source', async (req, res) => {
    const { title, tmdbId, type, season, episode, provider } = req.query;

    if (!title || !provider) {
        return res.status(400).json({ error: 'Missing parameters' });
    }

    let result = null;
    if (provider === 'source2') {
        result = await scrapeSource2(title, tmdbId, type, season, episode);
    } else if (provider === 'source3') {
        result = await scrapeSource3(title, tmdbId, type, season, episode);
    }

    if (result) {
        res.json(result);
    } else {
        res.status(404).json({ error: 'Source not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Scraper backend running on http://localhost:${PORT}`);
});
