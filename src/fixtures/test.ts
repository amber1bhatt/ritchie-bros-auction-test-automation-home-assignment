import { test as base } from '@playwright/test';

import { ApiClient } from '../api/api-client';
import { bootstrapSession } from '../api/session';
import { LocationsDirectoryPage } from '../pages/locations-directory.page';
import { SearchResultsPage } from '../pages/search-results.page';
import { YardPage } from '../pages/yard.page';
import { EDMONTON_YARD, SEARCH } from '../../test-data/constants';

interface Fixtures {
  locationsPage: LocationsDirectoryPage;
  edmontonYard: YardPage;
  edmontonSearch: SearchResultsPage;
  api: ApiClient;
}

export const test = base.extend<Fixtures>({
  locationsPage: async ({ page }, use) => {
    await use(new LocationsDirectoryPage(page));
  },
  edmontonYard: async ({ page }, use) => {
    await use(new YardPage(page, EDMONTON_YARD.slug, EDMONTON_YARD.name));
  },
  edmontonSearch: async ({ page }, use) => {
    await use(new SearchResultsPage(page, SEARCH.edmonton));
  },
  api: async ({ page }, use) => {
    const session = await bootstrapSession(page);
    await use(new ApiClient(page.request, session));
  },
});

export { expect } from '@playwright/test';
