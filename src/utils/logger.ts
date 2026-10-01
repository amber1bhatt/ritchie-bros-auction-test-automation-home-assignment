export const logger = {
  info(message: string, ...args: unknown[]): void {
    console.log(`[info] ${message}`, ...args);
  },
  list(label: string, items: readonly string[]): void {
    console.log(`[info] ${label}:`);
    items.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
  },
};
