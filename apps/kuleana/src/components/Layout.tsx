import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Board', icon: '📋' },
  { to: '/gigs', label: 'Gigs', icon: '✨' },
  { to: '/kuleana', label: 'Kuleana', icon: '🌻' },
  { to: '/history', label: 'Past Weeks', icon: '📅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" aria-hidden="true">
            🏡
          </span>
          <div>
            <h1 className="app-header__title">Kuleana</h1>
            <p className="app-header__tagline">Family responsibility &amp; gig tracker</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `bottom-nav__link${isActive ? ' bottom-nav__link--active' : ''}`
            }
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="bottom-nav__label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
