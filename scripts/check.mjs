import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
const read = path => readFile(new URL(`../${path}`, import.meta.url));
const manifest = JSON.parse(await read('manifest.json'));
const pkg = JSON.parse(await read('package.json'));
assert.equal(manifest.manifest_version, 3);
assert.equal(manifest.version, pkg.version);
assert.deepEqual(manifest.permissions, ['storage', 'clipboardWrite']);
assert.deepEqual(manifest.content_scripts[0].matches, ['http://*/*', 'https://*/*']);
for (const path of [...manifest.content_scripts[0].js, manifest.options_ui.page, 'options.js', 'options.css']) await read(path);
for (const [size, path] of Object.entries(manifest.icons)) {
  const asset = await sharp(await read(path)).metadata();
  assert.equal(asset.format, 'png'); assert.equal(asset.width, Number(size)); assert.equal(asset.height, Number(size));
}
const en = JSON.parse(await read('_locales/en/messages.json'));
const ja = JSON.parse(await read('_locales/ja/messages.json'));
assert.deepEqual(Object.keys(en).sort(), Object.keys(ja).sort());
const source = (await Promise.all(['content.js', 'options.js', 'options.html'].map(read))).join('\n');
for (const match of source.matchAll(/(?:message\('([^']+)'|data-i18n="([^"]+)")/g)) assert.ok(en[match[1] || match[2]], `Missing locale key: ${match[1] || match[2]}`);
for (const messages of [en, ja]) {
  for (const value of Object.values(messages)) assert.ok(value.message);
  assert.ok(messages.extensionDescription.message.length <= 132);
}
console.log('Manifest, permissions, versions, PNG icons and matching locales verified.');
