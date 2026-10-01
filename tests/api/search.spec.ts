import { test, expect } from '../../src/fixtures/test';
import { URLS } from '../../test-data/constants';
import { logger } from '../../src/utils/logger';

test('API 3 - Edmonton inventory search', async ({ page, api }) => {
  // load a page first so requests have the WAF cookies
  await page.goto(URLS.edmontonSearch, { waitUntil: 'domcontentloaded' });

  await test.step('A3.1 response is HTTP 200 and JSON', async () => {
    const response = await api.searchRaw({ freeText: 'Edmonton' });
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });

  await test.step('A3.2-A3.4 totals, records and logging', async () => {
    const results = await api.search({ freeText: 'Edmonton' });

    expect(results.totalAmount).toBeGreaterThan(0);
    expect(results.records.length).toBeGreaterThan(0);
    expect(results.records.every((r) => typeof r.assetDescription === 'string')).toBe(true);

    const first5 = results.records.slice(0, 5).map((r) => r.assetDescription);
    logger.info(`API total for "Edmonton": ${results.totalAmount}`);
    logger.list('First 5 asset descriptions', first5);
  });
});
