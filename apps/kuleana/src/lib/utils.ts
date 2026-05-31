import type { Claim } from '../types';

export function computeTotals(claims: Claim[]): {
  byPerson: Record<string, number>;
  grandTotal: number;
} {
  const byPerson: Record<string, number> = {};
  let grandTotal = 0;

  for (const claim of claims) {
    if (claim.status !== 'completed') continue;
    byPerson[claim.assigneeName] = (byPerson[claim.assigneeName] ?? 0) + claim.dollarAmount;
    grandTotal += claim.dollarAmount;
  }

  return { byPerson, grandTotal };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
