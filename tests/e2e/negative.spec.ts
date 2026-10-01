import { test, expect, TAG } from '../../src/fixtures/test';
import { SearchResultsPage } from '../../src/pages/search-results.page';
import { YardPage } from '../../src/pages/yard.page';
import { NEGATIVE, SEARCH } from '../../test-data/constants';

test.describe('Negative e2e', { tag: [TAG.negative, TAG.regression] }, () => {
  test('unknown yard slug redirects to the 404 page', { tag: TAG.yard }, async ({ page }) => {
    const yard = new YardPage(page, NEGATIVE.unknownYardSlug, 'Not A Real Yard');
    await yard.open();

    await expect(page, `/lp/${NEGATIVE.unknownYardSlug} redirects to /not-found`).toHaveURL(
      /\/not-found/,
    );
    await expect(page, 'page title says 404 / not found').toHaveTitle(/404|not found/i);
    await expect(yard.detailsPanel, 'no yard details are rendered').toHaveCount(0);
  });

  test(
    'a country with no auction sites is absent from the directory',
    { tag: TAG.directory },
    async ({ locationsPage }) => {
      await locationsPage.open();
      await expect(locationsPage.group('Canada').heading, 'directory has loaded').toBeVisible();

      expect(
        await locationsPage.countryNames(),
        `${NEGATIVE.absentCountry} is not in the country list`,
      ).not.toContain(NEGATIVE.absentCountry);
      expect(
        await locationsPage.group(NEGATIVE.absentCountry).exists(),
        `there is no ${NEGATIVE.absentCountry} heading`,
      ).toBe(false);
    },
  );

  test(
    'local representatives shows an empty state before a site is selected',
    { tag: TAG.directory },
    async ({ locationsPage }) => {
      await locationsPage.open();
      await locationsPage.toggle.showLocalRepresentatives();

      await expect(
        locationsPage.localRepresentativesContent,
        '"Search for representatives" is shown',
      ).toBeVisible();
      await expect(
        locationsPage.localRepresentativesEmptyState,
        '"No results" is shown before a site is picked',
      ).toBeVisible();
    },
  );

  test(
    'unmatched search term shows the no-matches state and no lots',
    { tag: TAG.search },
    async ({ page }) => {
      const search = new SearchResultsPage(page, SEARCH.noMatch);
      await search.open();

      await expect(search.noExactMatches, '"No exact matches" message is shown').toBeVisible();
      await expect(search.noExactMatches, 'message repeats the search term').toContainText(
        `"${SEARCH.noMatch}"`,
      );
      await expect(search.lotCards, 'no lot cards are shown').toHaveCount(0);
      await expect(search.pagerTotal, 'no result total is shown').toBeHidden();
    },
  );

  test(
    'partially matching term flags no exact match but still offers lots',
    { tag: TAG.search },
    async ({ page }) => {
      // falls back to "results matching fewer words", which matches "Lot 123"
      const search = new SearchResultsPage(page, SEARCH.partialMatch);
      await search.open();

      await expect(search.noExactMatches, '"No exact matches" message is shown').toBeVisible();
      await expect(search.lotCards.first(), 'fallback lots are still shown').toBeVisible();
      const total = await search.displayedTotal();
      expect(total, `fallback total: ${total} (must be > 0)`).toBeGreaterThan(0);
    },
  );
});
