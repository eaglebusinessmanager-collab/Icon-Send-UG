import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SMSCampaign, SMSMessage, WalletTransaction } from '../../types';
import {
  Send,
  Users,
  CreditCard,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (page: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user, wallet, refreshWallet } = useAuth();
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const loadData = async () => {
    try {
      const [msgRes, campRes, walRes] = await Promise.all([
        api.sms.getMessages({ limit: 10 }),
        api.campaigns.list(),
        api.wallet.get(),
      ]);
      setMessages(msgRes.messages);
      setCampaigns(campRes);
      setTransactions(walRes.transactions.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSyncDelivery = async () => {
    setSyncing(true);
    setSyncMessage('');
    try {
      const res = await api.sms.syncDeliveryStatus();
      setSyncMessage(`Checked ${res.checked} pending messages. Updated ${res.updated} delivery records.`);
      await loadData();
      await refreshWallet();
    } catch {
      setSyncMessage('Failed to sync statuses with gateway.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMessage(''), 4000);
    }
  };

  const deliveredCount = messages.filter(m => m.status === 'delivered').length;
  const pendingCount = messages.filter(m => ['queued', 'submitted', 'sent', 'buffered'].includes(m.status)).length;
  const failedCount = messages.filter(m => ['failed', 'rejected'].includes(m.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-neutral-500 font-semibold">
              Customer Workspace
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 mt-1">
              Welcome, {user?.full_name}
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              {user?.company_name ? `${user.company_name} · ` : ''}Default Sender ID:{' '}
              <span className="font-mono font-bold text-neutral-900">ICONSEND</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('send_sms')}
              className="bg-neutral-950 text-white px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Single</span>
            </button>
            <button
              onClick={() => onNavigate('bulk_sms')}
              className="bg-neutral-950 text-white px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Send Bulk SMS</span>
            </button>
            <button
              onClick={() => onNavigate('buy_credits')}
              className="border border-neutral-300 text-neutral-900 px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Buy Credits (UGX)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900 flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage('')} className="text-neutral-500 hover:text-neutral-900">&times;</button>
        </div>
      )}

      {/* Core Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Available Credits */}
        <div className="bg-white border-2 border-neutral-950 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Available Credits
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">
            {(wallet?.available_credits ?? 0).toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] font-mono text-neutral-500 flex items-center justify-between">
            <span>Used: {(wallet?.used_credits ?? 0).toLocaleString()}</span>
            <button
              onClick={() => onNavigate('buy_credits')}
              className="text-neutral-950 font-bold underline hover:text-neutral-700"
            >
              Top Up &rarr;
            </button>
          </div>
        </div>

        {/* Total Sent */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Total Messages Sent
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {messages.length}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            Across single & bulk batches
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              Delivered
            </span>
            <CheckCircle2 className="w-4 h-4 text-neutral-950" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {deliveredCount}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            Direct handset confirmed
          </div>
        </div>

        {/* Pending / In Flight */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              In Transit
            </span>
            <Clock className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {pendingCount}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
            <span>Queued on carrier</span>
            <button
              onClick={handleSyncDelivery}
              disabled={syncing}
              className="text-neutral-950 underline hover:text-neutral-700 cursor-pointer"
              title="Query gateway delivery status"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Failed */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              Failed / Reconciled
            </span>
            <XCircle className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {failedCount}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            Credits auto-refunded
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Campaigns & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white border border-neutral-200">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Recent Campaigns
            </div>
            <button
              onClick={() => onNavigate('campaigns')}
              className="text-xs text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
            >
              View All ({campaigns.length})
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {campaigns.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No campaigns launched yet.{' '}
                <button
                  onClick={() => onNavigate('bulk_sms')}
                  className="font-bold underline text-neutral-950 ml-1"
                >
                  Create Bulk Campaign
                </button>
              </div>
            ) : (
              campaigns.slice(0, 4).map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-950 block">{c.name}</span>
                    <span className="text-neutral-500 font-mono text-[11px]">
                      {c.valid_recipients} recipients · {c.total_credits} credits · Sender: {c.sender_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        c.status === 'completed'
                          ? 'bg-neutral-950 text-white'
                          : c.status === 'failed'
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-mono mt-1">
                      {new Date(c.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Wallet Transactions */}
        <div className="bg-white border border-neutral-200">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Recent Wallet Transactions
            </div>
            <button
              onClick={() => onNavigate('wallet')}
              className="text-xs text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
            >
              View Ledger
            </button>
          </div>

          <div className="divide-y divide-neutral-100">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No wallet transactions recorded.
              </div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-1">
                    <span className="font-medium text-neutral-900 block truncate max-w-xs">
                      {tx.description}
                    </span>
                    <span className="text-neutral-400 font-mono text-[10px]">
                      {new Date(tx.created_at).toLocaleDateString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        tx.amount_credits > 0 ? 'text-neutral-950' : 'text-neutral-600'
                      }`}
                    >
                      {tx.amount_credits > 0 ? `+${tx.amount_credits}` : tx.amount_credits} credits
                    </span>
                    <span className="block text-[10px] text-neutral-400 font-mono mt-0.5">
                      Bal: {tx.balance_after}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent SMS Dispatches Table */}
      <div className="bg-white border border-neutral-200">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
            Recent SMS Dispatches
          </div>
          <button
            onClick={() => onNavigate('message_history')}
            className="text-xs text-neutral-600 hover:text-neutral-950 underline cursor-pointer"
          >
            Full Message History &rarr;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Recipient</th>
                <th className="p-3">Carrier</th>
                <th className="p-3">Message Preview</th>
                <th className="p-3">Parts</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Status</th>
                <th className="p-3">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-neutral-500">
                    No SMS messages sent yet.
                  </td>
                </tr>
              ) : (
                messages.slice(0, 5).map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-neutral-950">{m.normalized_recipient}</td>
                    <td className="p-3 text-neutral-600">{m.carrier || 'Uganda Telecom'}</td>
                    <td className="p-3 text-neutral-800 max-w-xs truncate font-sans text-xs">
                      {m.message}
                    </td>
                    <td className="p-3 text-neutral-600">{m.segments}</td>
                    <td className="p-3 font-bold text-neutral-950">{m.credits_deducted}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          m.status === 'delivered'
                            ? 'bg-neutral-950 text-white'
                            : m.status === 'failed'
                            ? 'bg-neutral-200 text-neutral-800'
                            : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-400 text-[10px]">
                      {new Date(m.created_at).toLocaleDateString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
