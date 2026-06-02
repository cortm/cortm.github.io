import type { Claim } from '../types';

export interface PersonTotal {
  key: string;
  assigneeName: string;
  familyMemberId?: string;
  amount: number;
}

function personTotalKey(claim: Claim): string {
  return claim.familyMemberId ?? claim.assigneeName.trim();
}

export function computeTotals(claims: Claim[]): {
  byPerson: PersonTotal[];
  grandTotal: number;
} {
  const byPersonMap = new Map<string, PersonTotal>();
  let grandTotal = 0;

  for (const claim of claims) {
    if (claim.status !== 'completed') continue;
    const key = personTotalKey(claim);
    const existing = byPersonMap.get(key);
    if (existing) {
      existing.amount += claim.dollarAmount;
    } else {
      byPersonMap.set(key, {
        key,
        assigneeName: claim.assigneeName,
        familyMemberId: claim.familyMemberId,
        amount: claim.dollarAmount,
      });
    }
    grandTotal += claim.dollarAmount;
  }

  return { byPerson: [...byPersonMap.values()], grandTotal };
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
