import { test, expect } from '../../src/fixtures/test';
import { URLS } from '../../test-data/constants';

test.describe('Negative API', () => {
  test.beforeEach(async ({ page }) => {
    // load a page first so requests have the WAF cookies
    await page.goto(URLS.edmontonSearch, { waitUntil: 'domcontentloaded' });
  });

  test('malformed JSON body returns 400', async ({ page }) => {
    // has to be a Buffer, a plain string gets re-encoded and returns 200
    const response = await page.request.post('/api/search', {
      headers: { 'content-type': 'application/json' },
      data: Buffer.from('{ not valid json', 'utf8'),
    });
    expect(response.status()).toBe(400);
  });

  test('empty freeText returns the full catalog rather than an error', async ({ api }) => {
    // no query term just returns the whole catalog
    const results = await api.search({ freeText: '' });
    expect(results.totalAmount).toBeGreaterThan(0);
    expect(results.records.length).toBeGreaterThan(0);
  });

  test('unknown yard page does not expose valid yard JSON', async ({ page }) => {
    await page.goto('/lp/not-a-real-yard-xyz', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/not-found/);

    const yardDetails = await page
      .locator('#__NEXT_DATA__')
      .evaluate((el) => JSON.parse(el.textContent ?? '{}')?.props?.pageProps?.yardDetails);
    expect(yardDetails).toBeUndefined();
  });
});
