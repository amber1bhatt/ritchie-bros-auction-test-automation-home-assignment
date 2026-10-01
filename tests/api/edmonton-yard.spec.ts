import { test, expect } from '../../src/fixtures/test';
import { YardPage } from '../../src/pages/yard.page';
import { EDMONTON_YARD, THRESHOLDS } from '../../test-data/constants';

test('API 2 - Edmonton yard page JSON', async ({ page }) => {
  const yard = new YardPage(page, 'edmonton-ab', EDMONTON_YARD.name);
  await yard.open();

  await test.step('A2.2 yard name, address, phone and hours', async () => {
    const details = await yard.details();
    expect(details.name).toBe(EDMONTON_YARD.name);
    expect(details.address.addressLine1).toContain(EDMONTON_YARD.addressLine);
    expect(details.address.city).toBe(EDMONTON_YARD.city);
    expect(details.address.zipPostalCode).toBe(EDMONTON_YARD.postalCode);
    expect(details.contactPhone).toBeTruthy();
    expect(details.pickupHoursFrom).toBeTruthy();
    expect(details.pickupHoursTo).toBeTruthy();
  });

  await test.step('A2.3 upcoming events', async () => {
    const events = await yard.upcomingEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    for (const event of events) {
      expect(event.event_advertised_name.length).toBeGreaterThan(0);
      expect(event.event_start_date_time || event.date_of_event).toBeTruthy();
    }
    const mentionsEdmonton = events.some((e) => /edmonton|nisku/i.test(e.event_advertised_name));
    expect(mentionsEdmonton).toBe(true);
  });

  await test.step('A2.4 equipment categories in itemsInYard', async () => {
    const categories = await yard.itemCategories();
    expect(categories.length).toBeGreaterThan(THRESHOLDS.itemsInYardCategories);

    expect(categories.every((c) => c.categoryLocalized.length > 0)).toBe(true);

    const quantities = categories
      .map((c) => c.totalAssets)
      .filter((n): n is number => n !== undefined);
    expect(quantities.every((n) => n >= 0)).toBe(true);

    expect(categories.map((c) => c.categoryLocalized)).toContain('Excavators');
  });
});
