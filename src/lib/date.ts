const farmDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Bangkok",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const displayDateFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const displayMonthFormatter = new Intl.DateTimeFormat("th-TH", {
  timeZone: "UTC",
  month: "long",
  year: "numeric",
});
const numberFormatter = new Intl.NumberFormat("th-TH", {
  maximumFractionDigits: 2,
});

function dateOnly(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day));
  return result.getUTCFullYear() === year &&
    result.getUTCMonth() === month - 1 &&
    result.getUTCDate() === day
    ? result
    : null;
}

export function farmDate(date = new Date()): string {
  const parts = Object.fromEntries(
    farmDateFormatter
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatFarmDate(value: string): string {
  const date = dateOnly(value);
  return date ? displayDateFormatter.format(date) : value;
}

export function formatFarmMonth(value: string): string {
  const date = dateOnly(`${value}-01`);
  return date ? displayMonthFormatter.format(date) : value;
}

export function formatFarmNumber(value: number): string {
  return numberFormatter.format(value);
}
