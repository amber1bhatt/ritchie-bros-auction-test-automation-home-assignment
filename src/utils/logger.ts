export const logger = {
  info(message: string): void {
    console.log(`[info] ${message}`);
  },
  list(label: string, items: readonly string[]): void {
    console.log(`[info] ${label}:`);
    items.forEach((item, index) => console.log(`  ${index + 1}. ${item}`));
  },
};
