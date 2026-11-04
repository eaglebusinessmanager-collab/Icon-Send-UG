import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SMSCampaign } from '../../types';
import { Layers, Search, Download } from 'lucide-react';
import Papa from 'papaparse';

export const AdminCampaignsPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCampaigns = async () => {
    try {
      const res = await api.admin.overview();
      setCampaigns(res.recentCampaigns);
    } catch {
      console.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleExport = () => {
    if (campaigns.length === 0) return;
    const csv = Papa.unparse(campaigns);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Global_Campaigns_${Date.now()}.csv`;
    a.click();
  };

  const filtered = campaigns.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.sender_id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              All Platform SMS Campaigns
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Broadcast batches submitted by all registered organizations across Uganda.
            </p>
          </div>
          <button
            onClick={handleExport}
            className="border border-neutral-300 text-neutral-900 px-3 py-1.5 text-xs font-mono font-medium hover:bg-neutral-100 inline-flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Campaigns CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Campaign Name</th>
                <th className="p-3">Sender ID</th>
                <th className="p-3">Valid Recipients</th>
                <th className="p-3">Total Credits</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-950 font-sans">{c.name}</td>
                  <td className="p-3 font-semibold text-neutral-900">{c.sender_id}</td>
                  <td className="p-3 text-neutral-700">{c.valid_recipients.toLocaleString()}</td>
                  <td className="p-3 font-bold text-neutral-950">{c.total_credits}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'completed'
                          ? 'bg-neutral-950 text-white'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-400 text-[10px]">
                    {new Date(c.created_at).toLocaleDateString('en-GB', {
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
