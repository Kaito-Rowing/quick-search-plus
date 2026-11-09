import { test, expect, primary, copy, badge, select, openOptions } from './fixtures.mjs';

test('real options persist, reload and change actions in an already-open page', async ({ page, context }) => {
  const options = await openOptions(page);
  await expect(options.locator('#copy-enabled')).toBeChecked();
  await expect(options.locator('#count-threshold')).toHaveValue('30');
  await options.locator('#copy-enabled').uncheck(); await options.locator('#open-url-enabled').uncheck();
  await options.locator('#count-threshold').fill('1');
  await options.getByRole('button', { name: 'Save changes' }).click(); await expect(options.getByRole('status')).toHaveText('Saved.');
  await options.reload(); await expect(options.locator('fieldset')).toBeEnabled();
  await expect(options.locator('#copy-enabled')).not.toBeChecked(); await expect(options.locator('#open-url-enabled')).not.toBeChecked();
  await expect(options.locator('#count-threshold')).toHaveValue('1');
  await options.close(); await page.bringToFront();
  await select(page, 'link'); await expect(primary(page)).toHaveAccessibleName('Search Google in a new tab');
  await expect(copy(page)).toBeHidden(); await expect(badge(page)).toBeVisible();
  await context.route('https://www.google.com/**', route => route.fulfill({ body: 'Search' }));
  const popup = context.waitForEvent('page'); await primary(page).click();
  const destination = await popup; await destination.waitForLoadState();
  expect(new URL(destination.url()).searchParams.get('q')).toBe('example.com/a?x=1#part');
});
test('character counts use graphemes and the configured inclusive threshold', async ({ page }) => {
  const options = await openOptions(page);
  await options.locator('#count-threshold').fill('5'); await options.getByRole('button', { name: 'Save changes' }).click();
  await expect(options.getByRole('status')).toHaveText('Saved.'); await page.bringToFront();
  await select(page, 'emoji'); await expect(badge(page)).toHaveText('5 chars');
  await options.bringToFront(); await options.locator('#count-threshold').fill('6');
  await options.getByRole('button', { name: 'Save changes' }).click(); await expect(options.getByRole('status')).toHaveText('Saved.');
  await page.bringToFront(); await select(page, 'emoji'); await expect(primary(page)).toBeVisible(); await expect(badge(page)).toBeHidden();
});
test('invalid thresholds cannot save; disabled count, reset and defaults behave predictably', async ({ page }) => {
  const options = await openOptions(page);
  for (const value of ['0', '1.5', '100001']) {
    await options.locator('#count-threshold').fill(value); await options.getByRole('button', { name: 'Save changes' }).click();
    expect(await options.locator('#count-threshold').evaluate(el => el.validity.valid)).toBe(false);
    expect(await options.evaluate(async () => (await chrome.storage.sync.get('characterCountThreshold')).characterCountThreshold)).toBeUndefined();
  }
  await options.locator('#count-enabled').uncheck(); await expect(options.locator('#count-threshold')).toBeDisabled();
  await options.getByRole('button', { name: 'Save changes' }).click(); await expect(options.getByRole('status')).toHaveText('Saved.');
  await page.bringToFront(); await select(page); await expect(primary(page)).toBeVisible(); await expect(badge(page)).toBeHidden();
  await options.bringToFront(); await options.getByRole('button', { name: 'Reset form' }).click();
  await expect(options.locator('#count-enabled')).toBeChecked(); await expect(options.locator('#count-threshold')).toHaveValue('30');
  await expect(options.getByRole('status')).toContainText('Save to apply');
  expect(await options.evaluate(async () => (await chrome.storage.sync.get('characterCountEnabled')).characterCountEnabled)).toBe(false);
  await options.getByRole('button', { name: 'Save changes' }).click(); await expect(options.getByRole('status')).toHaveText('Saved.');
});
test('storage failure keeps edited values and displays a recoverable error', async ({ page }) => {
  const options = await openOptions(page);
  await options.locator('#count-threshold').fill('42');
  await options.evaluate(() => { chrome.storage.sync.set = async () => { throw new Error('Storage quota'); }; });
  await options.getByRole('button', { name: 'Save changes' }).click();
  await expect(options.getByRole('status')).toContainText('Could not save settings');
  await expect(options.locator('#count-threshold')).toHaveValue('42'); await expect(options.locator('fieldset')).toBeEnabled();
});
