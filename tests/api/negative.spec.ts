import { test, expect } from '../../src/fixtures/test';
import type { RedirectPageProps } from '../../src/models';
import { NEGATIVE, SEARCH } from '../../test-data/constants';

test.describe('Negative API', () => {
  test('search: malformed JSON body returns 400', async ({ api }) => {
    // has to be a Buffer, a plain string gets re-encoded and returns 200
    const response = await api.postRaw('/api/search', Buffer.from('{ not valid json', 'utf8'));
    expect(response.status(), `malformed body returns ${response.status()}`).toBe(400);
  });

  test('search: unmatched freeText returns 200 with zero hits and fallback flagged', async ({
    api,
  }) => {
    const results = await api.search({ freeText: SEARCH.noMatch });
    expect(results.totalAmount, `totalAmount is ${results.totalAmount}`).toBe(0);
    expect(results.records ?? [], 'no records are returned').toHaveLength(0);
    expect(results.fallbackApplied, `fallbackApplied is ${results.fallbackApplied}`).toBe(true);
  });

  test('search: empty freeText returns the unfiltered catalog, not an error', async ({ api }) => {
    const [empty, edmonton] = await Promise.all([
      api.search({ freeText: '' }),
      api.search({ freeText: SEARCH.edmonton }),
    ]);
    expect(empty.records ?? [], 'records are returned').not.toHaveLength(0);
    expect(
      empty.totalAmount,
      `empty search total ${empty.totalAmount} is bigger than Edmonton's ${edmonton.totalAmount}`,
    ).toBeGreaterThan(edmonton.totalAmount);
  });

  test('page JSON: unknown yard slug redirects to /not-found', async ({ api }) => {
    const response = await api.pageDataRaw(`/lp/${NEGATIVE.unknownYardSlug}`);
    const contentType = response.headers()['content-type'];
    expect(response.status(), `returns ${response.status()}`).toBe(200);
    expect(contentType, `content-type is JSON ("${contentType}")`).toContain('application/json');

    const { pageProps } = (await response.json()) as {
      pageProps: RedirectPageProps & { yardDetails?: unknown };
    };
    expect(pageProps.__N_REDIRECT, `redirects to ${pageProps.__N_REDIRECT}`).toBe('/not-found');
    expect(pageProps.yardDetails, 'has no yardDetails').toBeUndefined();
  });

  test('unknown /api route returns 404', async ({ api }) => {
    const response = await api.postRaw(NEGATIVE.unknownApiRoute, {});
    expect(response.status(), `POST ${NEGATIVE.unknownApiRoute} returns ${response.status()}`).toBe(
      404,
    );
  });
});
