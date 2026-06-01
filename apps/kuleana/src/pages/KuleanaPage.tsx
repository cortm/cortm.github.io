import { useApp } from '../context/AppContext';

export function KuleanaPage() {
  const { kuleanaGigs } = useApp();

  return (
    <div className="page">
      <div className="page-header">
        <h2 className="page-header__title">Kuleana</h2>
        <p className="page-header__subtitle">
          Our standing household responsibilities — not for pay, just part of who we are.
        </p>
      </div>

      <div className="manifesto-banner">
        <span className="manifesto-banner__icon" aria-hidden="true">
          🌻
        </span>
        <p>
          These aren&apos;t gigs to claim. They&apos;re values we live by — every day, together.
        </p>
      </div>

      <ol className="kuleana-list">
        {kuleanaGigs.map((item, i) => (
          <li key={item.id} className="kuleana-card">
            <span className="kuleana-card__num">{i + 1}</span>
            <p className="kuleana-card__text">{item.title}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
