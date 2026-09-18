import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api, { SOCKET_URL } from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailLogs, setEmailLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch initial notifications & email logs from backend
  const refreshNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }

      const emailRes = await api.get('/notifications/emails');
      if (emailRes.data.success) {
        setEmailLogs(emailRes.data.emailLogs);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) socket.disconnect();
      return;
    }

    refreshNotifications();

    // Initialize Socket.IO connection using environment-configured URL
    const newSocket = io(SOCKET_URL || undefined);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_user_room', user.id);
    });

    // Listen for in-app real-time notifications
    newSocket.on('new_notification', (newNotif) => {
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Show toast alert
      setToast({
        title: newNotif.title,
        message: newNotif.message,
        type: newNotif.type
      });

      setTimeout(() => setToast(null), 5000);
    });

    // Listen for live email activity updates
    newSocket.on('email_activity', (emailEvent) => {
      setEmailLogs(prev => [emailEvent, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      emailLogs,
      toast,
      setToast,
      markAsRead,
      markAllAsRead,
      refreshNotifications
    }}>
      {children}

      {/* Real-Time Toast Alert Pop-Up Overlay */}
      {toast && (
        <div className="fixed top-20 right-6 z-50 max-w-md bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl border border-blue-500/40 flex items-start space-x-3 transition-all transform animate-bounce">
          <div className={`p-2.5 rounded-xl text-white font-bold flex items-center justify-center shrink-0 ${
            toast.type?.includes('REJECT') ? 'bg-rose-600' :
            toast.type?.includes('APPROVED') || toast.type?.includes('FINAL') ? 'bg-emerald-600' : 'bg-blue-600'
          }`}>
            🔔
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs text-white tracking-wide">{toast.title}</h4>
            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            <span className="text-[9px] text-blue-400 mt-1 block font-mono">Real-Time In-App Alert</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition text-xs"
          >
            ✕
          </button>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);
