import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Claim } from '../types';
import { useApp } from '../context/AppContext';
import { computeBoardTotals, formatCurrency, getClaimPersonKey, isGigBonus } from '../lib/utils';
import { canCloseOutWeekOnDate, formatWeekRange } from '../lib/week';
import { ClaimRow } from '../components/ClaimRow';
import { Modal } from '../components/Modal';
import { TotalsPersonRow } from '../components/TotalsPersonRow';

interface ClaimedGigItem {
  claim: Claim;
  displayTitle: string;
}

type BoardColumn = 'claimed' | 'completed';

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

export function BoardPage() {
  const {
    state,
    currentClaims,
    closeOutWeek,
    completeClaim,
    uncompleteClaim,
    reopenableWeek,
  } = useApp();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filterPersonKey, setFilterPersonKey] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<BoardColumn | null>(null);
  const isWideBoard = useMediaQuery('(min-width: 960px)');

  const { activeGigs, completedGigs } = useMemo(() => {
    const active: ClaimedGigItem[] = [];
    const completed: ClaimedGigItem[] = [];

    for (const claim of currentClaims) {
      if (filterPersonKey && getClaimPersonKey(claim) !== filterPersonKey) continue;

      const gig = state.gigs.find((g) => g.id === claim.gigId);
      const icon = gig?.type === 'work' ? '🧹' : '🧠';
      const title = gig?.title ?? 'Unknown gig';
      const item = { claim, displayTitle: `${icon} ${title}` };
      if (claim.status === 'completed') completed.push(item);
      else active.push(item);
    }

    const byClaimedAt = (a: ClaimedGigItem, b: ClaimedGigItem) => {
      const aBonus = isGigBonus(a.claim.gigId, state.gigs);
      const bBonus = isGigBonus(b.claim.gigId, state.gigs);
      if (aBonus !== bBonus) return aBonus ? -1 : 1;
      return new Date(b.claim.claimedAt).getTime() - new Date(a.claim.claimedAt).getTime();
    };

    const byCompletedAt = (a: ClaimedGigItem, b: ClaimedGigItem) => {
      const aBonus = isGigBonus(a.claim.gigId, state.gigs);
      const bBonus = isGigBonus(b.claim.gigId, state.gigs);
      if (aBonus !== bBonus) return aBonus ? -1 : 1;
      const aTime = a.claim.completedAt ?? a.claim.claimedAt;
      const bTime = b.claim.completedAt ?? b.claim.claimedAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    };

    return {
      activeGigs: active.sort(byClaimedAt),
      completedGigs: completed.sort(byCompletedAt),
    };
  }, [currentClaims, filterPersonKey, state.gigs]);

  const totals = useMemo(
    () => computeBoardTotals(currentClaims, state.familyMembers),
    [currentClaims, state.familyMembers],
  );

  const filteredPersonName = useMemo(() => {
    if (!filterPersonKey) return null;
    return (
      state.familyMembers.find((m) => m.id === filterPersonKey)?.name ??
      totals.byPerson.find((entry) => entry.key === filterPersonKey)?.assigneeName ??
      null
    );
  }, [filterPersonKey, state.familyMembers, totals.byPerson]);
  const completedCount = useMemo(
    () => currentClaims.filter((claim) => claim.status === 'completed').length,
    [currentClaims],
  );
  const goalPercent = useMemo(() => {
    if (state.weeklyGoal <= 0) return 0;
    return Math.min(100, Math.round((completedCount / state.weeklyGoal) * 100));
  }, [completedCount, state.weeklyGoal]);
  const weekLabel = formatWeekRange(state.currentWeek.startDate, state.currentWeek.endDate);
  const canCloseOutWeek = canCloseOutWeekOnDate(state.currentWeek.endDate);

  const closedOutWeek = reopenableWeek;
  const closedOutCompletedCount = useMemo(
    () => closedOutWeek?.claims.filter((claim) => claim.status === 'completed').length ?? 0,
    [closedOutWeek],
  );

  const handleCloseOut = () => {
    closeOutWeek();
    setConfirmOpen(false);
  };

  const handleColumnDragOver = (e: DragEvent<HTMLElement>, column: BoardColumn) => {
    if (!isWideBoard) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(column);
  };

  const handleColumnDragLeave = (e: DragEvent<HTMLElement>, column: BoardColumn) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn((prev) => (prev === column ? null : prev));
  };

  const handleColumnDrop = (e: DragEvent<HTMLElement>, column: BoardColumn) => {
    if (!isWideBoard) return;
    e.preventDefault();
    setDragOverColumn(null);

    const claimId = e.dataTransfer.getData('text/claim-id');
    if (!claimId) return;

    const claim = currentClaims.find((c) => c.id === claimId);
    if (!claim) return;

    if (column === 'completed' && claim.status === 'claimed') {
      completeClaim(claimId);
    } else if (column === 'claimed' && claim.status === 'completed') {
      uncompleteClaim(claimId);
    }
  };

  return (
    <div className="page board-page">
      <div className="page-header">
        <h2 className="page-header__title">Board</h2>
        <p className="page-header__subtitle">{weekLabel}</p>
      </div>

      {closedOutWeek && (
        <div className="board-recovery" role="status">
          <p className="board-recovery__text">
            This week has been closed out. {closedOutCompletedCount}{' '}
            {closedOutCompletedCount === 1 ? 'gig was' : 'gigs were'} completed.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--sm board-recovery__action"
            onClick={() => navigate('/history')}
          >
            View results
          </button>
        </div>
      )}

      <div className="board-grid">
        <div className="board-grid__sidebar">
          <div className="totals-bar">
            <h3 className="totals-bar__title">Weekly Totals</h3>
            {state.familyMembers.length === 0 ? (
              <p className="totals-bar__empty">Add family members in Settings to track weekly totals.</p>
            ) : (
              <>
                <div className="totals-bar__people">
                  {totals.byPerson.map((entry) => (
                    <TotalsPersonRow
                      key={entry.key}
                      total={entry}
                      selected={filterPersonKey === entry.key}
                      onSelect={() =>
                        setFilterPersonKey((prev) => (prev === entry.key ? null : entry.key))
                      }
                    />
                  ))}
                </div>
                <div className="totals-bar__footer">
                  <p className="totals-bar__percent" aria-hidden="true">
                    {goalPercent}%
                  </p>
                  <div className="totals-bar__footer-mid">
                    <span>
                      {completedCount} / {state.weeklyGoal} completed
                    </span>
                    <span className="totals-bar__owed">
                      Total owed: {formatCurrency(totals.grandTotal)}
                    </span>
                  </div>
                  <div
                    className="totals-bar__progress"
                    role="progressbar"
                    aria-valuenow={goalPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Weekly goal progress: ${completedCount} of ${state.weeklyGoal} gigs completed`}
                  >
                    <div
                      className="totals-bar__progress-fill"
                      style={{ width: `${goalPercent}%` }}
                    />
                  </div>
                  <span className="visually-hidden">
                    {goalPercent}% of weekly goal · {completedCount} of {state.weeklyGoal} gigs
                    completed · Total owed {formatCurrency(totals.grandTotal)}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            type="button"
            className={`btn btn--block board-grid__close-week${canCloseOutWeek ? ' btn--danger' : ' board-grid__close-week--locked'}`}
            disabled={!canCloseOutWeek}
            aria-disabled={!canCloseOutWeek}
            title={canCloseOutWeek ? undefined : 'Close out is available on Sundays only'}
            onClick={() => {
              if (!canCloseOutWeek) return;
              setConfirmOpen(true);
            }}
          >
            Close Out Week
          </button>
        </div>

        <section
          className={`section board-claimed-gigs board-grid__claimed${dragOverColumn === 'claimed' ? ' board-drop-zone--over' : ''}`}
          onDragOver={(e) => handleColumnDragOver(e, 'claimed')}
          onDragLeave={(e) => handleColumnDragLeave(e, 'claimed')}
          onDrop={(e) => handleColumnDrop(e, 'claimed')}
        >
          <div className="board-claimed-gigs__header">
            <h3 className="board-claimed-gigs__title">Claimed Gigs</h3>
            <span className="section__count">{activeGigs.length}</span>
          </div>
          {activeGigs.length === 0 ? (
            <p className="empty-state board-drop-zone__empty">
              {filterPersonKey && filteredPersonName
                ? `No gigs in progress for ${filteredPersonName}.`
                : currentClaims.length === 0
                  ? 'No gigs claimed yet. Browse gigs to get started!'
                  : isWideBoard
                    ? 'Drag completed gigs here to mark incomplete.'
                    : 'No gigs in progress.'}
            </p>
          ) : (
            <div className="claim-list board-claimed-gigs__list">
              {activeGigs.map(({ claim, displayTitle }) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  titleOverride={displayTitle}
                  draggable={isWideBoard}
                />
              ))}
            </div>
          )}
        </section>

        <section
          className={`section board-completed-gigs board-grid__completed${dragOverColumn === 'completed' ? ' board-drop-zone--over' : ''}`}
          onDragOver={(e) => handleColumnDragOver(e, 'completed')}
          onDragLeave={(e) => handleColumnDragLeave(e, 'completed')}
          onDrop={(e) => handleColumnDrop(e, 'completed')}
        >
          <div className="board-claimed-gigs__header">
            <h3 className="board-claimed-gigs__title">Completed Gigs</h3>
            <span className="section__count section__count--completed">
              {completedGigs.length}
            </span>
          </div>
          {completedGigs.length === 0 ? (
            <p className="empty-state board-drop-zone__empty">
              {filterPersonKey && filteredPersonName
                ? `No completed gigs for ${filteredPersonName}.`
                : isWideBoard
                  ? 'Drag claimed gigs here to mark complete.'
                  : 'No gigs completed yet.'}
            </p>
          ) : (
            <div className="claim-list board-claimed-gigs__list">
              {completedGigs.map(({ claim, displayTitle }) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  titleOverride={displayTitle}
                  draggable={isWideBoard}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal open={confirmOpen} title="Close out this week?" onClose={() => setConfirmOpen(false)}>
        <p className="confirm-text">
          This will lock the week and save all progress to Past Weeks. A fresh week will begin and
          work gigs become available again. Ready?
        </p>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmOpen(false)}>
            Not yet
          </button>
          <button type="button" className="btn btn--danger" onClick={handleCloseOut}>
            Yes, close week
          </button>
        </div>
      </Modal>
    </div>
  );
}
