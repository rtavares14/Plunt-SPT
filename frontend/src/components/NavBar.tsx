import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import YardIcon from '@mui/icons-material/Yard';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { useAuth } from '../context/useAuth';

const NAV_LINKS = [
  { to: '/feed', label: 'Feed' },
  { to: '/garden', label: 'My garden' },
  { to: '/friends', label: 'Friends' },
];

function Avatar({ name, src, size = 'sm' }: { name: string; src?: string | null; size?: 'sm' | 'icon' | 'lg' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const dim = size === 'lg' ? 'w-11 h-11 text-lg' : size === 'icon' ? 'w-6 h-6 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div
      className={`${dim} rounded-full overflow-hidden bg-olive-light border border-cream-soft/40 flex items-center justify-center text-cream-soft font-semibold shrink-0`}
    >
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span>{initial}</span>
      }
    </div>
  );
}

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="bg-olive-main text-cream-soft sticky top-0 z-40 font-lateef">
        <div className="flex items-center h-14 sm:h-16 px-3 sm:px-6 lg:px-10">
          <Link to="/feed" aria-label="myPlunt home" className="flex items-center">
            <span className="inline-flex items-center gap-2 bg-olive-light text-cream-main rounded-lg px-3 sm:px-4 py-1.5">
              <YardIcon className="!text-cream-main !text-[22px]" />
              <span className="hidden md:inline text-xl font-semibold leading-none">myPlunt</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-10 ml-10 flex-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-xl text-cream-soft transition-opacity hover:opacity-80 ${
                    isActive ? 'font-semibold' : 'font-normal'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4 ml-auto">
            <IconButton aria-label="Notifications" className="!text-cream-soft">
              <NotificationsNoneIcon />
            </IconButton>
            <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} />
          </div>

          <IconButton
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
            className="!text-cream-soft md:!hidden !ml-auto"
          >
            <MenuIcon />
          </IconButton>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute top-0 right-0 bottom-0 w-3/4 max-w-xs bg-olive-main text-cream-soft font-lateef flex flex-col shadow-xl">

            {/* All nav links */}
            <nav className="flex flex-col px-6 pt-5 pb-4 gap-5">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `text-xl text-cream-soft hover:opacity-80 ${
                      isActive ? 'font-semibold' : 'font-normal'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-cream-soft/20 mx-6" />

            <nav className="flex flex-col px-6 pt-4 gap-5">
              <NavLink
                to="/notifications"
                onClick={closeMenu}
                className="flex items-center gap-3 text-xl text-cream-soft hover:opacity-80"
              >
                <NotificationsNoneIcon className="!text-[22px]" />
                <span>Notifications</span>
              </NavLink>
              <NavLink
                to="/profile"
                onClick={closeMenu}
                className="flex items-center gap-3 text-xl text-cream-soft hover:opacity-80"
              >
                <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} size="icon" />
                <span>Profile</span>
              </NavLink>
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}

export default NavBar;
