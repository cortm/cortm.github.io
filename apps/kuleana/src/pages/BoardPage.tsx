import { useMemo, useState } from 'react';
import type { Claim } from '../types';
import { useApp } from '../context/AppContext';
import { computeTotals, formatCurrency } from '../lib/utils';
import { formatWeekRange } from '../lib/week';
import { ClaimRow } from '../components/ClaimRow';
import { Modal } from '../components/Modal';
import { TotalsPersonRow } from '../components/TotalsPersonRow';
interface ClaimedGigItem {
  claim: Claim;
  displayTitle: string;
}

export function BoardPage() {
  const { state, currentClaims, closeOutWeek } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { activeGigs, completedGigs } = useMemo(() => {
    const active: ClaimedGigItem[] = [];
    const completed: ClaimedGigItem[] = [];

    for (const claim of currentClaims) {
      const gig = state.gigs.find((g) => g.id === claim.gigId);
      const icon = gig?.type === 'work' ? '🧹' : '🧠';
      const title = gig?.title ?? 'Unknown gig';
      const item = { claim, displayTitle: `${icon} ${title}` };
      if (claim.status === 'completed') completed.push(item);
      else active.push(item);
    }

    return { activeGigs: active, completedGigs: completed };
  }, [currentClaims, state.gigs]);

  const totals = computeTotals(currentClaims);
  const completedCount = useMemo(
    () => currentClaims.filter((claim) => claim.status === 'completed').length,
    [currentClaims],
  );
  const weekLabel = formatWeekRange(state.currentWeek.startDate, state.currentWeek.endDate);

  const handleCloseOut = () => {
    closeOutWeek();
    setConfirmOpen(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-header__title">Board</h2>
        <p className="page-header__subtitle">{weekLabel}</p>
      </div>

      <div className="totals-bar">
        <div className="totals-bar__header">
          <h3 className="totals-bar__title">Weekly Totals</h3>
          <div className="totals-bar__kpi" aria-label="Completed goal KPI">
            {completedCount}/{state.weeklyGoal}
          </div>
        </div>
        {totals.byPerson.length === 0 ? (
          <p className="totals-bar__empty">Complete gigs to see earnings</p>
        ) : (
          <div className="totals-bar__grid">
            {totals.byPerson.map((entry) => (
              <TotalsPersonRow key={entry.key} total={entry} />
            ))}
            <div className="totals-bar__grand">
              <span>Total owed</span>
              <strong>{formatCurrency(totals.grandTotal)}</strong>
            </div>
          </div>
        )}
      </div>

      <section className="section board-claimed-gigs">
        <div className="board-claimed-gigs__header">
          <h3 className="board-claimed-gigs__title">Claimed Gigs</h3>
          <span className="section__count">{activeGigs.length}</span>
        </div>
        {currentClaims.length === 0 ? (
          <p className="empty-state">No gigs claimed yet. Browse gigs to get started!</p>
        ) : (
          <>
            {activeGigs.length > 0 && (
              <div className="claim-list board-claimed-gigs__list">
                {activeGigs.map(({ claim, displayTitle }) => (
                  <ClaimRow key={claim.id} claim={claim} titleOverride={displayTitle} />
                ))}
              </div>
            )}

            {completedGigs.length > 0 && (
              <>
                <div className="board-claimed-gigs__header board-claimed-gigs__header--subsection">
                  <h3 className="board-claimed-gigs__title">Completed Gigs</h3>
                  <span className="section__count">{completedGigs.length}</span>
                </div>
                <div className="claim-list board-claimed-gigs__list">
                  {completedGigs.map(({ claim, displayTitle }) => (
                    <ClaimRow key={claim.id} claim={claim} titleOverride={displayTitle} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>

      <button
        type="button"
        className="btn btn--danger btn--block"
        onClick={() => setConfirmOpen(true)}
      >
        Close Out Week
      </button>

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
