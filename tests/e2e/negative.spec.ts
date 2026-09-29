import { test, expect } from '../../src/fixtures/test';
import { SearchResultsPage } from '../../src/pages/search-results.page';

test.describe('Negative e2e', () => {
  test('unknown yard slug redirects to the 404 page', async ({ page }) => {
    await page.goto('/lp/not-a-real-yard-xyz', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/not-found/);
    await expect(page).toHaveTitle(/404|not found/i);
  });

  test('a country with no auction sites is absent from the directory', async ({
    locationsPage,
  }) => {
    await locationsPage.open();

    const countries = await locationsPage.countryNames();
    expect(countries).not.toContain('Antarctica');
    expect(await locationsPage.group('Antarctica').exists()).toBe(false);
  });

  test('gibberish search falls back to the full catalog rather than erroring', async ({ page }) => {
    // no empty state here, the site just shows the full catalog
    const search = new SearchResultsPage(page, 'zzzzqqqxnotarealthing123');
    await search.open();

    await expect(search.resultTotal.first()).toBeVisible();
    expect(await search.displayedTotal()).toBeGreaterThan(0);
    expect(await search.lotCards.count()).toBeGreaterThan(0);
  });
});
