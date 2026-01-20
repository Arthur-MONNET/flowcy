import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const DEFAULT_URL = 'https://annecy-mobilites.latitude-cartagene.com/';
const OUTPUT_RELATIVE = '../analysis/mobilites/network-requests.txt';
const WAIT_MS = 15000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, OUTPUT_RELATIVE);

const normalizeUrl = (url) => url.split('#')[0];
const targetUrl = process.argv[2] || DEFAULT_URL;

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const urls = new Set();

  page.on('request', (request) => {
    urls.add(normalizeUrl(request.url()));
  });

  page.on('websocket', (ws) => {
    urls.add(normalizeUrl(ws.url()));
  });

  await page.goto(targetUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(WAIT_MS);

  const sorted = Array.from(urls).sort();
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, sorted.join('\n') + '\n', 'utf-8');

  await browser.close();
  console.log(`Saved ${sorted.length} URLs to ${outputPath}`);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
