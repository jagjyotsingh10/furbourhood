const money = new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", timeZone: "UTC" });
const longDate = new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export function formatPrice(amount: number): string {
  return money.format(amount);
}

/** Dates are ISO yyyy-mm-dd strings, parsed as UTC so they never shift a day. */
function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function formatDate(iso: string): string {
  return longDate.format(parse(iso));
}

export function formatDateRange(start: string, end: string): string {
  if (!start) return "Any dates";
  if (!end || start === end) return shortDate.format(parse(start));
  return `${shortDate.format(parse(start))} – ${shortDate.format(parse(end))}`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count === 1 ? word : pluralWord}`;
}
