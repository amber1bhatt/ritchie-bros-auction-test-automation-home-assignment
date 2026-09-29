# Ritchie Bros. Auction - Test Automation

E2E and API tests for the Ritchie Bros. locations site, written in TypeScript
with Playwright.

The tests run against the live production site. They don't create accounts,
place bids, or submit the "Become a seller" form.

## Prerequisites

- Node.js 20 (`nvm use`)
- npm 10+

## Setup

```bash
npm ci
npx playwright install chromium
```

## Running

```bash
npm test            # everything
npm run test:e2e    # e2e only
npm run test:api    # api only
npm run report      # open the last HTML report
```

Tests run headed because the site returns 403 to headless Chromium (see
`ASSUMPTIONS.md`).

## Checks

```bash
npm run typecheck
npm run lint
npm run format
```

## Structure

```
tests/e2e/          e2e specs (part 3)
tests/api/          api specs (part 4)
src/pages/          page objects
src/components/     shared UI pieces
src/api/            api client and payload helpers
src/models/         types
src/fixtures/       playwright fixtures
src/utils/          logger and helpers
test-data/          expected values and thresholds
```

## Notes

Counts, dates and lots change, so tests check shape, minimums and membership,
not exact numbers.
