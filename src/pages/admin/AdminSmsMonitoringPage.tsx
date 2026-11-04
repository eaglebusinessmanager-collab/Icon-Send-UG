import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SMSMessage } from '../../types';
import { History, Search, RefreshCw, Download } from 'lucide-react';
import Papa from 'papaparse';

export const AdminSmsMonitoringPage: React.FC = () => {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const list = await api.admin.smsMonitoring();
      setMessages(list);
    } catch {
      console.error('Failed to load global SMS monitoring feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = () => {
    if (messages.length === 0) return;
    const csv = Papa.unparse(messages);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Global_SMS_Traffic_${Date.now()}.csv`;
    a.click();
  };

  const filtered = messages.filter(
    m =>
      m.recipient.includes(search) ||
      m.normalized_recipient.includes(search) ||
      m.message.toLowerCase().includes(search.toLowerCase()) ||
      (m.carrier && m.carrier.toLowerCase().includes(search.toLowerCase())) ||
      (m.sender_id && m.sender_id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Global SMS Traffic Monitor
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Live stream of all outgoing customer single and bulk SMS across Uganda networks.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExport}
              className="border border-neutral-300 text-neutral-900 px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={loadData}
              className="bg-neutral-950 text-white px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Stream</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 p-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by phone, carrier, sender ID or text keyword..."
            className="w-full text-xs px-3 py-2 pl-8 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">User ID</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Carrier</th>
                <th className="p-3">Sender ID</th>
                <th className="p-3">Message</th>
                <th className="p-3">Credits</th>
                <th className="p-3">Gateway Status</th>
                <th className="p-3">Gateway Tracking ID</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-neutral-50">
                  <td className="p-3 text-neutral-400 text-[10px] truncate max-w-[90px]">{m.user_id}</td>
                  <td className="p-3 font-bold text-neutral-950">{m.normalized_recipient}</td>
                  <td className="p-3 text-neutral-600">{m.carrier || 'Uganda Telecom'}</td>
                  <td className="p-3 font-medium text-neutral-900">{m.sender_id}</td>
                  <td className="p-3 text-neutral-800 max-w-xs truncate font-sans text-xs">{m.message}</td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
