const farmMonthFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
});

export function farmMonth(now = new Date()): string {
  const parts = Object.fromEntries(farmMonthFormatter.formatToParts(now).map((part) => [part.type, part.value]));
  return `${parts.year}-${parts.month}`;
}
