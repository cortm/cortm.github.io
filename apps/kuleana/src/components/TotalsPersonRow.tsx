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

  return (
    <div className="totals-bar__person">
      <span className="totals-bar__person-label">
        <Avatar name={person.name} avatarUrl={person.avatarUrl} size="sm" />
        <span>{person.name}</span>
      </span>
      <strong>{formatCurrency(total.amount)}</strong>
    </div>
  );
}
