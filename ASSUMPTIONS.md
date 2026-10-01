# Assumptions and notes

Things I found while building this, and the decisions that came out of them.

## Setup

- TypeScript and `@playwright/test` for both suites. npm, lockfile committed.
- Chromium only for now.
- Node 20 (`.nvmrc`, `engines`).
- `tests/e2e` and `tests/api` are separate Playwright projects.

## Bot protection

- `curl` and plain `fetch` to `/lp` get a 403.
- Headless Chromium also gets a 403 ("Access Denied"), even with a real user
  agent, so the suite runs headed. CI will need xvfb for that.
- `page.request` shares the browser context's cookies, so the API client gets
  through too.

## General

- Counts, dates and lots change, so tests check shape, minimums and membership
  instead of exact values. Expected values are in `test-data/constants.ts`.
- No accounts, bids or form submissions.

## /lp

- `h1` is "Locations". There are 16 `h4` country headings, and each one is
  followed by a `<ul>` of `<a href="/lp/{slug}">City</a>`. Satellites have a
  trailing `*`.
- Page JSON: `pageProps.yards` (74 today). Each yard has `name`, `type`
  (`Satellite` or `Permanent`), `address` (`addressLine1`, `city`,
  `provinceStateCode`, `country`, `countryCode`, `zipPostalCode`),
  `contactPhone` and `pickupHoursFrom/To`.
- Page JSON for `/lp/edmonton-ab` has `yardDetails` (same shape as above),
  `upcomingEvents[]` (`event_advertised_name`, `event_start_date_time`,
  `event_end_date_time`) and `itemsInYard[]`. Each `itemsInYard` group has its
  own `categories[]` of `{categoryLocalized, totalAssets}`, so they need
  flattening to count.

## Search

- `POST /api/search` with `{ searchParams: { freeText } }` returns 200 JSON.
  Totals are in `results.totalAmount`, and lots are in `results.records[]`,
  using `assetDescription` for the name (there's no `title`).

## Open questions

- `freeText: "Edmonton"` returns the full catalog total (~93k), not an Edmonton
  total (~2290), and the first lots have nothing to do with Edmonton. The page
  probably sends another param or a different body. Need to sort this out
  before API 3 checks the total.
- Not sure yet if the site toggle is a `button` or a `tab`. `SiteToggle`
  assumes `button` for now. Check when doing 1.9.
