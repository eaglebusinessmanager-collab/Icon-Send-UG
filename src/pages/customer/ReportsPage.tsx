import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SMSMessage } from '../../types';
import { BarChart3, PieChart, TrendingUp, CheckCircle2 } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [messages, setMessages] = useState<SMSMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.sms.getMessages({ limit: 500 }).then(res => {
      setMessages(res.messages);
      setLoading(false);
    });
  }, []);

  const total = messages.length;
  const delivered = messages.filter(m => m.status === 'delivered').length;
  const inTransit = messages.filter(m => ['sent', 'submitted', 'buffered', 'queued'].includes(m.status)).length;
  const failed = messages.filter(m => ['failed', 'rejected'].includes(m.status)).length;
  const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  // Carriers breakdown
  const mtnCount = messages.filter(m => (m.carrier || '').includes('MTN')).length;
  const airtelCount = messages.filter(m => (m.carrier || '').includes('Airtel')).length;
  const utlCount = messages.filter(m => (m.carrier || '').includes('UTL')).length;
  const otherCount = total - (mtnCount + airtelCount + utlCount);

  // Segments breakdown
  const singlePartCount = messages.filter(m => m.segments === 1).length;
  const multiPartCount = messages.filter(m => m.segments > 1).length;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
          Delivery Reports & Performance Analytics
        </h2>
        <p className="text-xs text-neutral-500 font-mono mt-0.5">
          Real-time metrics derived from direct carrier handset receipts across Uganda networks.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">Total SMS Dispatched</div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">{total}</div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">Single & Bulk messages</div>
        </div>

        <div className="bg-white border-2 border-neutral-950 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">Confirmed Delivery Rate</div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">{deliveryRate}%</div>
          <div className="text-[11px] text-neutral-600 font-mono mt-1">{delivered} verified deliveries</div>
        </div>

        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">In Transit / Buffered</div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">{inTransit}</div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">Awaiting handset receipt</div>
        </div>

        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">Reconciled Failures</div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">{failed}</div>
          <div className="text-[11px] text-neutral-400 font-mono mt-1">Refunded to wallet</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Carrier Distribution */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Ugandan Telecom Carrier Distribution
            </span>
            <span className="text-xs font-mono text-neutral-500">{total} Recipient Numbers</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            {/* MTN */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>MTN Uganda (077, 078, 076)</span>
                <span className="font-bold text-neutral-950">
                  {mtnCount} ({total > 0 ? Math.round((mtnCount / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-100 h-2 border border-neutral-300">
                <div
                  className="bg-neutral-950 h-full"
                  style={{ width: `${total > 0 ? (mtnCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Airtel */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Airtel Uganda (070, 075, 074)</span>
                <span className="font-bold text-neutral-950">
                  {airtelCount} ({total > 0 ? Math.round((airtelCount / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-100 h-2 border border-neutral-300">
                <div
                  className="bg-neutral-800 h-full"
                  style={{ width: `${total > 0 ? (airtelCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* UTL */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>UTL (Uganda Telecom 071, 041)</span>
                <span className="font-bold text-neutral-950">
                  {utlCount} ({total > 0 ? Math.round((utlCount / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-100 h-2 border border-neutral-300">
                <div
                  className="bg-neutral-600 h-full"
                  style={{ width: `${total > 0 ? (utlCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Others */}
            <div>
              <div className="flex justify-between text-neutral-700 mb-1">
                <span>Lyca / Smile / Landlines</span>
                <span className="font-bold text-neutral-950">
                  {otherCount} ({total > 0 ? Math.round((otherCount / total) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-neutral-100 h-2 border border-neutral-300">
                <div
                  className="bg-neutral-400 h-full"
                  style={{ width: `${total > 0 ? (otherCount / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message Segments & Quality Analysis */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Message Part (Segment) Optimization
            </span>
          </div>

          <div className="space-y-4 text-xs font-mono">
            <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Single Part SMS (&le; 160 chars):</span>
                <span className="font-bold text-neutral-950">{singlePartCount} messages</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Concatenated Multi-part SMS (&gt; 160 chars):</span>
                <span className="font-bold text-neutral-950">{multiPartCount} messages</span>
              </div>
              <div className="pt-2 border-t border-neutral-200 text-neutral-500 font-sans text-xs leading-relaxed">
                Keeping marketing texts under 160 characters saves 50% on SMS costs. Use the built-in Segment Counter on the composer to monitor part lengths.
              </div>
            </div>

            <div className="border border-neutral-200 p-4 space-y-2">
              <span className="text-neutral-950 font-bold block">Gateway Route Health:</span>
              <div className="flex items-center space-x-2 text-neutral-700">
                <div className="w-2 h-2 bg-neutral-950 rounded-full" />
                <span>Bulk SMS Uganda REST API v1: Operational (Lat: ~210ms)</span>
              </div>
              <div className="flex items-center space-x-2 text-neutral-500 text-[11px]">
                <div className="w-2 h-2 bg-neutral-400 rounded-full" />
                <span>Failover Adapters (Africa's Talking / Custom): Standby</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
