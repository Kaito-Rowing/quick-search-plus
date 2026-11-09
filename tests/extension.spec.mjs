import { test, expect, primary, copy, badge, select, openOptions, contentWorld } from './fixtures.mjs';

test('Google search encodes Unicode and special characters without opener or referrer', async ({ page, context }) => {
  await context.route('https://www.google.com/**', route => route.fulfill({ body: '<title>Search</title>' }));
  await select(page); await expect(primary(page)).toBeVisible();
  const popup = context.waitForEvent('page'); await primary(page).click();
  const destination = await popup; await destination.waitForLoadState();
  expect(new URL(destination.url()).searchParams.get('q')).toBe('日本語 & café + #privacy / 検索');
  expect(await destination.evaluate(() => window.opener)).toBeNull();
  expect(await destination.evaluate(() => document.referrer)).toBe('');
  await expect(primary(page)).toBeHidden();
});
test('round actions and transparent host survive hostile page CSS', async ({ page }) => {
  await select(page); await expect(primary(page)).toBeVisible();
  for (const button of [primary(page), copy(page)]) {
    expect(await button.evaluate(el => {
      const s = getComputedStyle(el), h = getComputedStyle(el.getRootNode().host);
      return [s.borderRadius, s.borderWidth, s.width, h.backgroundColor, h.borderWidth, h.boxShadow];
    })).toEqual(['50%', '0px', '40px', 'rgba(0, 0, 0, 0)', '0px', 'none']);
  }
});
test('a recognized URL opens the displayed destination safely', async ({ page, context }) => {
  await context.route('https://example.com/**', route => route.fulfill({ body: 'Destination' }));
  await select(page, 'link'); await expect(primary(page)).toHaveAccessibleName(/Open link.*example.com/);
  const popup = context.waitForEvent('page'); await primary(page).click();
  const destination = await popup; await destination.waitForLoadState();
  expect(destination.url()).toBe('https://example.com/a?x=1#part');
  expect(await destination.evaluate(() => window.opener)).toBeNull();
  expect(await destination.evaluate(() => document.referrer)).toBe('');
});
test('copy preserves whitespace and line breaks without changing the selection', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read'], { origin: new URL(page.url()).origin });
  await select(page, 'spaces'); await expect(copy(page)).toBeVisible();
  const raw = await page.evaluate(() => getSelection().toString());
  await copy(page).click(); await expect(copy(page)).toHaveAccessibleName('Copied');
  // Windows clipboard APIs may normalize LF to CRLF at the OS boundary.
  expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(raw);
  expect(await page.evaluate(() => getSelection().toString())).toBe(raw);
});
test('HTTP copy fallback works and restores the current selection', async ({ page, context }) => {
  const securePage = page;
  await context.grantPermissions(['clipboard-read'], { origin: new URL(page.url()).origin });
  await context.route('http://qsp-http.test/**', route => route.fulfill({ contentType: 'text/html', body: '<p id="text">  HTTP fallback\nexact copy  </p>' }));
  const http = await context.newPage(); await http.goto('http://qsp-http.test');
  expect(await http.evaluate(() => navigator.clipboard)).toBeUndefined();
  await select(http); await expect(copy(http)).toBeVisible();
  const raw = await http.evaluate(() => getSelection().toString());
  await copy(http).click(); await expect(copy(http)).toHaveAccessibleName('Copied');
  expect(await http.evaluate(() => getSelection().toString())).toBe(raw);
  await securePage.bringToFront();
  expect(await securePage.evaluate(() => navigator.clipboard.readText())).toBe(raw);
});
test('copy failure is visible and announced without pretending success', async ({ page }) => {
  await select(page); await expect(copy(page)).toBeVisible();
  const { client, id } = await contentWorld(page);
  await client.send('Runtime.evaluate', { contextId: id, expression: `Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('Denied')}}});document.execCommand=()=>false;` });
  await copy(page).click();
  await expect(copy(page)).toHaveAccessibleName(/Copy failed/);
  await expect(page.locator('quick-search-plus [role=status]')).toContainText('Copy failed');
  await client.detach();
});
for (const key of ['Enter', 'Space']) test(`keyboard selection and rapid Tab + ${key} activation work`, async ({ page, context }) => {
  await context.route('https://www.google.com/**', route => route.fulfill({ body: 'Search' }));
  await page.locator('#other').dblclick({ position: { x: 25, y: 15 } });
  await expect(primary(page)).toBeVisible();
  await page.keyboard.press('Shift+ArrowRight');
  const expected = await page.evaluate(() => getSelection().toString().trim());
  await page.keyboard.press('Tab'); await expect(primary(page)).toBeFocused();
  const popup = context.waitForEvent('page'); await page.keyboard.press(key);
  const destination = await popup; await destination.waitForLoadState();
  expect(new URL(destination.url()).searchParams.get('q')).toBe(expected);
});
test('Tab reaches copy and Escape dismisses all actions', async ({ page }) => {
  await select(page); await expect(primary(page)).toBeVisible();
  await page.keyboard.press('Tab'); await expect(primary(page)).toBeFocused();
  await page.keyboard.press('Tab'); await expect(copy(page)).toBeFocused();
  await page.keyboard.press('Escape'); await expect(primary(page)).toBeHidden(); await expect(copy(page)).toBeHidden();
});
test('selection clearing, scroll and resize dismiss the whole group', async ({ page }) => {
  await select(page); await expect(primary(page)).toBeVisible();
  await page.evaluate(() => getSelection().removeAllRanges()); await expect(primary(page)).toBeHidden();
  await select(page); await expect(primary(page)).toBeVisible();
  await page.mouse.wheel(0, 200); await expect(primary(page)).toBeHidden();
  await select(page, 'other'); await expect(primary(page)).toBeVisible();
  await page.setViewportSize({ width: 800, height: 600 }); await expect(primary(page)).toBeHidden();
});
test('passwords, forms, editors and whitespace-only selections are excluded', async ({ page }) => {
  for (const id of ['input', 'textarea', 'password']) {
    await page.locator(`#${id}`).focus(); await page.keyboard.press('Control+a');
    await page.waitForTimeout(60); await expect(primary(page)).toBeHidden();
  }
  await page.locator('#editor').focus(); await select(page, 'editor');
  await page.waitForTimeout(60); await expect(primary(page)).toBeHidden();
  await page.locator('#editor').blur(); await select(page, 'space');
  await page.waitForTimeout(60); await expect(primary(page)).toBeHidden();
});
test('synthetic clicks cannot open tabs or copy text', async ({ page, context }) => {
  await select(page); await expect(primary(page)).toBeVisible();
  const before = context.pages().length;
  await primary(page).evaluate(el => el.click()); await copy(page).evaluate(el => el.click());
  expect(context.pages()).toHaveLength(before); await expect(copy(page)).toHaveAccessibleName('Copy selected text');
});
test('a stale URL action cannot navigate to an unseen destination', async ({ page, context }) => {
  await context.route('https://www.google.com/**', route => route.fulfill({ body: 'Search' }));
  await select(page, 'link'); await expect(primary(page)).toHaveAttribute('data-mode', 'open');
  await primary(page).focus();
  await page.locator('#link').evaluate(el => {
    el.textContent = 'different.example/path';
    const range = document.createRange(); range.selectNodeContents(el);
    getSelection().removeAllRanges(); getSelection().addRange(range);
  });
  const popup = context.waitForEvent('page'); await primary(page).click();
  const destination = await popup; await destination.waitForLoadState();
  expect(new URL(destination.url()).hostname).toBe('www.google.com');
  expect(new URL(destination.url()).searchParams.get('q')).toBe('different.example/path');
});
test('late clipboard completion cannot overwrite feedback for a new selection', async ({ page }) => {
  await select(page); await expect(copy(page)).toBeVisible();
  const { client, id } = await contentWorld(page);
  await client.send('Runtime.evaluate', { contextId: id, expression: `Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>new Promise(resolve=>{globalThis.finishCopy=resolve})}});` });
  await copy(page).click(); await expect(copy(page)).toBeDisabled();
  await select(page, 'other'); await expect(copy(page)).toBeEnabled();
  await client.send('Runtime.evaluate', { contextId: id, expression: 'finishCopy()' });
  await expect(copy(page)).toHaveAccessibleName('Copy selected text');
  await expect(page.locator('quick-search-plus [role=status]')).toHaveText('');
  await client.detach();
});
test('entire toolbar including count fits a small viewport without overlap', async ({ page }) => {
  const options = await openOptions(page);
  await options.locator('#count-threshold').fill('1'); await options.getByRole('button', { name: 'Save changes' }).click();
  await expect(options.getByRole('status')).toHaveText('Saved.'); await options.close(); await page.bringToFront();
  await page.setViewportSize({ width: 360, height: 320 });
  await select(page); await expect(badge(page)).toBeVisible();
  const a = await primary(page).boundingBox(), b = await copy(page).boundingBox(), c = await badge(page).boundingBox();
  expect(a.x).toBeGreaterThanOrEqual(8); expect(a.y).toBeGreaterThanOrEqual(8);
  expect(b.x).toBeGreaterThanOrEqual(a.x + a.width); expect(c.x).toBeGreaterThanOrEqual(b.x + b.width);
  expect(c.x + c.width).toBeLessThanOrEqual(352); expect(a.y + a.height).toBeLessThanOrEqual(312);
});
