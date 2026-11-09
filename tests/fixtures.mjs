import { test as base, expect, chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>Selection fixture</title>
<style>body{margin:64px;font:20px/1.7 system-ui;background:#f7f8fa;color:#17223b}p{max-width:650px}
button{border:12px solid red!important;background:magenta!important;padding:24px!important;border-radius:0!important}
quick-search-plus{background:magenta!important;border:10px solid red!important;box-shadow:0 0 0 9px red!important}
</style><h1>Find your next thought.</h1>
<p id="text">日本語 & café + #privacy / 検索</p><p id="other">A different selection.</p>
<p id="link">example.com/a?x=1#part</p><p id="emoji">👨‍👩‍👧‍👦👍🏽🇯🇵éあ</p><pre id="spaces">  line one\nline two  </pre>
<p id="space">   </p><input id="input" value="private input"><input id="password" type="password" value="secret">
<textarea id="textarea">private draft</textarea><div contenteditable id="editor">private editor</div>
<div style="height:1800px"></div></html>`;

export const test = base.extend({
  context: async ({}, use) => {
    const profile = await mkdtemp(join(tmpdir(), 'qsp-test-'));
    const extension = resolve(process.env.QSP_EXTENSION_PATH || '.');
    const context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium', headless: true, locale: 'en-US',
      args: ['--lang=en-US', `--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
      viewport: { width: 1000, height: 720 }
    });
    try { await use(context); } finally {
      await context.close(); await rm(profile, { recursive: true, force: true });
    }
  },
  page: async ({ context }, use) => {
    const server = createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    try { await use(page); } finally {
      await page.close(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    }
  }
});
export { expect };
export const primary = page => page.locator('quick-search-plus [data-action="primary"]');
export const copy = page => page.locator('quick-search-plus [data-action="copy"]');
export const badge = page => page.locator('quick-search-plus .count');

export async function select(page, id = 'text') {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.locator(`#${id}`).evaluate(el => {
    const range = document.createRange(); range.selectNodeContents(el);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  });
}
// Read the real content-script world; do not mock chrome.runtime or storage.
export async function contentWorld(page) {
  const client = await page.context().newCDPSession(page);
  const worlds = [];
  client.on('Runtime.executionContextCreated', ({ context }) => worlds.push(context));
  await client.send('Runtime.enable');
  for (const world of worlds.filter(item => !item.auxData?.isDefault)) {
    const result = await client.send('Runtime.evaluate', { contextId: world.id, expression: 'globalThis.chrome?.runtime?.id', returnByValue: true });
    if (result.result.value) return { client, id: world.id, extensionId: result.result.value };
  }
  await client.detach();
  throw new Error('Real extension content-script world not found');
}
export async function openOptions(page) {
  const { client, extensionId } = await contentWorld(page);
  await client.detach();
  const options = await page.context().newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(options.locator('fieldset')).toBeEnabled();
  return options;
}
