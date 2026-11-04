import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { api } from '../../lib/api';
import { SMSMessage } from '../../types';
import { History, Search, Download, RefreshCw, CheckCircle2, Clock, XCircle } from 'lucide-react';

export const MessageHistoryPage: React.FC = () => {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string>('');

  const loadMessages = async () => {
    try {
      const res = await api.sms.getMessages({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search || undefined,
        limit: 100,
      });
      setMessages(res.messages);
      setTotal(res.total);
    } catch {
      console.error('Failed to load message history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, [statusFilter, search]);

  const handleSyncStatus = async () => {
    setSyncing(true);
    setSyncFeedback('');
    try {
      const res = await api.sms.syncDeliveryStatus();
      setSyncFeedback(`Queried SMS gateway. Checked ${res.checked} messages, updated ${res.updated}.`);
      await loadMessages();
    } catch {
      setSyncFeedback('Status synchronization failed.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncFeedback(''), 4000);
    }
  };

  const handleCheckSingle = async (id: string) => {
    try {
      const updated = await api.sms.checkSingleStatus(id);
      setMessages(prev => prev.map(m => m.id === id ? updated : m));
    } catch {
      // Ignored
    }
  };

  const handleExportCsv = () => {
    if (messages.length === 0) return;
    const csv = Papa.unparse(
      messages.map(m => ({
        Recipient: m.normalized_recipient,
        Carrier: m.carrier || 'Uganda Telecom',
        SenderID: m.sender_id,
        Segments: m.segments,
        CreditsDeducted: m.credits_deducted,
        Status: m.status,
        Message: m.message,
        TrackingID: m.provider_message_id || '',
        DeliveredAt: m.delivered_at || '',
        SubmittedAt: m.created_at,
      }))
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ICON_SEND_Messages_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              SMS Message History & Audit
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Comprehensive log of all outgoing single and bulk transmissions across Ugandan networks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSyncStatus}
              disabled={syncing}
              className="border border-neutral-300 text-neutral-900 px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Query Gateway Deliveries</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="border border-neutral-300 text-neutral-900 px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900 flex justify-between items-center">
          <span>{syncFeedback}</span>
          <button onClick={() => setSyncFeedback('')} className="text-neutral-500 hover:text-neutral-900">&times;</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by recipient phone or message keyword..."
              className="w-full text-xs px-3 py-2 pl-8 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="delivered">Delivered (Handset Receipt Confirmed)</option>
              <option value="sent">Sent / Submitted (Acknowledged by Platform)</option>
              <option value="buffered">Buffered on Carrier Network</option>
              <option value="failed">Failed / Rejected (Credits Reconciled)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Recipient</th>
                <th className="p-3">Carrier</th>
                <th className="p-3">Sender ID</th>
                <th className="p-3">Message Body</th>
                <th className="p-3">Parts</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Delivery Status</th>
                <th className="p-3">Tracking ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3 text-right">Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {messages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-neutral-500">
                    No SMS messages matching your criteria.
                  </td>
                </tr>
              ) : (
                messages.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-neutral-950">{m.normalized_recipient}</td>
                    <td className="p-3 text-neutral-600">{m.carrier || 'Uganda Telecom'}</td>
                    <td className="p-3 font-medium text-neutral-900">{m.sender_id}</td>
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
                            : m.status === 'failed' || m.status === 'rejected'
                            ? 'bg-neutral-200 text-neutral-800'
                            : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-400 text-[10px] truncate max-w-[120px]">
                      {m.provider_message_id || '-'}
                    </td>
                    <td className="p-3 text-neutral-400 text-[10px]">
                      {new Date(m.created_at).toLocaleDateString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3 text-right">
                      {m.provider_message_id && m.status !== 'delivered' && (
                        <button
                          onClick={() => handleCheckSingle(m.id)}
                          className="text-neutral-500 hover:text-neutral-950 p-1"
                          title="Query status from provider"
                        >
                          <RefreshCw className="w-3 h-3 inline" />
                        </button>
                      )}
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
