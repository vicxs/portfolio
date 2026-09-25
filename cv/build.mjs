// Prints cv/en.html and cv/es.html to the PDFs the portfolio links to.
//
//   npm install --no-save playwright-core
//   node cv/build.mjs
//
// Uses the Chromium Playwright finds; set CHROMIUM_PATH to use another one.
// Needs network access for the Google Fonts the pages load (HTTPS_PROXY is
// passed on to Chromium when set).
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TARGETS = [
  { src: 'cv/en.html', out: 'assets/Victor_Esteban_CV.pdf' },
  { src: 'cv/es.html', out: 'assets/Victor_Esteban_CV_ES.pdf' },
];

const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH && { executablePath: process.env.CHROMIUM_PATH }),
  ...(proxy && { proxy: { server: proxy } }),
});

try {
  const page = await browser.newPage();
  await page.emulateMedia({ media: 'print' });
  for (const { src, out } of TARGETS) {
    await page.goto(pathToFileURL(path.join(root, src)).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    const fonts = await page.evaluate(() => {
      const loaded = new Set([...document.fonts]
        .filter((face) => face.status === 'loaded')
        .map((face) => face.family.replace(/["']/g, '')));
      return ['Schibsted Grotesk', 'Instrument Serif'].filter((family) => !loaded.has(family));
    });
    if (fonts.length) throw new Error(`${src}: fonts did not load: ${fonts.join(', ')}`);

    // The page is a fixed A4 sheet; anything taller would be clipped.
    const overflow = await page.evaluate(() => {
      const sheet = document.querySelector('.page');
      return sheet.scrollHeight - sheet.clientHeight;
    });
    if (overflow > 0) throw new Error(`${src}: content overflows the page by ${overflow}px`);

    await page.pdf({ path: path.join(root, out), preferCSSPageSize: true, printBackground: true });
    console.log(`${src} → ${out}`);
  }
} finally {
  await browser.close();
}
