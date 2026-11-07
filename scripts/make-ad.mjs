// Records the vertical marketing ad (1080x1920) from prototype/video/ad.html. Needs the prototype served (PORT, default 8080) and ffmpeg.
import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
const PORT = process.env.PORT || 8080, out = 'marketing/out'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, recordVideo: { dir: out + '/raw-ad', size: { width: 1080, height: 1920 } } });
const page = await ctx.newPage();
await page.goto(`http://localhost:${PORT}/video/ad.html`);
const total = await page.evaluate(() => window.AD.total);
await page.waitForTimeout(total + 1800);
await ctx.close(); await browser.close();
const raw = fs.readdirSync(out + '/raw-ad').filter(f => f.endsWith('.webm')).map(f => out + '/raw-ad/' + f)[0];
execSync(`ffmpeg -y -loglevel error -i "${raw}" -ss 0.6 -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 30 -movflags +faststart marketing/shital-ad-vertical.mp4`);
console.log('ad written, seconds ~', (total / 1000).toFixed(1));
