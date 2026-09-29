import { test, expect } from '../../src/fixtures/test';
import type { SearchResponse, SearchResults } from '../../src/models';
import { logger } from '../../src/utils/logger';
import { SEARCH } from '../../test-data/constants';

test('API 3 - Edmonton inventory search', async ({ api }) => {
  let results: SearchResults | undefined;

  await test.step('A3.1 response is HTTP 200 and JSON', async () => {
    const response = await api.searchRaw({ freeText: SEARCH.edmonton });
    const contentType = response.headers()['content-type'];
    expect(
      response.status(),
      `POST /api/search {freeText: "${SEARCH.edmonton}"} returns ${response.status()}`,
    ).toBe(200);
    expect(contentType, `content-type is JSON ("${contentType}")`).toContain('application/json');

    results = ((await response.json()) as SearchResponse).results;
    expect(results, 'body has a results object').toBeDefined();
  });

  await test.step('A3.2 full hit count from results.totalAmount', async () => {
    const total = results!.totalAmount;
    expect(typeof total, 'results.totalAmount is a number').toBe('number');
    expect(total, `results.totalAmount: ${total} (must be > 0)`).toBeGreaterThan(0);
  });

  await test.step('A3.3 first page is non-empty and every record has assetDescription', async () => {
    expect(
      results!.fallbackApplied,
      `Edmonton matches exactly (fallbackApplied: ${results!.fallbackApplied})`,
    ).not.toBe(true);
    expect(results!.records, 'results.records is present').toBeDefined();
    const records = results!.records!;
    expect(
      records.length,
      `records on the first page: ${records.length} (must be > 0)`,
    ).toBeGreaterThan(0);

    const unnamed = records.filter(
      (r) => typeof r.assetDescription !== 'string' || r.assetDescription.trim() === '',
    );
    expect(unnamed, `all ${records.length} records have an assetDescription`).toEqual([]);
  });

  await test.step('A3.4 log the total and first 5 titles', async () => {
    logger.info(`API total for "${SEARCH.edmonton}": ${results!.totalAmount}`);
    logger.list(
      `First ${SEARCH.logFirstN} asset descriptions`,
      results!.records!.slice(0, SEARCH.logFirstN).map((r) => r.assetDescription),
    );
  });
});
