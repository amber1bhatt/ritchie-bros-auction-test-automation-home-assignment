import { test, expect } from '../../src/fixtures/test';
import { YardPage } from '../../src/pages/yard.page';
import { EDMONTON_YARD } from '../../test-data/constants';

test('Scenario 2 - Open a yard from the directory', async ({ page, locationsPage }) => {
  await test.step('open the directory', async () => {
    await locationsPage.open();
  });

  await test.step('2.1 Edmonton is under Canada and not a satellite', async () => {
    const canada = await locationsPage.sitesFor('Canada');
    const edmonton = canada.find((s) => s.name === EDMONTON_YARD.name);
    expect(edmonton, 'Edmonton should be listed under Canada').toBeDefined();
    expect(edmonton?.isSatellite).toBe(false);
  });

  await test.step('2.2 clicking Edmonton opens the yard page', async () => {
    await locationsPage.openSite('Canada', EDMONTON_YARD.name);
    await expect(page).toHaveURL(/\/lp\/edmonton-ab/);

    const yard = new YardPage(page, 'edmonton-ab', EDMONTON_YARD.name);
    await expect(yard.heading).toBeVisible();
  });
});
