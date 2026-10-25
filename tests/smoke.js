// Visual smoke test. Run from the repo root:
//   python3 -m http.server 8765 &
//   node tests/smoke.js            (needs the `playwright` package)
// Screenshots land in tests/output/ (git-ignored).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:8765/';
const OUT = path.join(__dirname, 'output');

const variants = [
    ['mobile', { viewport: { width: 375, height: 760 }, isMobile: true, hasTouch: true }],
    ['tablet', { viewport: { width: 768, height: 1024 } }],
    ['laptop', { viewport: { width: 1280, height: 800 } }],
    ['desktop', { viewport: { width: 1440, height: 900 } }],
    ['reduced-motion', { viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }],
    ['no-js', { viewport: { width: 1280, height: 800 }, javaScriptEnabled: false }],
];

(async () => {
    fs.mkdirSync(OUT, { recursive: true });
    const browser = await chromium.launch();
    let failed = false;

    for (const [name, options] of variants) {
        const context = await browser.newContext(options);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
        page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));

        await page.goto(BASE);
        await page.waitForTimeout(options.javaScriptEnabled === false ? 500 : 4500);

        // Scroll through so lazy images load and scroll reveals fire
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        for (let y = 0; y < height; y += 500) {
            await page.evaluate((top) => window.scrollTo(0, top), y);
            await page.waitForTimeout(150);
        }
        await page.waitForTimeout(1200);

        const result = await page.evaluate(() => ({
            overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            introLeft: !!document.querySelector('.intro') && getComputedStyle(document.querySelector('.intro')).display !== 'none',
            ribbonLength: document.querySelector('.ribbon__band')?.getTotalLength() ?? 0,
            h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
        }));

        await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });

        const problems = [...errors];
        if (result.overflowX) problems.push('horizontal overflow');
        if (result.introLeft) problems.push('intro overlay still visible');
        if (options.javaScriptEnabled !== false && result.ribbonLength <= 0) problems.push('ribbon not drawn');
        if (!result.h1 || !result.h1.includes('Smriti')) problems.push('h1 missing');

        console.log(`${problems.length ? '✗' : '✓'} ${name}${problems.length ? `: ${problems.join('; ')}` : ''}`);
        if (problems.length) failed = true;
        await context.close();
    }

    await browser.close();
    process.exit(failed ? 1 : 0);
})();
