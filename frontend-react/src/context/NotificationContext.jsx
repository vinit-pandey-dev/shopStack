import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Api } from '../api/client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const NotificationContext = createContext(null);
const POLL_MS = 20000; // simple polling; SSE / WebSocket would be the production upgrade

export function NotificationProvider({ children }) {
  const { isLoggedIn } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const lastCount = useRef(null);

  const refreshCount = useCallback(
    async (announce = false) => {
      if (!isLoggedIn) return;
      try {
        const { count } = await Api.getUnreadCount();
        if (announce && lastCount.current !== null && count > lastCount.current) {
          toast('You have a new notification');
        }
        lastCount.current = count;
        setUnread(count);
      } catch {
        /* ignore – next poll will retry */
      }
    },
    [isLoggedIn, toast]
  );

  const loadList = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      setItems(await Api.getNotifications());
    } catch {
      /* ignore */
    }
  }, [isLoggedIn]);

  // call after something happens that creates notifications (e.g. placing an order)
  const refresh = useCallback(() => Promise.all([refreshCount(false), loadList()]), [refreshCount, loadList]);

  useEffect(() => {
    if (!isLoggedIn) {
      setItems([]);
      setUnread(0);
      lastCount.current = null;
      return;
    }
    refresh();
    const t = setInterval(() => refreshCount(true), POLL_MS);
    return () => clearInterval(t);
  }, [isLoggedIn, refresh, refreshCount]);

  const markRead = async (n) => {
    if (n.read) return;
    try {
      await Api.markNotificationRead(n.id);
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      lastCount.current = Math.max(0, (lastCount.current ?? 1) - 1);
    } catch {
      /* ignore */
    }
  };

  const markAllRead = async () => {
    try {
      await Api.markAllNotificationsRead();
      setItems((list) => list.map((x) => ({ ...x, read: true })));
      setUnread(0);
      lastCount.current = 0;
    } catch {
      /* ignore */
    }
  };

  return (
    <NotificationContext.Provider value={{ items, unread, loadList, refresh, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
