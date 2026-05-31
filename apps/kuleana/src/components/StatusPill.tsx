interface StatusPillProps {
  status: 'claimed' | 'completed' | 'available' | 'locked';
  onClick?: () => void;
}

const labels: Record<StatusPillProps['status'], string> = {
  claimed: 'Claimed',
  completed: 'Completed',
  available: 'Available',
  locked: 'Taken',
};

export function StatusPill({ status, onClick }: StatusPillProps) {
  const className = `pill pill--${status}${onClick ? ' pill--interactive' : ''}`;

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {labels[status]}
      </button>
    );
  }

  return <span className={className}>{labels[status]}</span>;
}
