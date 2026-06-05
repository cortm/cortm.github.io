import type { PersonTotal } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { Avatar } from './Avatar';

interface TotalsPersonRowProps {
  total: PersonTotal;
  selected?: boolean;
  onSelect?: () => void;
}

export function TotalsPersonRow({ total, selected = false, onSelect }: TotalsPersonRowProps) {
  const { getAvatarForClaim } = useApp();
  const person = getAvatarForClaim({
    id: '',
    gigId: '',
    weekId: '',
    assigneeName: total.assigneeName,
    familyMemberId: total.familyMemberId,
    dollarAmount: 0,
    status: 'completed',
    claimedAt: '',
  });
  const amountLabel = formatCurrency(total.amount);

  const content = (
    <>
      <Avatar
        name={person.name}
        avatarUrl={person.avatarUrl}
        size="totals"
        squircle
      />
      <span className="totals-squircle__amount" aria-hidden="true">
        {amountLabel}
      </span>
      <span className="visually-hidden">
        {person.name}: {amountLabel}
        {selected ? ' · filtering board to this person' : ''}
      </span>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={`totals-squircle totals-squircle--interactive${selected ? ' totals-squircle--selected' : ''}`}
        title={`${person.name}: ${amountLabel}`}
        aria-pressed={selected}
        onClick={onSelect}
      >
        {content}
      </button>
    );
  }

  return (
    <div className="totals-squircle" title={`${person.name}: ${amountLabel}`}>
      {content}
    </div>
  );
}
