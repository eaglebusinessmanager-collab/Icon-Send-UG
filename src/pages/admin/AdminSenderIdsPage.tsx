import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SenderID } from '../../types';
import { BadgeCheck, CheckCircle2, XCircle, Clock, Search, X } from 'lucide-react';

export const AdminSenderIdsPage: React.FC = () => {
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const loadList = async () => {
    try {
      const list = await api.admin.senderIds();
      setSenderIds(list);
    } catch {
      console.error('Failed to load sender IDs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      setErrorMessage('');
      await api.admin.updateSenderIdStatus(id, { status, rejection_reason: reason });
      setRejectModalId(null);
      setRejectReason('');
      loadList();
    } catch {
      setErrorMessage('Failed to update sender ID status. Please try again.');
    }
  };

  const filtered = senderIds.filter(s => filter === 'all' || s.status === filter);

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
        </div>
      )}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Sender ID Approvals (UCC Compliance Desk)
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Review and approve custom business alphanumeric identities for commercial messaging in Uganda.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-mono uppercase px-3 py-1.5 border transition-colors cursor-pointer ${
                  filter === f
                    ? 'bg-neutral-950 text-white font-bold border-neutral-950'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                {f} ({senderIds.filter(s => f === 'all' || s.status === f).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Requested Sender ID</th>
                <th className="p-3">Business Purpose</th>
                <th className="p-3">Sample Message</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date Submitted</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-950 text-sm tracking-wider">
                    {s.sender_id}
                  </td>
                  <td className="p-3 text-neutral-800 font-sans max-w-xs">{s.purpose}</td>
                  <td className="p-3 text-neutral-500 font-sans text-[11px] max-w-xs italic">
                    "{s.sample_message || '-'}"
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        s.status === 'approved'
                          ? 'bg-neutral-950 text-white'
                          : s.status === 'rejected'
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {s.status}
                    </span>
                    {s.rejection_reason && (
                      <span className="block text-[10px] text-neutral-500 mt-0.5">
                        Reason: {s.rejection_reason}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-neutral-400 text-[10px]">
                    {new Date(s.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {s.status !== 'approved' && (
                      <button
                        onClick={() => handleUpdateStatus(s.id, 'approved')}
                        className="px-2.5 py-1 bg-neutral-950 text-white hover:bg-neutral-800 text-[11px] cursor-pointer"
                      >
                        Approve
                      </button>
                    )}
                    {s.status !== 'rejected' && (
                      <button
                        onClick={() => setRejectModalId(s.id)}
                        className="px-2.5 py-1 border border-neutral-300 hover:bg-neutral-100 text-[11px] cursor-pointer text-neutral-800"
                      >
                        Reject
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalId && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                Reject Sender ID Request
              </h3>
              <button onClick={() => setRejectModalId(null)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <label className="block text-neutral-700 font-bold">
                UCC Compliance Rejection Reason *
              </label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Sender ID closely mimics a registered financial brand / Incomplete business KYC documents..."
                className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-sans"
              />

              <div className="flex justify-end space-x-2 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setRejectModalId(null)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(rejectModalId, 'rejected', rejectReason)}
                  className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
