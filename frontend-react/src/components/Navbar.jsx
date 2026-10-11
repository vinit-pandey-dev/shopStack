import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const link = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-pine' : 'text-ink-soft hover:text-pine'}`;

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="font-display text-2xl font-bold tracking-tight text-pine">
          Shop<span className="text-brass">Stack</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          <NavLink to="/" end className={link}>Shop</NavLink>
          <NavLink to="/orders" className={link}>Orders</NavLink>
          {isAdmin && <NavLink to="/admin" className={link}>Admin</NavLink>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {isLoggedIn && <NotificationBell />}
          <Link to="/cart" className="btn-ghost relative !px-3" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brass px-1 font-mono text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          {isLoggedIn ? (
            <div className="flex items-center gap-3 border-l border-line pl-4">
              <span className="flex items-center gap-1.5 text-sm text-ink-soft">
                <User size={16} /> {user.username}
                {isAdmin && <span className="rounded bg-brass/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brass-dark">Admin</span>}
              </span>
              <button onClick={handleLogout} className="btn-outline !py-1.5">
                <LogOut size={15} /> Log out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary">Log in</Link>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="flex items-center gap-1 md:hidden">
          {isLoggedIn && <NotificationBell />}
          <Link to="/cart" className="btn-ghost relative !px-3" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brass px-1 font-mono text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>
          <button className="btn-ghost !px-3" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-1 border-t border-line bg-paper px-5 py-4 md:hidden">
          <NavLink to="/" end className={link} onClick={() => setOpen(false)}>
            <span className="block py-2">Shop</span>
          </NavLink>
          <NavLink to="/orders" className={link} onClick={() => setOpen(false)}>
            <span className="block py-2">Orders</span>
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={link} onClick={() => setOpen(false)}>
              <span className="block py-2">Admin</span>
            </NavLink>
          )}
          {isLoggedIn ? (
            <button onClick={handleLogout} className="btn-outline mt-2 w-full">
              <LogOut size={15} /> Log out ({user.username})
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="btn-primary mt-2 w-full">
              Log in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
