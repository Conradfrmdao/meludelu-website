/** Markup price: cost × multiplier, rounded up to the nearest 500 or 1,000 UGX (or not rounded). */
export function markupPrice(cost: number, multiplier: number, rounding: 0 | 500 | 1000): number {
  const raw = cost * multiplier;
  return rounding === 0 ? Math.round(raw) : Math.ceil(raw / rounding) * rounding;
}

export function marginPercent(price: number, cost: number | null): number | null {
  if (!cost || price <= 0) return null;
  return Math.round(((price - cost) / price) * 100);
}
