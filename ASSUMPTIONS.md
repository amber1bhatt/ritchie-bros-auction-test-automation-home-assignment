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
- The API tests (part 4) will send requests through the browser context, so
  they get the same cookies.

## General

- Counts, dates and lots change, so tests check shape, minimums and membership
  instead of exact values. Expected values are in `test-data/constants.ts`.
- No accounts, bids or form submissions.

## Open questions

- Exact `__NEXT_DATA__` field names for locations, yard details, events and
  `itemsInYard`. Need to check the live payloads.
- Whether the search total is `results.totalAmount` and the lot name is
  `assetDescription`.
