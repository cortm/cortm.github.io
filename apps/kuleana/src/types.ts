export type GigType = 'brain' | 'work' | 'kuleana';

export interface FamilyMember {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Gig {
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
  dollarAmount: number;
  status: 'claimed' | 'completed';
  claimedAt: string;
}

export interface Week {
  id: string;
  startDate: string;
  endDate: string;
  closed: boolean;
  claims: Claim[];
}

export interface AppState {
  familyMembers: FamilyMember[];
  gigs: Gig[];
  currentWeek: Week;
  pastWeeks: Week[];
}

export interface ClaimInput {
  gigId: string;
  assigneeName: string;
  dollarAmount: number;
}
