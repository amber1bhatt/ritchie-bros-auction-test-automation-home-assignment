// constants so a typo can't quietly drop a test out of a suite
export const TAG = {
  // suites: smoke runs on every push, regression nightly
  smoke: '@smoke',
  regression: '@regression',
  negative: '@negative',
  // areas
  directory: '@directory',
  yard: '@yard',
  search: '@search',
} as const;
