import type { PersonTotal } from '../lib/utils';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { Avatar } from './Avatar';

interface TotalsPersonRowProps {
  total: PersonTotal;
}

export function TotalsPersonRow({ total }: TotalsPersonRowProps) {
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

  return (
    <div className="totals-squircle" title={`${person.name}: ${amountLabel}`}>
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
      </span>
    </div>
  );
}
