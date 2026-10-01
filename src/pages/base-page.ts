import type { Page, Response } from '@playwright/test';

import { gotoWithRetry } from '../utils/navigation';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  protected abstract readonly path: string;

  async open(): Promise<Response | null> {
    return gotoWithRetry(this.page, this.path);
  }

  async title(): Promise<string> {
    return this.page.title();
  }
}
