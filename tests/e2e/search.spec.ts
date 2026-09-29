import { test, expect } from '../../src/fixtures/test';
import { SearchResultsPage } from '../../src/pages/search-results.page';
import { logger } from '../../src/utils/logger';

test('Scenario 4 - Edmonton inventory search', async ({ page }) => {
  const search = new SearchResultsPage(page, 'Edmonton');

  await test.step('4.1 open the Edmonton search', async () => {
    await search.open();
    await expect(page).toHaveURL(/freeText=Edmonton/i);
    await expect(search.resultTotal.first()).toBeVisible();
  });

  await test.step('4.2 results total and titles', async () => {
    const total = await search.displayedTotal();
    expect(total).toBeGreaterThan(0);

    const cardCount = await search.lotCards.count();
    expect(cardCount).toBeGreaterThan(0);

    const titleCount = await search.lotTitles.count();
    expect(titleCount).toBe(cardCount);
    const titles = await search.firstTitles(cardCount);
    expect(titles.every((t) => t.length > 0)).toBe(true);

    const firstCardText = (await search.lotCards.first().innerText()).trim();
    expect(firstCardText.length).toBeGreaterThan(0);

    const first5 = titles.slice(0, 5);
    logger.info(`Displayed total for "Edmonton": ${total}`);
    logger.list('First 5 lot titles', first5);
  });
});
