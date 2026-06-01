import { useApp } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';
import { Avatar } from './Avatar';

interface TotalsPersonRowProps {
  name: string;
  amount: number;
}

export function TotalsPersonRow({ name, amount }: TotalsPersonRowProps) {
  const { getAvatarForName } = useApp();
  const person = getAvatarForName(name);

  return (
    <div className="totals-bar__person">
      <span className="totals-bar__person-label">
        <Avatar name={person.name} avatarUrl={person.avatarUrl} size="pill" />
        <span>{name}</span>
      </span>
      <strong>{formatCurrency(amount)}</strong>
    </div>
  );
}
