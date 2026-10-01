import { test as base, type Page } from '@playwright/test';

import { ApiClient } from '../api/api-client';
import { bootstrapSession, type SiteSession } from '../api/session';
import { env } from '../config/env';
import { LocationsDirectoryPage } from '../pages/locations-directory.page';
import { SearchResultsPage } from '../pages/search-results.page';
import { YardPage } from '../pages/yard.page';
import { blockThirdPartyTracking } from '../utils/third-party';
import { EDMONTON_YARD, SEARCH } from '../../test-data/constants';

interface TestFixtures {
  locationsPage: LocationsDirectoryPage;
  edmontonYard: YardPage;
  edmontonSearch: SearchResultsPage;
  api: ApiClient;
}

interface WorkerFixtures {
  apiSession: { page: Page; session: SiteSession };
}

// specs import test from here, not from @playwright/test
export const test = base.extend<TestFixtures, WorkerFixtures>({
  context: async ({ context }, use) => {
    if (env.blockThirdParty) await blockThirdPartyTracking(context);
    await use(context);
  },
  locationsPage: async ({ page }, use) => {
    await use(new LocationsDirectoryPage(page));
  },
  edmontonYard: async ({ page }, use) => {
    await use(new YardPage(page, EDMONTON_YARD.slug, EDMONTON_YARD.name));
  },
  edmontonSearch: async ({ page }, use) => {
    await use(new SearchResultsPage(page, SEARCH.edmonton));
  },

  // one session per worker instead of loading /lp before every api test.
  // the api tests only read, so sharing cookies between them is fine
  apiSession: [
    async ({ browser }, use, workerInfo) => {
      // worker fixtures don't get the project's context options
      const { baseURL, userAgent, viewport, deviceScaleFactor } = workerInfo.project.use;
      const context = await browser.newContext({ baseURL, userAgent, viewport, deviceScaleFactor });
      if (env.blockThirdParty) await blockThirdPartyTracking(context);
      const page = await context.newPage();
      const session = await bootstrapSession(page);
      // stays open, api calls are sent from this page
      await use({ page, session });
      await context.close();
    },
    { scope: 'worker' },
  ],
  api: async ({ apiSession }, use) => {
    await use(new ApiClient(apiSession.page, apiSession.session));
  },
});

export { expect } from '@playwright/test';
export { TAG } from './tags';
