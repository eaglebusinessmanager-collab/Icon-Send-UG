import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PaymentTransaction } from '../../types';
import { Receipt, CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react';

export const AdminPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [actionFeedback, setActionFeedback] = useState<string>('');

  const loadPayments = async () => {
    try {
      const list = await api.admin.payments();
      setPayments(list);
    } catch {
      console.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleReconcile = async (id: string, action: 'approve' | 'reject') => {
    const notes = `Reconciled as ${action.toUpperCase()} on ${new Date().toLocaleDateString('en-GB')}`;
    try {
      const res = await api.admin.reconcilePayment(id, { action, notes });
      setActionFeedback(res.message);
      loadPayments();
      setTimeout(() => setActionFeedback(''), 4000);
    } catch {
      setActionFeedback('Error reconciling payment. Please try again.');
      setTimeout(() => setActionFeedback(''), 4000);
    }
  };

  const filtered = payments.filter(p => filter === 'all' || p.status === filter);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Payment Reconciliation Desk
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Verify mobile money slips, Pesapal webhooks, and bank transfer credit allocations.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {(['all', 'pending', 'completed', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-mono uppercase px-3 py-1.5 border transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-neutral-950 text-white font-bold border-neutral-950'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {f} ({payments.filter(p => f === 'all' || p.status === f).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900 flex justify-between items-center">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback('')} className="text-neutral-500 hover:text-neutral-900">&times;</button>
        </div>
      )}

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Txn Reference</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount (UGX)</th>
                <th className="p-3">Credits To Add</th>
                <th className="p-3">Phone / Notes</th>
                <th className="p-3">Status</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Reconciliation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-950">{p.transaction_reference}</td>
                  <td className="p-3 uppercase text-neutral-700">{p.payment_method.replace('_', ' ')}</td>
                  <td className="p-3 font-bold text-neutral-950">
                    UGX {p.amount_ugx.toLocaleString()}
                  </td>
                  <td className="p-3 font-semibold text-neutral-900">+{p.credits_added}</td>
                  <td className="p-3 text-neutral-500 text-[11px] max-w-xs truncate">
                    {p.phone_number ? `${p.phone_number} · ` : ''}{p.notes || '-'}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        p.status === 'completed'
                          ? 'bg-neutral-950 text-white'
                          : p.status === 'rejected'
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-400 text-[10px]">
                    {new Date(p.created_at).toLocaleDateString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {p.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleReconcile(p.id, 'approve')}
                          className="px-2.5 py-1 bg-neutral-950 text-white hover:bg-neutral-800 text-[11px] cursor-pointer"
                        >
                          Approve & Credit
                        </button>
                        <button
                          onClick={() => handleReconcile(p.id, 'reject')}
                          className="px-2.5 py-1 border border-neutral-300 hover:bg-neutral-100 text-[11px] cursor-pointer text-neutral-800"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === 'completed' && (
                      <span className="text-neutral-400 text-[10px]">Reconciled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
