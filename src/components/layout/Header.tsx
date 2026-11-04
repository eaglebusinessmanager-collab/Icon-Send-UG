import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, Bell, Check, Plus, ExternalLink } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenSidebar: () => void;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onOpenSidebar, onNavigate }) => {
  const { user, wallet, notifications, unreadNotifsCount, markNotificationRead, markAllNotificationsRead } = useAuth();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile trigger & Page Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSidebar}
            className="lg:hidden p-2 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="hidden sm:block text-xs text-neutral-500 font-mono">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Quick actions, Balance indicator, Notification bell */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Quick Credit display */}
          <div
            onClick={() => onNavigate('wallet')}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-xs font-mono cursor-pointer transition-colors"
          >
            <span className="text-neutral-500">Credits:</span>
            <span className="font-bold text-neutral-950">
              {(wallet?.available_credits ?? 0).toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => onNavigate('send_sms')}
            className="hidden md:inline-flex items-center space-x-1.5 text-xs bg-neutral-950 hover:bg-neutral-800 text-white px-3 py-1.5 transition-colors cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New SMS</span>
          </button>

          {/* Notifications bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative p-2 text-neutral-700 hover:bg-neutral-100 border border-transparent hover:border-neutral-200 cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-neutral-950 rounded-full" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-neutral-200 shadow-sm z-50">
                <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                    Notifications ({unreadNotifsCount} new)
                  </div>
                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-[11px] text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs ${
                          n.is_read ? 'bg-white' : 'bg-neutral-50 font-medium'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-neutral-950 font-semibold">{n.title}</span>
                          {!n.is_read && (
                            <button
                              onClick={() => markNotificationRead(n.id)}
                              className="text-neutral-400 hover:text-neutral-900 p-0.5 cursor-pointer"
                              title="Mark read"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-neutral-600 mt-1 leading-normal">{n.message}</p>
                        <span className="text-[10px] text-neutral-400 font-mono mt-1 block">
                          {new Date(n.created_at).toLocaleDateString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
