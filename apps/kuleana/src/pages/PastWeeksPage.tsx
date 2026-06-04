import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { computeTotals, formatCurrency } from '../lib/utils';
import { formatWeekRange } from '../lib/week';
import { StatusPill } from '../components/StatusPill';
import { TotalsPersonRow } from '../components/TotalsPersonRow';

export function PastWeeksPage() {
  const { state } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
          const totals = computeTotals(week.claims);
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
                <div className="history-week__details">
                  {week.claims.length === 0 ? (
                    <p className="empty-state">No gigs were claimed this week.</p>
                  ) : (
                    <ul className="history-claims">
                      {week.claims.map((claim) => {
                        const gig = state.gigs.find((g) => g.id === claim.gigId);
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

                  {totals.byPerson.length > 0 && (
                    <div className="history-totals">
                      <h4>Total earned</h4>
                      <div className="totals-bar__body totals-bar__body--history">
                        <div className="totals-bar__people">
                          {totals.byPerson.map((entry) => (
                            <TotalsPersonRow key={entry.key} total={entry} />
                          ))}
                        </div>
                        <div className="totals-bar__grand">
                          <span>Week total</span>
                          <strong>{formatCurrency(totals.grandTotal)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
