import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { computeTotals, formatCurrency } from '../lib/utils';
import { formatWeekRange } from '../lib/week';
import { ClaimRow } from '../components/ClaimRow';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { Modal } from '../components/Modal';
import { TotalsPersonRow } from '../components/TotalsPersonRow';
import { useState } from 'react';

export function BoardPage() {
  const { state, currentClaims, closeOutWeek } = useApp();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const brainClaims = useMemo(
    () => currentClaims.filter((c) => {
      const gig = state.gigs.find((g) => g.id === c.gigId);
      return gig?.type === 'brain';
    }),
    [currentClaims, state.gigs],
  );

  const workClaims = useMemo(
    () => currentClaims.filter((c) => {
      const gig = state.gigs.find((g) => g.id === c.gigId);
      return gig?.type === 'work';
    }),
    [currentClaims, state.gigs],
  );

  const totals = computeTotals(currentClaims);
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

      <CollapsibleSection title="Brain Gigs (Active)" icon="🧠" count={brainClaims.length}>
        {brainClaims.length === 0 ? (
          <p className="empty-state">No brain gigs claimed yet. Browse gigs to get started!</p>
        ) : (
          <div className="claim-list">
            {brainClaims.map((claim) => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Work Gigs (Active)" icon="🧹" count={workClaims.length}>
        {workClaims.length === 0 ? (
          <p className="empty-state">No work gigs claimed yet. Browse gigs to get started!</p>
        ) : (
          <div className="claim-list">
            {workClaims.map((claim) => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <div className="totals-bar">
        <h3 className="totals-bar__title">Weekly Totals</h3>
        {Object.keys(totals.byPerson).length === 0 ? (
          <p className="totals-bar__empty">Complete gigs to see earnings</p>
        ) : (
          <div className="totals-bar__grid">
            {Object.entries(totals.byPerson).map(([name, amount]) => (
              <TotalsPersonRow key={name} name={name} amount={amount} />
            ))}
            <div className="totals-bar__grand">
              <span>Total owed</span>
              <strong>{formatCurrency(totals.grandTotal)}</strong>
            </div>
          </div>
        )}
      </div>

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
