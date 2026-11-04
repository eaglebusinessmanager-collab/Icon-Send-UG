import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { WalletTransaction, PaymentTransaction } from '../../types';
import { Wallet as WalletIcon, CreditCard, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download } from 'lucide-react';
import Papa from 'papaparse';

interface WalletPageProps {
  onNavigate: (page: string) => void;
}

export const WalletPage: React.FC<WalletPageProps> = ({ onNavigate }) => {
  const { wallet, refreshWallet } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'ledger' | 'payments'>('ledger');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([api.wallet.get(), api.wallet.payments()]).then(([wRes, pList]) => {
      setTransactions(wRes.transactions);
      setPayments(pList);
      setLoading(false);
    });
  }, []);

  const handleExportLedger = () => {
    if (transactions.length === 0) return;
    const csv = Papa.unparse(
      transactions.map(t => ({
        Date: t.created_at,
        Type: t.type,
        Description: t.description,
        AmountCredits: t.amount_credits,
        BalanceAfter: t.balance_after,
        ReferenceID: t.reference_id || '',
      }))
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ICON_SEND_Wallet_Ledger_${Date.now()}.csv`);
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
              Customer SMS Wallet & Credit Ledger
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Strict accounting ledger. All purchases, deductions and refunds are cryptographically tracked.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportLedger}
              className="border border-neutral-300 text-neutral-900 px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Ledger</span>
            </button>
            <button
              onClick={() => onNavigate('buy_credits')}
              className="bg-neutral-950 text-white px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Buy Credits (UGX)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Balance Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Available */}
        <div className="bg-white border-2 border-neutral-950 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Available Credits
          </div>
          <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">
            {(wallet?.available_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-600 font-mono mt-1">Ready for dispatch</div>
        </div>

        {/* Purchased */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Purchased Credits
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {(wallet?.purchased_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">Paid via MoMo / Bank</div>
        </div>

        {/* Promotional */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Promotional Bonus
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {(wallet?.promotional_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">Signup & tier rewards</div>
        </div>

        {/* Used */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Used Credits
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {(wallet?.used_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">Dispatched message parts</div>
        </div>

        {/* Reserved */}
        <div className="bg-white border border-neutral-200 p-5">
          <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
            Reserved / In Flight
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">
            {(wallet?.reserved_credits ?? 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-1">Pending batch completion</div>
        </div>
      </div>

      {/* Tabs: Ledger vs Payment Invoices */}
      <div className="bg-white border border-neutral-200">
        <div className="flex border-b border-neutral-200">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`py-3 px-6 text-xs font-mono font-medium cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-b-2 border-neutral-950 font-bold text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Credit Ledger ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-3 px-6 text-xs font-mono font-medium cursor-pointer ${
              activeTab === 'payments'
                ? 'border-b-2 border-neutral-950 font-bold text-neutral-950'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            Payment Transactions & Receipts ({payments.length})
          </button>
        </div>

        {activeTab === 'ledger' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount Credits</th>
                  <th className="p-3">Balance After</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      No ledger transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-neutral-50">
                      <td className="p-3">
                        <span className="font-bold text-neutral-950 uppercase text-[10px] px-1.5 py-0.5 border border-neutral-300">
                          {tx.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-800 font-sans text-xs">{tx.description}</td>
                      <td className="p-3">
                        <span
                          className={`font-bold ${
                            tx.amount_credits > 0 ? 'text-neutral-950' : 'text-neutral-600'
                          }`}
                        >
                          {tx.amount_credits > 0 ? `+${tx.amount_credits}` : tx.amount_credits}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-neutral-950">{tx.balance_after}</td>
                      <td className="p-3 text-neutral-400 text-[10px]">{tx.reference_id || '-'}</td>
                      <td className="p-3 text-neutral-400 text-[10px]">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', {
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Method</th>
                  <th className="p-3">Amount (UGX)</th>
                  <th className="p-3">Credits Credited</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Phone / Notes</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-950">{p.transaction_reference}</td>
                      <td className="p-3 uppercase text-[11px] text-neutral-700">
                        {p.payment_method.replace('_', ' ')}
                      </td>
                      <td className="p-3 font-bold text-neutral-950">
                        UGX {p.amount_ugx.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-neutral-950">+{p.credits_added}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            p.status === 'completed'
                              ? 'bg-neutral-950 text-white'
                              : p.status === 'failed' || p.status === 'rejected'
                              ? 'bg-neutral-200 text-neutral-800'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-500 text-[11px]">{p.phone_number || p.notes || '-'}</td>
                      <td className="p-3 text-neutral-400 text-[10px]">
                        {new Date(p.created_at).toLocaleDateString('en-GB', {
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
        )}
      </div>
    </div>
  );
};
