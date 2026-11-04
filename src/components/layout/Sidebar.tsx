import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Send,
  Users,
  Layers,
  History,
  BarChart3,
  CreditCard,
  Wallet as WalletIcon,
  UserCheck,
  ShieldCheck,
  Settings,
  Server,
  FileText,
  BadgeCheck,
  LogOut,
  FolderOpen,
  Receipt,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, onClose }) => {
  const { user, wallet, logout } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const customerLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'send_sms', label: 'Send Single SMS', icon: Send },
    { id: 'bulk_sms', label: 'Send Bulk SMS', icon: Users },
    { id: 'contacts', label: 'Contacts', icon: UserCheck },
    { id: 'contact_groups', label: 'Contact Groups', icon: FolderOpen },
    { id: 'campaigns', label: 'SMS Campaigns', icon: Layers },
    { id: 'message_history', label: 'Message History', icon: History },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'buy_credits', label: 'Buy SMS Credits', icon: CreditCard },
    { id: 'wallet', label: 'Wallet & Ledger', icon: WalletIcon },
    { id: 'profile', label: 'Profile & Security', icon: Settings },
  ];

  const adminLinks = [
    { id: 'admin_overview', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'admin_customers', label: 'Customer Accounts', icon: Users },
    { id: 'admin_monitoring', label: 'SMS Traffic Monitor', icon: History },
    { id: 'admin_campaigns', label: 'All Campaigns', icon: Layers },
    { id: 'admin_provider', label: 'SMS Gateway Provider', icon: Server },
    { id: 'admin_sender_ids', label: 'Sender ID Requests', icon: BadgeCheck },
    { id: 'admin_pricing', label: 'Pricing & Packages', icon: CreditCard },
    { id: 'admin_payments', label: 'Payment Reconciliation', icon: Receipt },
    { id: 'admin_settings', label: 'System & Supabase Guide', icon: BookOpen },
  ];

  const activeLinks = isAdmin ? adminLinks : customerLinks;

  const handleNav = (id: string) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Typographic Header */}
        <div className="h-16 px-6 border-b border-neutral-200 flex items-center justify-between">
          <div
            onClick={() => handleNav(isAdmin ? 'admin_overview' : 'dashboard')}
            className="cursor-pointer flex items-center space-x-2 select-none"
          >
            <span className="font-mono text-base font-bold tracking-tight text-neutral-950">
              ICON SEND
            </span>
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-neutral-950 text-white">
              UG
            </span>
          </div>
          {isAdmin && (
            <span className="text-[10px] uppercase font-mono font-bold bg-neutral-100 text-neutral-800 px-2 py-0.5 border border-neutral-300">
              Admin
            </span>
          )}
        </div>

        {/* Credit Quick Balance Card */}
        {!isAdmin && (
          <div className="p-4 mx-3 my-3 bg-neutral-50 border border-neutral-200">
            <div className="text-[11px] font-mono uppercase text-neutral-500 font-medium">
              SMS Balance
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold font-mono text-neutral-950">
                {(wallet?.available_credits ?? 0).toLocaleString()}
              </span>
              <span className="text-xs text-neutral-600">Credits</span>
            </div>
            <button
              onClick={() => handleNav('buy_credits')}
              className="mt-3 w-full bg-neutral-950 text-white text-xs py-1.5 font-medium hover:bg-neutral-800 transition-colors"
            >
              + Buy Credits (UGX)
            </button>
          </div>
        )}

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-[10px] font-mono uppercase text-neutral-400 font-semibold px-3 py-1">
            {isAdmin ? 'Administration' : 'Menu'}
          </div>

          {activeLinks.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-neutral-950 text-white font-medium'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}

          {/* Switch View link for Admin */}
          {isAdmin && (
            <div className="pt-4 mt-4 border-t border-neutral-200">
              <div className="text-[10px] font-mono uppercase text-neutral-400 font-semibold px-3 py-1">
                Customer View
              </div>
              <button
                onClick={() => handleNav('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer ${
                  currentPage === 'dashboard' ? 'bg-neutral-100 font-medium text-neutral-950' : ''
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Customer Dashboard</span>
              </button>
              <button
                onClick={() => handleNav('send_sms')}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer ${
                  currentPage === 'send_sms' ? 'bg-neutral-100 font-medium text-neutral-950' : ''
                }`}
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>Send SMS (Test)</span>
              </button>
            </div>
          )}
        </div>

        {/* User bar & Logout */}
        <div className="p-3 border-t border-neutral-200 bg-white">
          <div className="px-3 py-2 mb-2 bg-neutral-50 border border-neutral-200">
            <div className="text-xs font-medium text-neutral-900 truncate">
              {user?.full_name || 'Customer'}
            </div>
            <div className="text-[11px] text-neutral-500 font-mono truncate">
              {user?.email}
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              onNavigate('home');
            }}
            className="w-full flex items-center justify-center space-x-2 text-xs py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer font-medium"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
