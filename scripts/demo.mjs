import { chromium, expect } from '@playwright/test';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import sharp from 'sharp';

const profile = await mkdtemp(join(tmpdir(), 'qsp-demo-'));
const extension = resolve('.');
const context = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true, locale: 'en-US',
  viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1,
  args: ['--lang=en-US', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
});
try {
  await context.route('http://qsp-demo.test/**', route => route.fulfill({ contentType: 'text/html', body: `
    <!doctype html><html lang="en"><meta charset="utf-8"><title>Quick Search Plus demo</title>
    <style>
      *{box-sizing:border-box}body{margin:0;background:#f3f5f8;color:#172b3e;font-family:Arial,sans-serif}
      header{height:76px;padding:0 68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #dce2e9;font-size:15px}
      header strong{letter-spacing:-.5px;font-size:20px}header span{color:#69788a}
      main{display:grid;grid-template-columns:1fr 300px;gap:68px;padding:66px 88px}
      .eyebrow{color:#43715b;letter-spacing:2px;font-size:12px;font-weight:bold}
      h1{font-size:56px;line-height:1.1;letter-spacing:-2px;margin:20px 0 22px;font-weight:600}
      .meta{font-size:14px;color:#7b8795;margin-bottom:38px}
      p{font-size:21px;line-height:1.85;color:#435267;margin:0 0 22px}
      ::selection{background:#cdddff;color:#123e88}
      aside{margin-top:102px;border-left:2px solid #dce2e9;padding:0 0 0 28px}
      aside small{font-size:12px;letter-spacing:2px;color:#69788a}aside h2{font-size:26px;line-height:1.3;margin:20px 0 14px}
      aside p{font-size:16px;line-height:1.7}.step{display:inline-block;background:#e1eae5;color:#276344;border-radius:20px;font-size:12px;padding:7px 12px;margin-top:14px}
      footer{margin:4px 88px;border-top:1px solid #dce2e9;padding-top:22px;display:flex;justify-content:space-between;color:#7b8795;font-size:12px}
    </style>
    <header><strong>Fieldnotes</strong><span>A sample reading page</span></header>
    <main><article><div class="eyebrow">IDEAS WORTH KEEPING</div><h1>Keep the thought.<br>Follow the link.</h1>
    <div class="meta">Small tools for curious minds · 3 min read</div>
    <p>A good idea rarely arrives alone. It brings a phrase to look up, a passage to save, a connection to explore.</p>
    <p><span id="selection">A little more from every selection.</span></p>
    <p style="margin-top:64px">Stay with the page. Take the next step from here.</p></article>
    <aside><small>QUICK SEARCH PLUS</small><h2>A selection.<br>A few possibilities.</h2><p>Search a thought.<br>Copy a passage.<br>Open a link.<br>Count the characters.</p><span class="step">Your tools. Your choice.</span></aside></main>
    <footer><span>Actual extension · Demonstration page</span><span>No tracking. Only your preferences are saved.</span></footer></html>
  ` }));
  const page = await context.newPage();
  await page.goto('http://qsp-demo.test');
  await page.locator('#selection').evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  });
  await page.locator('quick-search-plus [data-action="primary"]').waitFor({ state: 'visible' });
  await expect(page.locator('quick-search-plus .count')).toBeVisible();
  await mkdir('docs', { recursive: true });
  await page.screenshot({ path: 'docs/store-screenshot.png' });
  await sharp('docs/store-screenshot.png').resize(1120, 700).png().toFile('docs/demo.png');
  const client = await context.newCDPSession(page);
  const worlds = [];
  client.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
  await client.send('Runtime.enable');
  let extensionId;
  for (const world of worlds.filter(item => !item.auxData?.isDefault)) {
    const result = await client.send('Runtime.evaluate', { contextId: world.id, expression: 'globalThis.chrome?.runtime?.id', returnByValue: true });
    if (result.result.value) { extensionId = result.result.value; break; }
  }
  if (!extensionId) throw new Error('Extension ID unavailable');
  await client.detach();
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(options.locator('fieldset')).toBeEnabled();
  await options.setViewportSize({ width: 1000, height: 1000 });
  await options.screenshot({ path: 'docs/options.png', fullPage: true });
  console.log('Captured actual selection actions and options screenshots.');
} finally {
  await context.close(); await rm(profile, { recursive: true, force: true });
}
