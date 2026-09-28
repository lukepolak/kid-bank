/** Money display: integer grosze → "123,45 zł" (Polish format, CONTEXT.md). */
export function formatGrosze(grosze: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(grosze / 100);
}

/** Timestamps are stored UTC, displayed Europe/Warsaw (SPEC). */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Warsaw",
  }).format(new Date(iso));
}
