import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Wallet, NotificationItem } from '../types';
import { api, tokenStorage } from '../lib/api';

interface AuthContextType {
  user: User | null;
  wallet: Wallet | null;
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    company_name?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshWallet: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.auth.me();
      setUser(data.user);
      setWallet(data.wallet);
    } catch {
      tokenStorage.clear();
      setUser(null);
      setWallet(null);
    }
  };

  const refreshWallet = async () => {
    try {
      const data = await api.wallet.get();
      setWallet(data.wallet);
    } catch {
      // Ignored
    }
  };

  const refreshNotifications = async () => {
    if (!tokenStorage.get()) return;
    try {
      const list = await api.notifications.list();
      setNotifications(list);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    const token = tokenStorage.get();
    if (token) {
      refreshUser().finally(() => {
        setIsLoading(false);
        refreshNotifications();
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    tokenStorage.set(res.token);
    setUser(res.user);
    setWallet(res.wallet);
    refreshNotifications();
  };

  const register = async (payload: {
    full_name: string;
    email: string;
    phone_number: string;
    password: string;
    company_name?: string;
  }) => {
    const res = await api.auth.register(payload);
    tokenStorage.set(res.token);
    setUser(res.user);
    setWallet(res.wallet);
    refreshNotifications();
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
    setWallet(null);
    setNotifications([]);
  };

  const markNotificationRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsRead = async () => {
    await api.notifications.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        wallet,
        notifications,
        unreadNotifsCount,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        refreshWallet,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
