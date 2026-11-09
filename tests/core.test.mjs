import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const scope = vm.createContext({ URL, Intl });
vm.runInContext(await readFile(new URL('../shared.js', import.meta.url), 'utf8'), scope);
const { getOpenableUrl: link, countCharacters: count, normalizeSettings, validThreshold } = scope.QuickSearchPlusCore;

test('URL detection accepts explicit and bare public domains, IDNs and valid ports', () => {
  for (const [input, expected] of [
    ['example.com/path?a=b#c', 'https://example.com/path?a=b#c'], ['www.example.com', 'https://www.example.com/'],
    ['https://example.com:8443/path', 'https://example.com:8443/path'],
    ['http://example.com', 'http://example.com/'], ['例え.テスト/道', 'https://xn--r8jz45g.xn--zckzah/%E9%81%93'],
    [' HTTPS://EXAMPLE.COM ', 'https://example.com/']
  ]) assert.equal(link(input), expected, input);
});
test('URL detection rejects other schemes, credentials, controls, malformed hosts and ambiguous addresses', () => {
  for (const value of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/x', 'ftp://example.com',
    'https://name:password@example.com', 'https://example.com@evil.test', 'user@example.com',
    'https://example.com\\@evil.test', 'https://exa\nmple.com', 'example..com', '-bad.com',
    'bad-.com', 'https://example.com:99999', 'http://localhost', '127.0.0.1', 'https://127.0.0.1',
    'some sentence.com', 'https://', 'example.com/' + 'x'.repeat(2048), 'https://example.com\u0000']) assert.equal(link(value), null, value);
});
test('visible characters are counted as graphemes with whitespace retained', () => {
  assert.equal(count('👨‍👩‍👧‍👦👍🏽🇯🇵e\u0301あ'), 5);
  assert.equal(count(' a\n'), 3);
  assert.equal(count(''), 0);
});
test('settings validation rejects partial numbers, fractions, overflow and wrong types', () => {
  for (const value of ['', '30junk', -1, 0, 1.5, Infinity, 100001, true, null, {}]) assert.equal(validThreshold(value), false, String(value));
  assert.equal(validThreshold(1), true); assert.equal(validThreshold('100000'), true);
  const normalized = normalizeSettings({ characterCountThreshold: '7', copyButtonEnabled: false, openUrlEnabled: 'false' });
  assert.equal(normalized.characterCountThreshold, 7); assert.equal(normalized.copyButtonEnabled, false); assert.equal(normalized.openUrlEnabled, true);
  assert.equal(normalizeSettings({ characterCountThreshold: '3bad' }).characterCountThreshold, 30);
});
