import { test, expect } from '../../src/fixtures/test';
import { YardPage } from '../../src/pages/yard.page';
import { EDMONTON_YARD, THRESHOLDS } from '../../test-data/constants';

const ITEMS_ALTERNATIVES = [
  'Harvesting Equipment',
  'Agricultural Tractors',
  'Sprayers',
  'Excavator Attachments',
];

test('Scenario 3 - Edmonton yard page', async ({ page }) => {
  const yard = new YardPage(page, 'edmonton-ab', EDMONTON_YARD.name);
  await yard.open();

  await test.step('3.1 details: address, office hours, phone', async () => {
    await expect(yard.detailsHeading).toBeVisible();
    await expect(yard.text(new RegExp(EDMONTON_YARD.addressLine, 'i'))).toBeVisible();
    await expect(yard.text(new RegExp(EDMONTON_YARD.postalCode, 'i'))).toBeVisible();
    await expect(yard.text(/mon\s*-\s*fri/i).first()).toBeVisible();

    const details = await yard.details();
    expect(details.address.city).toBe(EDMONTON_YARD.city);
    expect(details.address.provinceStateCode).toBe(EDMONTON_YARD.province);
    expect(details.contactPhone).toBeTruthy();
  });

  await test.step('3.2 auction events', async () => {
    await expect(yard.auctionEventsHeading).toBeVisible();

    const events = await yard.upcomingEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    for (const event of events) {
      expect(event.event_advertised_name).toBeTruthy();
      expect(event.event_start_date_time || event.date_of_event).toBeTruthy();
    }
  });

  await test.step('3.3 about this yard', async () => {
    await expect(yard.aboutHeading).toBeVisible();
    await expect(yard.aboutSection).toBeVisible();
  });

  await test.step('3.4 items in yard carousel', async () => {
    await expect(yard.itemsCarousel.heading).toBeVisible();

    const categories = await yard.itemCategories();
    expect(categories.length).toBeGreaterThan(THRESHOLDS.itemsInYardCategories);
    for (const category of categories) {
      expect(category.categoryLocalized).toBeTruthy();
      if (category.totalAssets !== undefined) {
        expect(category.totalAssets).toBeGreaterThanOrEqual(0);
      }
    }

    const categoryNames = categories.map((c) => c.categoryLocalized);
    expect(categoryNames).toContain('Excavators');
    expect(categoryNames.some((name) => ITEMS_ALTERNATIVES.includes(name))).toBe(true);
  });

  await test.step('3.5 become a seller CTA (no submit)', async () => {
    await expect(yard.becomeSellerHeading).toBeVisible();
    await expect(yard.text(/\+1-866-901-2104/)).toBeVisible();
  });

  await test.step('3.6 representatives tab', async () => {
    await yard.openRepresentatives();

    const reps = await yard.representatives();
    expect(reps.length).toBeGreaterThanOrEqual(1);

    const first = reps[0]!;
    await expect(yard.text(new RegExp(first.name, 'i')).first()).toBeVisible();
    expect(first.region.join(' ')).not.toHaveLength(0);
    const { phone, mobile, email } = first.contacts;
    expect(Boolean(phone || mobile || email)).toBe(true);
  });
});
