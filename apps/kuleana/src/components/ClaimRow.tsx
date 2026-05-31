import { useState } from 'react';
import type { Claim } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { StatusPill } from './StatusPill';
import { Modal } from './Modal';

interface ClaimRowProps {
  claim: Claim;
}

export function ClaimRow({ claim }: ClaimRowProps) {
  const { getGigById, completeClaim, uncompleteClaim, unclaimClaim } = useApp();
  const [unclaimOpen, setUnclaimOpen] = useState(false);
  const gig = getGigById(claim.gigId);
  const completed = claim.status === 'completed';
  const claimed = claim.status === 'claimed';
  const gigTitle = gig?.title ?? 'this gig';

  const handleUnclaim = () => {
    unclaimClaim(claim.id);
    setUnclaimOpen(false);
  };

  return (
    <>
      <div className={`claim-row${completed ? ' claim-row--completed' : ''}`}>
        <div className="claim-row__main">
          <p className="claim-row__title">{gigTitle}</p>
          <p className="claim-row__meta">
            <span>{claim.assigneeName}</span>
            <span className="claim-row__dot">·</span>
            <span className="claim-row__amount">{formatCurrency(claim.dollarAmount)}</span>
          </p>
        </div>
        <div className="claim-row__actions">
          <StatusPill
            status={claim.status}
            onClick={claimed ? () => setUnclaimOpen(true) : undefined}
          />
          {completed ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => uncompleteClaim(claim.id)}
            >
              Mark Incomplete
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--accent btn--sm"
              onClick={() => completeClaim(claim.id)}
            >
              Mark Complete
            </button>
          )}
        </div>
      </div>

      <Modal open={unclaimOpen} title="Unclaim this gig?" onClose={() => setUnclaimOpen(false)}>
        <p className="confirm-text">
          Remove <strong>{claim.assigneeName}</strong>&apos;s claim on <strong>{gigTitle}</strong>?
          The gig will be available to claim again.
        </p>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={() => setUnclaimOpen(false)}>
            Keep claimed
          </button>
          <button type="button" className="btn btn--danger" onClick={handleUnclaim}>
            Yes, unclaim
          </button>
        </div>
      </Modal>
    </>
  );
}
