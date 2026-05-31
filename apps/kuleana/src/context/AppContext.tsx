import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, ClaimInput, FamilyMember, Gig, GigType } from '../types';
import { createCurrentWeek, loadState, saveState } from '../lib/storage';
import { newId } from '../lib/utils';

interface AppContextValue {
  state: AppState;
  kuleanaGigs: Gig[];
  brainGigs: Gig[];
  workGigs: Gig[];
  currentClaims: AppState['currentWeek']['claims'];
  claimGig: (input: ClaimInput) => { ok: true } | { ok: false; error: string };
  completeClaim: (claimId: string) => void;
  closeOutWeek: () => void;
  addFamilyMember: (name: string) => void;
  updateFamilyMember: (id: string, name: string) => void;
  removeFamilyMember: (id: string) => void;
  addGig: (title: string, type: GigType, description?: string) => void;
  updateGig: (id: string, title: string, description?: string) => void;
  removeGig: (id: string) => void;
  getGigById: (id: string) => Gig | undefined;
  isWorkGigClaimed: (gigId: string) => boolean;
  getBrainClaimCount: (gigId: string) => number;
  getWorkClaimAssignee: (gigId: string) => string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const update = useCallback((updater: (prev: AppState) => AppState) => {
    setState(updater);
  }, []);

  const kuleanaGigs = useMemo(
    () => state.gigs.filter((g) => g.type === 'kuleana'),
    [state.gigs],
  );
  const brainGigs = useMemo(
    () => state.gigs.filter((g) => g.type === 'brain'),
    [state.gigs],
  );
  const workGigs = useMemo(
    () => state.gigs.filter((g) => g.type === 'work'),
    [state.gigs],
  );

  const currentClaims = state.currentWeek.claims;

  const getGigById = useCallback(
    (id: string) => state.gigs.find((g) => g.id === id),
    [state.gigs],
  );

  const isWorkGigClaimed = useCallback(
    (gigId: string) => currentClaims.some((c) => c.gigId === gigId),
    [currentClaims],
  );

  const getWorkClaimAssignee = useCallback(
    (gigId: string) => {
      const claim = currentClaims.find((c) => c.gigId === gigId);
      return claim?.assigneeName ?? null;
    },
    [currentClaims],
  );

  const getBrainClaimCount = useCallback(
    (gigId: string) => currentClaims.filter((c) => c.gigId === gigId).length,
    [currentClaims],
  );

  const claimGig = useCallback(
    (input: ClaimInput): { ok: true } | { ok: false; error: string } => {
      const gig = state.gigs.find((g) => g.id === input.gigId);
      if (!gig) return { ok: false, error: 'Gig not found.' };
      if (gig.type === 'kuleana') return { ok: false, error: 'Kuleana items cannot be claimed.' };
      if (!input.assigneeName.trim()) return { ok: false, error: 'Please enter your name.' };
      if (input.dollarAmount <= 0) return { ok: false, error: 'Enter an amount greater than $0.' };

      if (gig.type === 'work') {
        const taken = state.currentWeek.claims.some((c) => c.gigId === input.gigId);
        if (taken) return { ok: false, error: 'This work gig is already claimed this week.' };
      }

      const claim = {
        id: newId('claim'),
        gigId: input.gigId,
        weekId: state.currentWeek.id,
        assigneeName: input.assigneeName.trim(),
        dollarAmount: input.dollarAmount,
        status: 'claimed' as const,
        claimedAt: new Date().toISOString(),
      };

      update((prev) => ({
        ...prev,
        currentWeek: {
          ...prev.currentWeek,
          claims: [...prev.currentWeek.claims, claim],
        },
      }));

      return { ok: true };
    },
    [state, update],
  );

  const completeClaim = useCallback(
    (claimId: string) => {
      update((prev) => ({
        ...prev,
        currentWeek: {
          ...prev.currentWeek,
          claims: prev.currentWeek.claims.map((c) =>
            c.id === claimId ? { ...c, status: 'completed' as const } : c,
          ),
        },
      }));
    },
    [update],
  );

  const closeOutWeek = useCallback(() => {
    update((prev) => {
      const closedWeek = {
        ...prev.currentWeek,
        closed: true,
      };
      return {
        ...prev,
        pastWeeks: [closedWeek, ...prev.pastWeeks],
        currentWeek: createCurrentWeek(),
      };
    });
  }, [update]);

  const addFamilyMember = useCallback(
    (name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      update((prev) => ({
        ...prev,
        familyMembers: [...prev.familyMembers, { id: newId('member'), name: trimmed }],
      }));
    },
    [update],
  );

  const updateFamilyMember = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      update((prev) => ({
        ...prev,
        familyMembers: prev.familyMembers.map((m) =>
          m.id === id ? { ...m, name: trimmed } : m,
        ),
      }));
    },
    [update],
  );

  const removeFamilyMember = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        familyMembers: prev.familyMembers.filter((m) => m.id !== id),
      }));
    },
    [update],
  );

  const addGig = useCallback(
    (title: string, type: GigType, description?: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      update((prev) => ({
        ...prev,
        gigs: [
          ...prev.gigs,
          { id: newId('gig'), title: trimmed, type, description: description?.trim() || undefined },
        ],
      }));
    },
    [update],
  );

  const updateGig = useCallback(
    (id: string, title: string, description?: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      update((prev) => ({
        ...prev,
        gigs: prev.gigs.map((g) =>
          g.id === id ? { ...g, title: trimmed, description: description?.trim() || undefined } : g,
        ),
      }));
    },
    [update],
  );

  const removeGig = useCallback(
    (id: string) => {
      update((prev) => ({
        ...prev,
        gigs: prev.gigs.filter((g) => g.id !== id),
      }));
    },
    [update],
  );

  const value: AppContextValue = {
    state,
    kuleanaGigs,
    brainGigs,
    workGigs,
    currentClaims,
    claimGig,
    completeClaim,
    closeOutWeek,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember,
    addGig,
    updateGig,
    removeGig,
    getGigById,
    isWorkGigClaimed,
    getBrainClaimCount,
    getWorkClaimAssignee,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { FamilyMember };
