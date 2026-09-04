/** Formats a numeric value as a whole-dollar amount, e.g. `formatCurrency(1200)` -> "$1,200". */
export function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
