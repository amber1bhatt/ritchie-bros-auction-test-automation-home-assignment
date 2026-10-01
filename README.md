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
tests/e2e/          e2e specs
tests/api/          api specs
src/pages/          page objects
src/components/     shared UI pieces
src/api/            api client and payload helpers
src/models/         types
src/fixtures/       playwright fixtures
src/utils/          logger and helpers
test-data/          expected values and thresholds
```

## CI

`.github/workflows/tests.yml` runs on every push and PR:

- `quality`: lint and typecheck. Failures block.
- `tests`: Playwright under `xvfb-run` (headed needs a display on Linux), with
  the report and traces uploaded as artifacts.

The `tests` job doesn't block for now, since the site may block GitHub's IP
ranges. Set a `BASE_URL` repo variable, or use **Run workflow**, to point it at
another environment.

## Notes

Counts, dates and lots change, so tests check shape, minimums and membership,
not exact numbers.
