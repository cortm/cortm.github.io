import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Board', icon: '📋' },
  { to: '/gigs', label: 'Gigs', icon: '✨' },
  { to: '/kuleana', label: 'Kuleana', icon: '🌻' },
  { to: '/history', label: 'Past Weeks', icon: '📅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Layout() {
  const isBoard = useLocation().pathname === '/';

  return (
    <div className={`app-shell${isBoard ? ' app-shell--board' : ''}`}>
      <main className="app-main">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main navigation">
        <div className="bottom-nav__inner">
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
        </div>
      </nav>
    </div>
  );
}
