interface CompleteCheckButtonProps {
  onClick: () => void;
}

export function CompleteCheckButton({ onClick }: CompleteCheckButtonProps) {
  return (
    <button
      type="button"
      className="complete-check"
      aria-label="Mark incomplete"
      onClick={onClick}
    >
      <svg className="complete-check__icon" viewBox="0 0 16 16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6.2 11.2 3.4 8.4l-.9.9 3.7 3.7 8.3-8.3-.9-.9-7.4 7.4Z"
        />
      </svg>
    </button>
  );
}
