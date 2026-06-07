import type { Claim, Gig, GigSnapshot, Week } from '../types';

export function createGigSnapshot(gig: Gig): GigSnapshot {
  return {
    id: gig.id,
    title: gig.title,
    type: gig.type,
    description: gig.description,
    isBonus: gig.isBonus,
  };
}

/** Preserve gig details for every gig referenced by a week's claims. */
export function buildGigSnapshotsForClaims(
  claims: Claim[],
  gigs: Gig[],
): Record<string, GigSnapshot> {
  const byId = new Map(gigs.map((gig) => [gig.id, gig]));
  const snapshots: Record<string, GigSnapshot> = {};

  for (const claim of claims) {
    if (snapshots[claim.gigId]) continue;
    const gig = byId.get(claim.gigId);
    if (gig) snapshots[claim.gigId] = createGigSnapshot(gig);
  }

  return snapshots;
}

export function resolveGigForWeek(
  gigId: string,
  week: Week,
  liveGigs: Gig[],
): Gig | GigSnapshot | undefined {
  const live = liveGigs.find((g) => g.id === gigId);
  if (live) return live;
  return week.gigSnapshots?.[gigId];
}
