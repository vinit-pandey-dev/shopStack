import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, CreditCard, Package, Truck } from 'lucide-react';
import { timeAgo } from '../api/client';
import { useNotifications } from '../context/NotificationContext';

const icons = { ORDER_PLACED: Package, PAYMENT_SUCCESS: CreditCard, ORDER_STATUS: Truck };

export default function NotificationBell() {
  const { items, unread, loadList, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const toggle = () => {
    if (!open) loadList();
    setOpen(!open);
  };

  const onItemClick = (n) => {
    markRead(n);
    setOpen(false);
    if (n.orderId) navigate('/orders');
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="btn-ghost relative !px-3" aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1 font-mono text-[11px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[4.5rem] z-50 overflow-hidden rounded-xl border border-line bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-base font-semibold">Notifications</h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-xs font-medium text-pine hover:underline">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-[26rem] divide-y divide-line/70 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-12 text-center text-sm text-ink-soft">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                You're all caught up.
              </li>
            ) : (
              items.map((n) => {
                const Icon = icons[n.type] || Bell;
                return (
                  <li key={n.id}>
                    <button
                      onClick={() => onItemClick(n)}
                      className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-paper ${n.read ? '' : 'bg-brass/5'}`}
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${n.read ? 'bg-paper-dim text-ink-soft' : 'bg-pine text-brass-light'}`}>
                        <Icon size={16} />
                      </span>
                      <span className="flex-1">
                        <span className={`block text-sm leading-snug ${n.read ? 'text-ink-soft' : 'font-medium text-ink'}`}>{n.message}</span>
                        <span className="mt-1 block text-xs text-ink-soft/80">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brass" />}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
