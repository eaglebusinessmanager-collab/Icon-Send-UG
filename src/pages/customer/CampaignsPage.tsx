import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SMSCampaign, SMSMessage } from '../../types';
import { Layers, Plus, Trash2, Eye, X, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface CampaignsPageProps {
  onNavigate: (page: string) => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onNavigate }) => {
  const [campaigns, setCampaigns] = useState<SMSCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<{
    campaign: SMSCampaign;
    messages: SMSMessage[];
    stats: { total: number; delivered: number; pending: number; failed: number; deliveryRate: number };
  } | null>(null);

  const loadCampaigns = async () => {
    try {
      const list = await api.campaigns.list();
      setCampaigns(list);
    } catch {
      console.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const viewDetails = async (id: string) => {
    setSelectedCampaignId(id);
    try {
      const data = await api.campaigns.get(id);
      setCampaignDetails(data);
    } catch {
      console.error('Error fetching campaign details');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this campaign from logs?')) {
      await api.campaigns.delete(id);
      loadCampaigns();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              SMS Campaigns Management
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Review dispatched and scheduled bulk broadcasts.
            </p>
          </div>
          <button
            onClick={() => onNavigate('bulk_sms')}
            className="bg-neutral-950 text-white px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bulk Campaign</span>
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
                <th className="p-3">Date Dispatched</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    No SMS campaigns created yet.{' '}
                    <button onClick={() => onNavigate('bulk_sms')} className="font-bold underline text-neutral-950">
                      Create your first campaign &rarr;
                    </button>
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-neutral-950 font-sans text-xs">{c.name}</td>
                    <td className="p-3 font-semibold text-neutral-900">{c.sender_id}</td>
                    <td className="p-3 text-neutral-600">{c.valid_recipients.toLocaleString()}</td>
                    <td className="p-3 font-bold text-neutral-950">{c.total_credits}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          c.status === 'completed'
                            ? 'bg-neutral-950 text-white'
                            : c.status === 'failed'
                            ? 'bg-neutral-200 text-neutral-800'
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
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => viewDetails(c.id)}
                        className="text-neutral-700 hover:text-neutral-950 p-1 font-medium inline-flex items-center space-x-1"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-neutral-400 hover:text-neutral-950 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campaign Detail Modal */}
      {selectedCampaignId && campaignDetails && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                  {campaignDetails.campaign.name}
                </h3>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Sender: {campaignDetails.campaign.sender_id} · Dispatched on{' '}
                  {new Date(campaignDetails.campaign.created_at).toLocaleString('en-GB')}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedCampaignId(null);
                  setCampaignDetails(null);
                }}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 text-center text-xs font-mono p-3 bg-neutral-50 border border-neutral-200">
              <div>
                <span className="text-neutral-500 block text-[10px]">Total Messages:</span>
                <span className="text-sm font-bold text-neutral-950">{campaignDetails.stats.total}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Delivered:</span>
                <span className="text-sm font-bold text-neutral-950">{campaignDetails.stats.delivered}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">In Transit:</span>
                <span className="text-sm font-bold text-neutral-950">{campaignDetails.stats.pending}</span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">Delivery Rate:</span>
                <span className="text-sm font-bold text-neutral-950">{campaignDetails.stats.deliveryRate}%</span>
              </div>
            </div>

            {/* Message Body */}
            <div>
              <span className="text-xs font-mono font-bold uppercase text-neutral-600 block mb-1">
                Dispatched Message Body:
              </span>
              <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs font-sans text-neutral-900">
                {campaignDetails.campaign.message}
              </div>
            </div>

            {/* Messages sample table */}
            <div>
              <span className="text-xs font-mono font-bold uppercase text-neutral-600 block mb-1">
                Recipients & Carrier Statuses:
              </span>
              <div className="border border-neutral-200 max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                    <tr>
                      <th className="p-2">Recipient</th>
                      <th className="p-2">Carrier</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">Tracking ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {campaignDetails.messages.map((m) => (
                      <tr key={m.id}>
                        <td className="p-2 font-bold text-neutral-950">{m.normalized_recipient}</td>
                        <td className="p-2 text-neutral-600">{m.carrier}</td>
                        <td className="p-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                              m.status === 'delivered'
                                ? 'bg-neutral-950 text-white'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                        <td className="p-2 text-neutral-400 text-[10px]">{m.provider_message_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-200 flex justify-end">
              <button
                onClick={() => {
                  setSelectedCampaignId(null);
                  setCampaignDetails(null);
                }}
                className="px-4 py-2 bg-neutral-950 text-white text-xs font-mono font-medium hover:bg-neutral-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
