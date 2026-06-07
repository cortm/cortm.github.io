export type GigType = 'brain' | 'work' | 'kuleana';

export interface FamilyMember {
  id: string;
  name: string;
  avatarUrl?: string;
  /** Prior display names (e.g. after renaming Kid 1 → Elliott) for claim matching */
  previousNames?: string[];
}

export interface Gig {
  id: string;
  title: string;
  type: GigType;
  description?: string;
  isBonus?: boolean;
}

export interface GigSnapshot {
  id: string;
  title: string;
  type: GigType;
  description?: string;
  isBonus?: boolean;
}

export interface Claim {
  id: string;
  gigId: string;
  weekId: string;
  assigneeName: string;
  familyMemberId?: string;
  dollarAmount: number;
  status: 'claimed' | 'completed';
  claimedAt: string;
  completedAt?: string;
}

export interface Week {
  id: string;
  startDate: string;
  endDate: string;
  closed: boolean;
  claims: Claim[];
  /** Frozen gig details at close-out so history survives catalog edits. */
  gigSnapshots?: Record<string, GigSnapshot>;
}

export interface AppState {
  familyMembers: FamilyMember[];
  gigs: Gig[];
  weeklyGoal: number;
  currentWeek: Week;
  pastWeeks: Week[];
}

export interface ClaimInput {
  gigId: string;
  assigneeName: string;
  dollarAmount: number;
}
