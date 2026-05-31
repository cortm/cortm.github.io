interface StatusPillProps {
  status: 'claimed' | 'completed' | 'available' | 'locked';
}

const labels: Record<StatusPillProps['status'], string> = {
  claimed: 'Claimed',
  completed: 'Completed',
  available: 'Available',
  locked: 'Taken',
};

export function StatusPill({ status }: StatusPillProps) {
  return <span className={`pill pill--${status}`}>{labels[status]}</span>;
}
