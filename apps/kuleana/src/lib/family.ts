import type { AppState, Claim, FamilyMember } from '../types';

/** Default seed assignee names → member ids (see seed.ts) */
const SEED_ASSIGNEE_IDS: Record<string, string> = {
  'kid 1': '1',
  'kid 2': '2',
};

export function normalizeMemberName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function memberMatchesName(member: FamilyMember, name: string): boolean {
  const normalized = normalizeMemberName(name);
  if (normalizeMemberName(member.name) === normalized) return true;
  return member.previousNames?.some((prev) => normalizeMemberName(prev) === normalized) ?? false;
}

export function findFamilyMemberByName(
  members: FamilyMember[],
  name: string,
): FamilyMember | undefined {
  return members.find((m) => memberMatchesName(m, name));
}

function findFamilyMemberBySeedAssignee(
  members: FamilyMember[],
  assigneeName: string,
): FamilyMember | undefined {
  const seedId = SEED_ASSIGNEE_IDS[normalizeMemberName(assigneeName)];
  if (!seedId) return undefined;
  return members.find((m) => m.id === seedId);
}

export function findFamilyMemberForClaim(
  members: FamilyMember[],
  claim: Claim,
): FamilyMember | undefined {
  if (claim.familyMemberId) {
    const byId = members.find((m) => m.id === claim.familyMemberId);
    if (byId) return byId;
  }
  const byName = findFamilyMemberByName(members, claim.assigneeName);
  if (byName) return byName;
  return findFamilyMemberBySeedAssignee(members, claim.assigneeName);
}

/** Remember legacy assignee names on members so renamed kids still match old claims */
export function enrichFamilyPreviousNames(state: AppState): AppState {
  const extraNames = new Map<string, Set<string>>();

  const considerClaim = (claim: Claim) => {
    const member = findFamilyMemberForClaim(state.familyMembers, claim);
    if (!member || memberMatchesName(member, claim.assigneeName)) return;
    const set = extraNames.get(member.id) ?? new Set();
    set.add(claim.assigneeName.trim());
    extraNames.set(member.id, set);
  };

  for (const claim of state.currentWeek.claims) considerClaim(claim);
  for (const week of state.pastWeeks) {
    for (const claim of week.claims) considerClaim(claim);
  }

  if (extraNames.size === 0) return state;

  return {
    ...state,
    familyMembers: state.familyMembers.map((member) => {
      const added = extraNames.get(member.id);
      if (!added) return member;
      return {
        ...member,
        previousNames: [...new Set([...(member.previousNames ?? []), ...added])],
      };
    }),
  };
}

export function backfillClaimMemberId(claim: Claim, members: FamilyMember[]): Claim {
  const member = findFamilyMemberForClaim(members, claim);
  if (!member) return claim;
  if (claim.familyMemberId === member.id) return claim;
  return { ...claim, familyMemberId: member.id };
}
