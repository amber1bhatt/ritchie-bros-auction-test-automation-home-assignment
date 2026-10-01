import { test, expect, TAG } from '../../src/fixtures/test';
import { logger } from '../../src/utils/logger';
import { SEARCH } from '../../test-data/constants';

test(
  'Scenario 4 - Edmonton inventory search',
  { tag: [TAG.smoke, TAG.regression, TAG.search] },
  async ({ page, edmontonSearch: search }) => {
    await test.step('4.1 open the Edmonton search', async () => {
      const response = await search.open();
      expect(response?.ok(), `search page loads (HTTP ${response?.status()})`).toBe(true);

      await expect(page, `URL has freeText=${SEARCH.edmonton}`).toHaveURL(
        new RegExp(`freeText=${SEARCH.edmonton}`, 'i'),
      );
      await expect(search.searchInput, `search box contains "${SEARCH.edmonton}"`).toHaveValue(
        SEARCH.edmonton,
      );
      await expect(search.countHeader, `results header is for "${SEARCH.edmonton}"`).toContainText(
        `"${SEARCH.edmonton}"`,
      );
    });

    await test.step('4.2 displayed total, titles, and card fields', async () => {
      await expect(search.pagerTotal, 'result total is shown').toBeVisible();

      const pagerText = (await search.pagerTotal.textContent())?.trim();
      const headerText = (await search.countHeader.textContent())?.trim();
      const total = await search.displayedTotal();
      const headerTotal = await search.headerTotal();
      expect(total, `displayed total: ${total} from "${pagerText}" (must be > 0)`).toBeGreaterThan(
        0,
      );
      expect(
        headerTotal,
        `header total: ${headerTotal} from "${headerText}" (must be > 0)`,
      ).toBeGreaterThan(0);

      const cards = await search.cardSummaries();
      expect(cards.length, `lots on the first page: ${cards.length} (must be > 0)`).toBeGreaterThan(
        0,
      );

      const untitled = cards.filter((c) => c.title === '');
      expect(untitled, `all ${cards.length} lots have a title`).toEqual([]);

      // not every card shows these
      const withLocation = cards.filter((c) => c.location !== null).length;
      const withClosing = cards.filter((c) => c.closing !== null).length;
      const emptyFields = cards.filter((c) => c.location === '' || c.closing === '');
      expect(
        emptyFields,
        `shown location/closing fields are non-empty (${withLocation} locations, ${withClosing} closing dates)`,
      ).toEqual([]);

      logger.info(`Displayed total for "${SEARCH.edmonton}": ${total}`);
      logger.list(
        `First ${SEARCH.logFirstN} lot titles`,
        cards.slice(0, SEARCH.logFirstN).map((c) => c.title),
      );
    });
  },
);
