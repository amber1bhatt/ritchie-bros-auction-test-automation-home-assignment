import { test, expect, TAG } from '../../src/fixtures/test';
import { EDMONTON_YARD } from '../../test-data/constants';

test(
  'Scenario 2 - Open a yard from the directory',
  { tag: [TAG.smoke, TAG.regression, TAG.directory, TAG.yard] },
  async ({ page, locationsPage, edmontonYard }) => {
    await test.step('open the directory', async () => {
      const response = await locationsPage.open();
      expect(response?.ok(), `/lp loads (HTTP ${response?.status()})`).toBe(true);
    });

    await test.step('2.1 Edmonton is under Canada and not a satellite', async () => {
      const canada = await locationsPage.sitesFor(EDMONTON_YARD.country);
      const edmonton = canada.find((s) => s.name === EDMONTON_YARD.name);
      expect(edmonton, 'Edmonton is listed under Canada').toBeDefined();
      expect(edmonton?.isSatellite, 'Edmonton has no * (not a satellite)').toBe(false);
    });

    await test.step('2.2 clicking Edmonton opens the yard page', async () => {
      await locationsPage.openSite(EDMONTON_YARD.country, EDMONTON_YARD.name);
      await expect(page, `URL contains /lp/${EDMONTON_YARD.slug} (${page.url()})`).toHaveURL(
        new RegExp(`/lp/${EDMONTON_YARD.slug}(?:[/?#]|$)`),
      );
      await expect(edmontonYard.heading, `yard heading is "${EDMONTON_YARD.name}"`).toHaveText(
        EDMONTON_YARD.name,
      );
    });
  },
);
