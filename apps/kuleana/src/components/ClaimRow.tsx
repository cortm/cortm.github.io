import { useState } from 'react';
import type { Claim } from '../types';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { Avatar } from './Avatar';
import { CompleteCheckButton } from './CompleteCheckButton';
import { EditClaimAmountModal } from './EditClaimAmountModal';
import { Modal } from './Modal';

interface ClaimRowProps {
  claim: Claim;
  titleOverride?: string;
  draggable?: boolean;
}

export function ClaimRow({ claim, titleOverride, draggable = false }: ClaimRowProps) {
  const { getGigById, getAvatarForClaim, completeClaim, uncompleteClaim, unclaimClaim } = useApp();
  const assignee = getAvatarForClaim(claim);
  const [unclaimOpen, setUnclaimOpen] = useState(false);
  const [editAmountOpen, setEditAmountOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const gig = getGigById(claim.gigId);
  const completed = claim.status === 'completed';
  const claimed = claim.status === 'claimed';
  const gigTitle = gig?.title ?? 'this gig';
  const displayTitle = titleOverride ?? gigTitle;

  const handleUnclaim = () => {
    unclaimClaim(claim.id);
    setUnclaimOpen(false);
  };

  return (
    <>
      <div
        className={`claim-row${completed ? ' claim-row--completed' : ''}${isDragging ? ' claim-row--dragging' : ''}`}
        draggable={draggable}
        onDragStart={(e) => {
          if (!draggable) return;
          e.dataTransfer.setData('text/claim-id', claim.id);
          e.dataTransfer.effectAllowed = 'move';
          setIsDragging(true);
        }}
        onDragEnd={() => setIsDragging(false)}
      >
        <p className="claim-row__title">{displayTitle}</p>
        <div className="claim-row__meta">
          <div className="claim-row__meta-start">
            <Avatar name={assignee.name} avatarUrl={assignee.avatarUrl} size="sm" />
            {gig?.isBonus && <span className="bonus-badge">Bonus</span>}
            <button
              type="button"
              className="claim-row__amount"
              onClick={() => setEditAmountOpen(true)}
              aria-label={`Edit amount: ${formatCurrency(claim.dollarAmount)}`}
            >
              {formatCurrency(claim.dollarAmount)}
            </button>
          </div>
          <div className="claim-row__meta-end">
            {claimed ? (
              <>
                <button
                  type="button"
                  className="btn btn--sm btn--status-claimed"
                  onClick={() => setUnclaimOpen(true)}
                >
                  Claimed
                </button>
                <button
                  type="button"
                  className="btn btn--accent btn--sm claim-row__mark-complete"
                  onClick={() => completeClaim(claim.id)}
                >
                  Mark Complete
                </button>
              </>
            ) : (
              <span className="claim-row__complete-check">
                <CompleteCheckButton onClick={() => uncompleteClaim(claim.id)} />
              </span>
            )}
          </div>
        </div>
      </div>

      <EditClaimAmountModal
        claim={claim}
        gigTitle={displayTitle}
        open={editAmountOpen}
        onClose={() => setEditAmountOpen(false)}
      />

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
