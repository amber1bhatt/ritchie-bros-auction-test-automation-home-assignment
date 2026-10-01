import type { Page } from '@playwright/test';

export interface NextData<T = unknown> {
  props: { pageProps: T };
  buildId: string;
  query: Record<string, unknown>;
}

export async function readNextData<T = unknown>(page: Page): Promise<NextData<T>> {
  const raw = await page.locator('#__NEXT_DATA__').textContent();
  if (!raw) {
    throw new Error('__NEXT_DATA__ script not found on page');
  }
  return JSON.parse(raw) as NextData<T>;
}

export async function readPageProps<T = unknown>(page: Page): Promise<T> {
  const data = await readNextData<T>(page);
  return data.props.pageProps;
}
