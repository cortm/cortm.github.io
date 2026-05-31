import type { Gig } from '../types';
import { StatusPill } from './StatusPill';

interface GigCardProps {
  gig: Gig;
  statusLabel: string;
  status: 'available' | 'locked' | 'claimed';
  claimCount?: number;
  onClaim?: () => void;
  disabled?: boolean;
}

export function GigCard({
  gig,
  statusLabel,
  status,
  claimCount,
  onClaim,
  disabled,
}: GigCardProps) {
  return (
    <article className="gig-card">
      <div className="gig-card__body">
        <h3 className="gig-card__title">{gig.title}</h3>
        {gig.description && <p className="gig-card__desc">{gig.description}</p>}
        <p className="gig-card__status">{statusLabel}</p>
        {claimCount !== undefined && claimCount > 0 && (
          <p className="gig-card__meta">{claimCount} kid{claimCount !== 1 ? 's' : ''} claimed this</p>
        )}
      </div>
      <div className="gig-card__footer">
        <StatusPill status={status === 'available' ? 'available' : status === 'locked' ? 'locked' : 'claimed'} />
        {onClaim && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={onClaim}
            disabled={disabled}
          >
            Claim
          </button>
        )}
      </div>
    </article>
  );
}
