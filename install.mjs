import { download } from 'chrome-aws-lambda';

console.log('Downloading headless Chromium for Puppeteer...');
await download();
