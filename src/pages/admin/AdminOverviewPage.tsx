import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PaymentTransaction, SMSCampaign, SMSMessage } from '../../types';
import {
  Users,
  Send,
  CreditCard,
  DollarSign,
  TrendingUp,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface AdminOverviewPageProps {
  onNavigate: (page: string) => void;
}

export const AdminOverviewPage: React.FC<AdminOverviewPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<{
    metrics: {
      totalCustomers: number;
      activeCustomers: number;
      totalSmsSubmitted: number;
      delivered: number;
      failed: number;
      pending: number;
      totalCreditsSold: number;
      totalRevenueUgx: number;
      estimatedGatewayExpenditure: number;
      grossMargin: number;
      grossMarginPercentage: number;
      activeProviderSlug: string;
      providerCredits?: number;
    };
    recentTransactions: PaymentTransaction[];
    recentCampaigns: SMSCampaign[];
    recentMessages: SMSMessage[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  const loadData = async () => {
    try {
      const res = await api.admin.overview();
      setData(res);
    } catch {
      console.error('Failed to load admin overview');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshBalance = async () => {
    if (!data) return;
    setRefreshingBalance(true);
    try {
      const bal = await api.admin.getProviderBalance(data.metrics.activeProviderSlug);
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          metrics: {
            ...prev.metrics,
            providerCredits: bal.balance,
          },
        };
      });
    } catch {
      console.error('Failed to sync provider balance');
    } finally {
      setRefreshingBalance(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!data) {
    return (
      <div className="p-12 text-center text-xs font-mono text-neutral-500">
        Loading administrative metrics...
      </div>
    );
  }

  const { metrics, recentTransactions, recentCampaigns } = data;

  return (
    <div className="space-y-6">
      {/* Platform Owner Header */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-neutral-500 font-semibold">
              The Eagle Icon Developers UG · Executive Console
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 mt-1">
              ICON SEND UG Administrative Overview
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Live gateway throughput, customer ledger balances, and telecom gross margins.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2.5 py-1 bg-neutral-100 border border-neutral-300 text-neutral-900 font-bold">
              Active Provider: {metrics.activeProviderSlug.toUpperCase()}
            </span>
            <button
              onClick={() => onNavigate('admin_provider')}
              className="bg-neutral-950 text-white px-3 py-1 text-xs font-mono font-medium hover:bg-neutral-800 cursor-pointer"
            >
              Configure Gateway
            </button>
          </div>
        </div>
      </div>

      {/* Financial & Volume Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border-2 border-neutral-950 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Gross Revenue (UGX)
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">
            UGX {metrics.totalRevenueUgx.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-neutral-600 font-mono">
            {metrics.totalCreditsSold.toLocaleString()} credits sold
          </div>
        </div>

        {/* Estimated Gross Margin */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Estimated Gross Margin
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            UGX {metrics.grossMargin.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            Margin Rate: <strong>{metrics.grossMarginPercentage}%</strong>
          </div>
        </div>

        {/* Total SMS Submitted */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Total Messages Dispatched
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {metrics.totalSmsSubmitted.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            {metrics.delivered} delivered · {metrics.failed} failed
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Customer Accounts
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {metrics.totalCustomers}
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 font-mono">
            {metrics.activeCustomers} Active · 0 Suspended
          </div>
        </div>
      </div>

      {/* Gateway Status Card */}
      <div className="bg-white border border-neutral-200 p-5 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-neutral-950" />
            <span className="font-bold text-neutral-950">
              Active SMS Provider: {metrics.activeProviderSlug === 'bulksmsuganda' ? 'Bulk SMS Uganda REST API v1' : metrics.activeProviderSlug.toUpperCase()}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-neutral-600 text-[11px]">
            <span>
              Carrier Shared Pool: <strong className="text-neutral-950">{metrics.providerCredits !== undefined ? metrics.providerCredits.toLocaleString() : '2,500'} Credits</strong>
            </span>
            <button
              type="button"
              onClick={handleRefreshBalance}
              disabled={refreshingBalance}
              className="px-2 py-0.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
              title="Query Live Balance from Telecom API"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingBalance ? 'animate-spin' : ''}`} />
              <span>{refreshingBalance ? 'Syncing...' : 'Sync Balance'}</span>
            </button>
            <span>Est. Gateway Wholesale Cost: <strong>UGX {metrics.estimatedGatewayExpenditure.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Recent Campaigns and Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Platform Campaigns */}
        <div className="bg-white border border-neutral-200">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Recent Customer Campaigns
            </span>
            <button
              onClick={() => onNavigate('admin_campaigns')}
              className="text-xs text-neutral-600 hover:text-neutral-950 underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-neutral-100 text-xs font-mono">
            {recentCampaigns.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">No campaigns recorded yet.</div>
            ) : (
              recentCampaigns.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-950 block">{c.name}</span>
                    <span className="text-[11px] text-neutral-500">
                      {c.valid_recipients} recipients · {c.total_credits} credits · Sender: {c.sender_id}
                    </span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.status === 'completed' ? 'bg-neutral-950 text-white' : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="block text-[10px] text-neutral-400 mt-1">
                      {new Date(c.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Revenue Transactions */}
        <div className="bg-white border border-neutral-200">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Recent Payments & Top-ups
            </span>
            <button
              onClick={() => onNavigate('admin_payments')}
              className="text-xs text-neutral-600 hover:text-neutral-950 underline"
            >
              Reconcile All
            </button>
          </div>

          <div className="divide-y divide-neutral-100 text-xs font-mono">
            {recentTransactions.length === 0 ? (
              <div className="p-6 text-center text-neutral-500">No payment transactions yet.</div>
            ) : (
              recentTransactions.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-neutral-950 block">{p.transaction_reference}</span>
                    <span className="text-[11px] text-neutral-500 uppercase">
                      {p.payment_method.replace('_', ' ')} · +{p.credits_added} credits
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-950 block">
                      UGX {p.amount_ugx.toLocaleString()}
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase mt-1 ${
                        p.status === 'completed'
                          ? 'bg-neutral-950 text-white'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
