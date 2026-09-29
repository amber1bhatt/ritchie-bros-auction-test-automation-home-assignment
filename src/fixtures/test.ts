import { test as base } from '@playwright/test';

import { ApiClient } from '../api/api-client';
import { LocationsDirectoryPage } from '../pages/locations-directory.page';

interface Fixtures {
  locationsPage: LocationsDirectoryPage;
  api: ApiClient;
}

export const test = base.extend<Fixtures>({
  locationsPage: async ({ page }, use) => {
    await use(new LocationsDirectoryPage(page));
  },
  api: async ({ page }, use) => {
    await use(new ApiClient(page));
  },
});

export { expect } from '@playwright/test';
