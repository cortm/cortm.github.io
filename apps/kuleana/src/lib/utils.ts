import type { Claim, FamilyMember, Gig } from '../types';

export interface PersonTotal {
  key: string;
  assigneeName: string;
  familyMemberId?: string;
  amount: number;
}

export function getClaimPersonKey(claim: Claim): string {
  return claim.familyMemberId ?? claim.assigneeName.trim();
}

function personTotalKey(claim: Claim): string {
  return getClaimPersonKey(claim);
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

/** Weekly board totals: every family member shown, $0 if no completed earnings */
export function computeBoardTotals(
  claims: Claim[],
  familyMembers: FamilyMember[],
): { byPerson: PersonTotal[]; grandTotal: number } {
  const { byPerson: earned, grandTotal } = computeTotals(claims);

  if (familyMembers.length === 0) {
    return {
      byPerson: [...earned].sort((a, b) => b.amount - a.amount),
      grandTotal,
    };
  }

  const amountByMemberId = new Map<string, number>();
  for (const entry of earned) {
    if (entry.familyMemberId) amountByMemberId.set(entry.familyMemberId, entry.amount);
  }

  const byPerson = familyMembers
    .map((member) => ({
      key: member.id,
      assigneeName: member.name,
      familyMemberId: member.id,
      amount: amountByMemberId.get(member.id) ?? 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  return { byPerson, grandTotal };
}

/** Bonus gigs first; preserve relative order within each group. */
export function sortGigsBonusFirst(gigs: Gig[]): Gig[] {
  return [...gigs.filter((g) => g.isBonus), ...gigs.filter((g) => !g.isBonus)];
}

export function isGigBonus(gigId: string, gigs: Gig[]): boolean {
  return !!gigs.find((g) => g.id === gigId)?.isBonus;
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
