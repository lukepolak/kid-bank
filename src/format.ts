/** Money display: integer grosze → "123,45 zł" (Polish format, CONTEXT.md). */
export function formatGrosze(grosze: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(grosze / 100);
}
