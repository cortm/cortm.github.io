import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppState, Claim, ClaimInput, FamilyMember, Gig, GigType } from '../types';
import { findFamilyMemberByName, findFamilyMemberForClaim, memberMatchesName } from '../lib/family';
import { countClaimHistory, createBundle, type StoredBundle } from '../lib/bundle';
import { isCloudSyncEnabled } from '../lib/supabaseClient';
import { CompletionCelebration } from '../components/CompletionCelebration';
import { buildGigSnapshotsForClaims } from '../lib/gigSnapshots';
import { createInitialState, createWeekAfterClosed, loadPersistedBundle, persistBundle } from '../lib/storage';
import { findReopenableWeek } from '../lib/weekRecovery';
import { newId } from '../lib/utils';

export type SyncStatus = 'loading' | 'local' | 'synced' | 'syncing' | 'error';

interface AppContextValue {
  state: AppState;
  hydrated: boolean;
  syncStatus: SyncStatus;
  cloudSyncEnabled: boolean;
  kuleanaGigs: Gig[];
  brainGigs: Gig[];
  workGigs: Gig[];
  currentClaims: AppState['currentWeek']['claims'];
  claimGig: (input: ClaimInput) => { ok: true } | { ok: false; error: string };
  completeClaim: (claimId: string) => void;
  uncompleteClaim: (claimId: string) => void;
  unclaimClaim: (claimId: string) => void;
  updateClaimAmount: (
    claimId: string,
    dollarAmount: number,
  ) => { ok: true } | { ok: false; error: string };
  closeOutWeek: () => void;
  reopenLastClosedWeek: () => boolean;
  reopenableWeek: ReturnType<typeof findReopenableWeek>;
  addFamilyMember: (name: string) => void;
  updateFamilyMember: (id: string, name: string) => void;
  updateFamilyMemberAvatar: (id: string, avatarUrl: string | undefined) => void;
  updateWeeklyGoal: (goal: number) => void;
  getAvatarForName: (name: string) => { name: string; avatarUrl?: string };
  getAvatarForClaim: (claim: Claim) => { name: string; avatarUrl?: string };
  removeFamilyMember: (id: string) => void;
  addGig: (title: string, type: GigType, description?: string) => void;
  updateGig: (id: string, title: string, description?: string) => void;
  reorderGigs: (type: Exclude<GigType, 'kuleana'>, fromGigId: string, toGigId: string) => void;
  toggleGigBonus: (id: string) => void;
  removeGig: (id: string) => void;
  getGigById: (id: string) => Gig | undefined;
  isWorkGigClaimed: (gigId: string) => boolean;
  getBrainClaimCount: (gigId: string) => number;
  getWorkClaimAssignee: (gigId: string) => string | null;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('loading');
  const [completionCelebrationTick, setCompletionCelebrationTick] = useState(0);
  const loadedBundleRef = useRef<StoredBundle | null>(null);
  const cloudSyncEnabled = isCloudSyncEnabled();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const bundle = await loadPersistedBundle();
        if (cancelled) return;
        loadedBundleRef.current = bundle;
        setState(bundle.state);
        setSyncStatus(cloudSyncEnabled ? 'synced' : 'local');
      } catch {
        if (!cancelled) {
          loadedBundleRef.current = null;
          setState(createInitialState());
          setSyncStatus(cloudSyncEnabled ? 'error' : 'local');
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cloudSyncEnabled]);

  useEffect(() => {
    if (!hydrated) return;

    const loadedClaims = loadedBundleRef.current
      ? countClaimHistory(loadedBundleRef.current.state)
      : 0;
    const nextClaims = countClaimHistory(state);
    if (loadedClaims > 0 && nextClaims === 0) return;

    const bundle = createBundle(state);
    persistBundle(bundle);
    if (cloudSyncEnabled) {
      setSyncStatus('syncing');
      const timer = setTimeout(() => setSyncStatus('synced'), 500);
      return () => clearTimeout(timer);
    }
    setSyncStatus('local');
  }, [state, hydrated, cloudSyncEnabled]);

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

      const trimmedName = input.assigneeName.trim();
      const member = findFamilyMemberByName(state.familyMembers, trimmedName);

      const claim = {
        id: newId('claim'),
        gigId: input.gigId,
        weekId: state.currentWeek.id,
        assigneeName: member?.name ?? trimmedName,
        familyMemberId: member?.id,
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
      const claim = state.currentWeek.claims.find((c) => c.id === claimId);
      if (!claim || claim.status === 'completed') return;

      update((prev) => ({
        ...prev,
        currentWeek: {
          ...prev.currentWeek,
          claims: prev.currentWeek.claims.map((c) =>
            c.id === claimId
              ? { ...c, status: 'completed' as const, completedAt: new Date().toISOString() }
              : c,
          ),
        },
      }));

      setCompletionCelebrationTick((tick) => tick + 1);
    },
    [state.currentWeek.claims, update],
  );

  const uncompleteClaim = useCallback(
    (claimId: string) => {
      update((prev) => ({
        ...prev,
        currentWeek: {
          ...prev.currentWeek,
          claims: prev.currentWeek.claims.map((c) =>
            c.id === claimId ? { ...c, status: 'claimed' as const, completedAt: undefined } : c,
          ),
        },
      }));
    },
    [update],
  );

  const unclaimClaim = useCallback(
    (claimId: string) => {
      update((prev) => ({
        ...prev,
        currentWeek: {
          ...prev.currentWeek,
          claims: prev.currentWeek.claims.filter((c) => c.id !== claimId),
        },
      }));
    },
    [update],
  );

  const updateClaimAmount = useCallback(
    (claimId: string, dollarAmount: number): { ok: true } | { ok: false; error: string } => {
      if (dollarAmount <= 0) return { ok: false, error: 'Enter an amount greater than $0.' };
      const exists = state.currentWeek.claims.some((c) => c.id === claimId);
      if (!exists) return { ok: false, error: 'Claim not found.' };

      update((prev) => ({
        ...prev,
        currentWeek: {
          ...prev.currentWeek,
          claims: prev.currentWeek.claims.map((c) =>
            c.id === claimId ? { ...c, dollarAmount } : c,
          ),
        },
      }));

      return { ok: true };
    },
    [state.currentWeek.claims, update],
  );

  const closeOutWeek = useCallback(() => {
    update((prev) => {
      const closedWeek = {
        ...prev.currentWeek,
        closed: true,
        gigSnapshots: buildGigSnapshotsForClaims(prev.currentWeek.claims, prev.gigs),
      };
      return {
        ...prev,
        pastWeeks: [closedWeek, ...prev.pastWeeks],
        currentWeek: createWeekAfterClosed(closedWeek),
      };
    });
  }, [update]);

  const reopenLastClosedWeek = useCallback(() => {
    let reopened = false;
    update((prev) => {
      const week = findReopenableWeek(prev);
      if (!week) return prev;

      reopened = true;
      return {
        ...prev,
        currentWeek: { ...week, closed: false },
        pastWeeks: prev.pastWeeks.slice(1),
      };
    });
    return reopened;
  }, [update]);

  const reopenableWeek = useMemo(() => findReopenableWeek(state), [state]);

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
      update((prev) => {
        const member = prev.familyMembers.find((m) => m.id === id);
        if (!member) return prev;

        const previousNames =
          member.name !== trimmed
            ? [...new Set([...(member.previousNames ?? []), member.name.trim()])]
            : member.previousNames;

        const syncClaim = (claim: Claim): Claim => {
          if (claim.familyMemberId === id || memberMatchesName(member, claim.assigneeName)) {
            return { ...claim, assigneeName: trimmed, familyMemberId: id };
          }
          return claim;
        };

        return {
          ...prev,
          familyMembers: prev.familyMembers.map((m) =>
            m.id === id ? { ...m, name: trimmed, previousNames } : m,
          ),
          currentWeek: {
            ...prev.currentWeek,
            claims: prev.currentWeek.claims.map(syncClaim),
          },
        };
      });
    },
    [update],
  );

  const updateFamilyMemberAvatar = useCallback(
    (id: string, avatarUrl: string | undefined) => {
      update((prev) => ({
        ...prev,
        familyMembers: prev.familyMembers.map((m) =>
          m.id === id ? { ...m, avatarUrl: avatarUrl || undefined } : m,
        ),
      }));
    },
    [update],
  );

  const updateWeeklyGoal = useCallback(
    (goal: number) => {
      const normalized = Math.max(1, Math.round(goal));
      update((prev) => ({
        ...prev,
        weeklyGoal: normalized,
      }));
    },
    [update],
  );

  const getAvatarForName = useCallback(
    (name: string) => {
      const member = findFamilyMemberByName(state.familyMembers, name);
      return {
        name: member?.name ?? name,
        avatarUrl: member?.avatarUrl,
      };
    },
    [state.familyMembers],
  );

  const getAvatarForClaim = useCallback(
    (claim: Claim) => {
      const member = findFamilyMemberForClaim(state.familyMembers, claim);
      return {
        name: member?.name ?? claim.assigneeName,
        avatarUrl: member?.avatarUrl,
      };
    },
    [state.familyMembers],
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

  const reorderGigs = useCallback(
    (type: Exclude<GigType, 'kuleana'>, fromGigId: string, toGigId: string) => {
      if (fromGigId === toGigId) return;

      update((prev) => {
        const targetGigs = prev.gigs.filter((g) => g.type === type);
        const fromIndex = targetGigs.findIndex((g) => g.id === fromGigId);
        const toIndex = targetGigs.findIndex((g) => g.id === toGigId);
        if (fromIndex === -1 || toIndex === -1) return prev;

        const reorderedTypeGigs = [...targetGigs];
        const [moved] = reorderedTypeGigs.splice(fromIndex, 1);
        reorderedTypeGigs.splice(toIndex, 0, moved);

        let typeCursor = 0;
        const rebuiltGigs = prev.gigs.map((gig) => {
          if (gig.type !== type) return gig;
          const nextGig = reorderedTypeGigs[typeCursor];
          typeCursor += 1;
          return nextGig;
        });

        return {
          ...prev,
          gigs: rebuiltGigs,
        };
      });
    },
    [update],
  );

  const toggleGigBonus = useCallback(
    (id: string) => {
      update((prev) => {
        const gig = prev.gigs.find((g) => g.id === id);
        if (!gig || gig.type === 'kuleana') return prev;

        const nextIsBonus = !gig.isBonus;
        const gigsWithToggle = prev.gigs.map((g) =>
          g.id === id ? { ...g, isBonus: nextIsBonus } : g,
        );

        const type = gig.type;
        const typeGigs = gigsWithToggle.filter((g) => g.type === type);
        const target = typeGigs.find((g) => g.id === id);
        if (!target) return prev;

        const others = typeGigs.filter((g) => g.id !== id);
        const reorderedTypeGigs = nextIsBonus
          ? [target, ...others]
          : [
              ...others.filter((g) => g.isBonus),
              target,
              ...others.filter((g) => !g.isBonus),
            ];

        let typeCursor = 0;
        const rebuiltGigs = gigsWithToggle.map((g) => {
          if (g.type !== type) return g;
          const nextGig = reorderedTypeGigs[typeCursor];
          typeCursor += 1;
          return nextGig;
        });

        return { ...prev, gigs: rebuiltGigs };
      });
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
    hydrated,
    syncStatus,
    cloudSyncEnabled,
    kuleanaGigs,
    brainGigs,
    workGigs,
    currentClaims,
    claimGig,
    completeClaim,
    uncompleteClaim,
    unclaimClaim,
    updateClaimAmount,
    closeOutWeek,
    reopenLastClosedWeek,
    reopenableWeek,
    addFamilyMember,
    updateFamilyMember,
    updateFamilyMemberAvatar,
    updateWeeklyGoal,
    getAvatarForName,
    getAvatarForClaim,
    removeFamilyMember,
    addGig,
    updateGig,
    reorderGigs,
    toggleGigBonus,
    removeGig,
    getGigById,
    isWorkGigClaimed,
    getBrainClaimCount,
    getWorkClaimAssignee,
  };

  return (
    <AppContext.Provider value={value}>
      <CompletionCelebration tick={completionCelebrationTick} />
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { FamilyMember };
