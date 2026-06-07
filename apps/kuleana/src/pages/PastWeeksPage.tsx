import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Claim, Week } from '../types';
import { useApp } from '../context/AppContext';
import { computeBoardTotals, computeTotals, formatCurrency, getClaimPersonKey } from '../lib/utils';
import { resolveGigForWeek } from '../lib/gigSnapshots';
import { canRestoreWeek } from '../lib/weekRecovery';
import { formatWeekRange } from '../lib/week';
import { StatusPill } from '../components/StatusPill';
import { TotalsPersonRow } from '../components/TotalsPersonRow';

function sortHistoryClaims(claims: Claim[]): Claim[] {
  return [...claims].sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === 'completed') return -1;
    return 1;
  });
}

interface PastWeekDetailsProps {
  week: Week;
  filterPersonKey: string | null;
  setFilterPersonKey: Dispatch<SetStateAction<string | null>>;
}

function PastWeekDetails({ week, filterPersonKey, setFilterPersonKey }: PastWeekDetailsProps) {
  const { state, reopenLastClosedWeek } = useApp();
  const navigate = useNavigate();
  const canRestore = canRestoreWeek(week, state);

  const totals = useMemo(() => {
    if (state.familyMembers.length > 0) {
      return computeBoardTotals(week.claims, state.familyMembers);
    }
    return computeTotals(week.claims);
  }, [week.claims, state.familyMembers]);

  const filteredPersonName = useMemo(() => {
    if (!filterPersonKey) return null;
    return (
      state.familyMembers.find((m) => m.id === filterPersonKey)?.name ??
      totals.byPerson.find((entry) => entry.key === filterPersonKey)?.assigneeName ??
      null
    );
  }, [filterPersonKey, state.familyMembers, totals.byPerson]);

  const visibleClaims = useMemo(() => {
    const sorted = sortHistoryClaims(week.claims);
    if (!filterPersonKey) return sorted;
    return sorted.filter((claim) => getClaimPersonKey(claim) === filterPersonKey);
  }, [week.claims, filterPersonKey]);

  const showTotals = totals.byPerson.length > 0;

  return (
    <div className="history-week__details">
      {showTotals && (
        <div className="history-totals history-totals--top">
          <div className="history-totals__header">
            <h4 className="history-totals__title">Total earned</h4>
            <strong className="history-totals__amount">{formatCurrency(totals.grandTotal)}</strong>
          </div>
          <div className="totals-bar__body totals-bar__body--history">
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
          </div>
        </div>
      )}

      {week.claims.length === 0 ? (
        <p className="empty-state">No gigs were claimed this week.</p>
      ) : visibleClaims.length === 0 ? (
        <p className="empty-state">
          {filterPersonKey && filteredPersonName
            ? `No gigs for ${filteredPersonName} this week.`
            : 'No gigs were claimed this week.'}
        </p>
      ) : (
        <ul className="history-claims">
          {visibleClaims.map((claim) => {
            const gig = resolveGigForWeek(claim.gigId, week, state.gigs);
            return (
              <li key={claim.id} className="history-claim">
                <div>
                  <p className="history-claim__title">{gig?.title ?? 'Unknown gig'}</p>
                  <p className="history-claim__meta">
                    {claim.assigneeName} · {formatCurrency(claim.dollarAmount)}
                  </p>
                </div>
                <StatusPill status={claim.status} />
              </li>
            );
          })}
        </ul>
      )}

      {canRestore && (
        <div className="history-week__restore">
          <button
            type="button"
            className="btn btn--ghost btn--block history-week__restore-btn"
            onClick={() => {
              if (reopenLastClosedWeek()) navigate('/');
            }}
          >
            Restore
          </button>
        </div>
      )}
    </div>
  );
}

export function PastWeeksPage() {
  const { state } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterPersonKey, setFilterPersonKey] = useState<string | null>(null);

  useEffect(() => {
    setFilterPersonKey(null);
  }, [expandedId]);

  if (state.pastWeeks.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h2 className="page-header__title">Past Weeks</h2>
          <p className="page-header__subtitle">Review completed weeks and earnings</p>
        </div>
        <p className="empty-state empty-state--large">
          No closed weeks yet. When a parent closes out the week, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-header__title">Past Weeks</h2>
        <p className="page-header__subtitle">Review completed weeks and earnings</p>
      </div>

      <div className="history-list">
        {state.pastWeeks.map((week) => {
          const expanded = expandedId === week.id;
          const label = formatWeekRange(week.startDate, week.endDate);

          return (
            <article key={week.id} className="history-week">
              <button
                type="button"
                className="history-week__toggle"
                onClick={() => setExpandedId(expanded ? null : week.id)}
                aria-expanded={expanded}
              >
                <span>
                  {label} <span className="history-week__check">✓</span>
                </span>
                <span className={`section__chevron${expanded ? ' section__chevron--open' : ''}`}>
                  ›
                </span>
              </button>

              {expanded && (
                <PastWeekDetails
                  week={week}
                  filterPersonKey={filterPersonKey}
                  setFilterPersonKey={setFilterPersonKey}
                />
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
