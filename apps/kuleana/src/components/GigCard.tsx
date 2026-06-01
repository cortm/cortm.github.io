import type { Gig } from '../types';
import { Avatar } from './Avatar';

interface GigCardProps {
  gig: Gig;
  taken?: boolean;
  assigneeName?: string;
  assigneeAvatarUrl?: string;
  onClaim?: () => void;
  disabled?: boolean;
}

export function GigCard({
  gig,
  taken = false,
  assigneeName,
  assigneeAvatarUrl,
  onClaim,
  disabled,
}: GigCardProps) {
  const showAssigneeAvatar = taken && assigneeName;

  return (
    <article className="gig-card">
      <div className="gig-card__row">
        <span
          className={`gig-card__dot${taken ? ' gig-card__dot--taken' : ' gig-card__dot--available'}`}
          aria-hidden="true"
        />
        <h3 className="gig-card__title">{gig.title}</h3>
        {showAssigneeAvatar && (
          <Avatar name={assigneeName} avatarUrl={assigneeAvatarUrl} size="pill" />
        )}
        {onClaim && (
          <button
            type="button"
            className="btn btn--primary btn--sm gig-card__claim"
            onClick={onClaim}
            disabled={disabled}
          >
            Claim
          </button>
        )}
      </div>
      {gig.description && <p className="gig-card__desc">{gig.description}</p>}
    </article>
  );
}
