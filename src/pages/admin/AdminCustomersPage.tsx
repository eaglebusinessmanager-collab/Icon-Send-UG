import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { User, Wallet } from '../../types';
import { Users, Search, ShieldAlert, CheckCircle2, XCircle, Plus, Minus, X, AlertCircle } from 'lucide-react';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<
    Array<{
      user: User;
      wallet?: Wallet;
      stats: { totalMessagesSent: number; delivered: number };
    }>
  >([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Credit adjustment modal
  const [selectedCustomer, setSelectedCustomer] = useState<{ user: User; wallet?: Wallet } | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('50');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [modalFeedback, setModalFeedback] = useState('');
  const [modalError, setModalError] = useState('');

  const loadCustomers = async () => {
    try {
      const list = await api.admin.customers();
      setCustomers(list);
    } catch {
      console.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    if (confirm(`Are you sure you want to change ${user.email} status to ${newStatus}?`)) {
      await api.admin.updateCustomerStatus(user.id, {
        status: newStatus,
        reason: `Administrative toggle by manager`,
      });
      loadCustomers();
    }
  };

  const handleAdjustCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    setModalFeedback('');
    setModalError('');

    const count = parseInt(adjustAmount, 10);
    if (isNaN(count) || count === 0) {
      setModalError('Enter a valid non-zero number of credits.');
      return;
    }
    if (!adjustReason.trim()) {
      setModalError('An audit reason is required.');
      return;
    }

    setAdjustLoading(true);
    try {
      const res = await api.admin.adjustCredits(selectedCustomer.user.id, {
        amount_credits: count,
        reason: adjustReason.trim(),
      });
      setModalFeedback(res.message);
      setAdjustReason('');
      loadCustomers();
      setTimeout(() => {
        setSelectedCustomer(null);
        setModalFeedback('');
      }, 1500);
    } catch (err: unknown) {
      setModalError(err instanceof Error ? err.message : 'Error adjusting credits');
    } finally {
      setAdjustLoading(false);
    }
  };

  const filtered = customers.filter(
    c =>
      c.user.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.user.email.toLowerCase().includes(search.toLowerCase()) ||
      c.user.phone_number.toLowerCase().includes(search.toLowerCase()) ||
      (c.user.company_name && c.user.company_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Customer Account Administration
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Inspect customer wallets, suspend accounts, and execute audited credit adjustments.
            </p>
          </div>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="w-64 text-xs px-3 py-2 pl-8 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Company</th>
                <th className="p-3">Available Credits</th>
                <th className="p-3">SMS Sent</th>
                <th className="p-3">Status</th>
                <th className="p-3">Registered</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(({ user, wallet, stats }) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="p-3">
                    <span className="font-bold text-neutral-950 block font-sans">{user.full_name}</span>
                    <span className="text-neutral-500 text-[11px]">{user.email}</span>
                  </td>
                  <td className="p-3 font-semibold text-neutral-900">{user.phone_number}</td>
                  <td className="p-3 text-neutral-600">{user.company_name || '-'}</td>
                  <td className="p-3">
                    <span className="font-bold text-neutral-950 text-sm">
                      {(wallet?.available_credits ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-neutral-400 block">
                      Promos: {wallet?.promotional_credits || 0}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-neutral-950">{stats.totalMessagesSent}</span>
                    <span className="text-[10px] text-neutral-400 block">{stats.delivered} delivered</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        user.status === 'active'
                          ? 'bg-neutral-950 text-white'
                          : 'bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-400 text-[10px]">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : '-'}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedCustomer({ user, wallet });
                        setAdjustAmount('50');
                        setAdjustReason('');
                        setModalFeedback('');
                        setModalError('');
                      }}
                      className="text-xs border border-neutral-300 px-2.5 py-1 hover:bg-neutral-100 font-medium cursor-pointer"
                    >
                      Adjust Credits
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`text-xs px-2.5 py-1 font-medium cursor-pointer ${
                        user.status === 'active'
                          ? 'text-neutral-600 hover:text-neutral-950'
                          : 'bg-neutral-950 text-white'
                      }`}
                    >
                      {user.status === 'active' ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit Adjustment Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                  Manual Credit Adjustment
                </h3>
                <span className="text-xs text-neutral-500 font-mono">
                  {selectedCustomer.user.email} (Current: {selectedCustomer.wallet?.available_credits || 0})
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalFeedback && (
              <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
                {modalFeedback}
              </div>
            )}

            {modalError && (
              <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
                {modalError}
              </div>
            )}

            <form onSubmit={handleAdjustCredits} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  Credit Amount (+ to Add, - to Deduct) *
                </label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 100 or -50"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  Mandatory Audit Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Compensated for network outage / Reconciled manual cash payment..."
                  className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-sans text-xs"
                />
              </div>

              <div className="p-2 bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-500">
                This adjustment will be permanently logged in the system audit trail with your administrator identity.
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 border border-neutral-300 font-medium hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-2 bg-neutral-950 text-white font-medium hover:bg-neutral-800 disabled:opacity-40"
                >
                  {adjustLoading ? 'Executing...' : 'Commit Credit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
