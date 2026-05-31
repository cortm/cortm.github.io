import { useState, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  icon: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  title,
  icon,
  count,
  defaultOpen = true,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="section">
      <button
        type="button"
        className="section__toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="section__heading">
          <span aria-hidden="true">{icon}</span>
          {title}
          {count !== undefined && <span className="section__count">{count}</span>}
        </span>
        <span className={`section__chevron${open ? ' section__chevron--open' : ''}`} aria-hidden="true">
          ›
        </span>
      </button>
      {open && <div className="section__content">{children}</div>}
    </section>
  );
}
