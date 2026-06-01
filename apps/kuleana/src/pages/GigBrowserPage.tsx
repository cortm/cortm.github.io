import { useState } from 'react';
import type { Gig } from '../types';
import { useApp } from '../context/AppContext';
import { ClaimModal } from '../components/ClaimModal';
import { GigCard } from '../components/GigCard';

type Tab = 'brain' | 'work';

export function GigBrowserPage() {
  const {
    brainGigs,
    workGigs,
    isWorkGigClaimed,
    getWorkClaimAssignee,
    getAvatarForName,
  } = useApp();

  const [tab, setTab] = useState<Tab>('brain');
  const [claimGig, setClaimGig] = useState<Gig | null>(null);

  const gigs = tab === 'brain' ? brainGigs : workGigs;

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-header__title">Gig Browser</h2>
        <p className="page-header__subtitle">Find and claim gigs for this week</p>
      </div>

      <div className="tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'brain'}
          className={`tabs__btn${tab === 'brain' ? ' tabs__btn--active' : ''}`}
          onClick={() => setTab('brain')}
        >
          🧠 Brain Gigs
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'work'}
          className={`tabs__btn${tab === 'work' ? ' tabs__btn--active' : ''}`}
          onClick={() => setTab('work')}
        >
          🧹 Work Gigs
        </button>
      </div>

      <div className="gig-grid">
        {gigs.map((gig) => {
          if (tab === 'brain') {
            return (
              <GigCard
                key={gig.id}
                gig={gig}
                onClaim={() => setClaimGig(gig)}
              />
            );
          }

          const assignee = getWorkClaimAssignee(gig.id);
          const taken = isWorkGigClaimed(gig.id) || !!assignee;
          const assigneeAvatar = assignee ? getAvatarForName(assignee) : null;

          return (
            <GigCard
              key={gig.id}
              gig={gig}
              taken={taken}
              assigneeName={assignee ?? undefined}
              assigneeAvatarUrl={assigneeAvatar?.avatarUrl}
              onClaim={() => setClaimGig(gig)}
              disabled={taken}
            />
          );
        })}
      </div>

      <ClaimModal gig={claimGig} open={!!claimGig} onClose={() => setClaimGig(null)} />
    </div>
  );
}
