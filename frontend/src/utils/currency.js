/**
 * Format a number as Indian Rupees (₹)
 * e.g. 1234.5 → "₹1,234.50"
 */
export function fmt(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount));
}
