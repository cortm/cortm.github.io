import type { Claim } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { StatusPill } from './StatusPill';

interface ClaimRowProps {
  claim: Claim;
}

export function ClaimRow({ claim }: ClaimRowProps) {
  const { getGigById, completeClaim, uncompleteClaim } = useApp();
  const gig = getGigById(claim.gigId);
  const completed = claim.status === 'completed';

  return (
    <div className={`claim-row${completed ? ' claim-row--completed' : ''}`}>
      <div className="claim-row__main">
        <p className="claim-row__title">{gig?.title ?? 'Unknown gig'}</p>
        <p className="claim-row__meta">
          <span>{claim.assigneeName}</span>
          <span className="claim-row__dot">·</span>
          <span className="claim-row__amount">{formatCurrency(claim.dollarAmount)}</span>
        </p>
      </div>
      <div className="claim-row__actions">
        <StatusPill status={claim.status} />
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
  );
}
