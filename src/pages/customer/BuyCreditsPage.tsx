import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SMSPackage } from '../../types';
import { CreditCard, Check, AlertCircle, RefreshCw, X, ShieldCheck, ExternalLink } from 'lucide-react';

interface BuyCreditsPageProps {
  onNavigate: (page: string) => void;
}

export const BuyCreditsPage: React.FC<BuyCreditsPageProps> = ({ onNavigate }) => {
  const { wallet, refreshWallet } = useAuth();
  const [packages, setPackages] = useState<SMSPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected package for checkout modal
  const [selectedPkg, setSelectedPkg] = useState<SMSPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pesapal' | 'bank_transfer'>('pesapal');
  const [phoneForPayment, setPhoneForPayment] = useState<string>('0772123456');
  const [submittingPayment, setSubmittingPayment] = useState<boolean>(false);
  const [pesapalOrder, setPesapalOrder] = useState<{
    orderTrackingId: string;
    redirectUrl: string;
    merchantReference: string;
    isSimulated?: boolean;
    package: SMSPackage;
  } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [verifyingOrder, setVerifyingOrder] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    api.wallet.packages().then((pkgs) => {
      setPackages(pkgs);
      setLoading(false);
    });
  }, []);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;
    setError('');
    setSubmittingPayment(true);

    try {
      if (paymentMethod === 'pesapal') {
        const res = await api.wallet.initiatePesapal({
          package_id: selectedPkg.id,
        });

        setPesapalOrder({
          orderTrackingId: res.orderTrackingId,
          redirectUrl: res.redirectUrl,
          merchantReference: res.merchantReference,
          isSimulated: res.isSimulated,
          package: selectedPkg,
        });
      } else {
        // Bank transfer manual reconciliation
        const res = await api.wallet.checkout({
          package_id: selectedPkg.id,
          payment_method: 'bank_transfer',
          phone_number: phoneForPayment,
        });
        setPaymentSuccess(res);
        await refreshWallet();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment initiation failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleVerifyPesapal = async (orderTrackingId: string) => {
    setVerifyingOrder(true);
    setError('');
    try {
      const res = await api.wallet.verifyPesapal(orderTrackingId);
      if (res.success) {
        setPaymentSuccess({
          message: res.message,
          transaction: res.transaction,
          wallet: res.wallet || wallet,
        });
        setPesapalOrder(null);
        await refreshWallet();
      } else {
        setError(res.message || 'Payment not yet confirmed. Please complete the payment on Pesapal.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error verifying Pesapal payment status');
    } finally {
      setVerifyingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Buy SMS Credits (Uganda Shillings)
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Live Pesapal payment gateway integration supporting MTN Mobile Money, Airtel Money, Visa & Mastercard.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-500 font-mono block">Current Balance:</span>
            <span className="text-xl font-bold font-mono text-neutral-950">
              {(wallet?.available_credits ?? 0).toLocaleString()} Credits
            </span>
          </div>
        </div>
      </div>

      {paymentSuccess && (
        <div className="p-5 bg-neutral-50 border-2 border-neutral-950 space-y-3 font-mono text-xs">
          <div className="flex items-center space-x-2 text-neutral-950 font-bold text-sm">
            <Check className="w-5 h-5" />
            <span>{paymentSuccess.message}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-white border border-neutral-200 text-[11px]">
            <div>
              <span className="text-neutral-500 block text-[10px]">Reference:</span>
              <strong className="text-neutral-950">{paymentSuccess.transaction.transaction_reference}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Amount Paid:</span>
              <strong className="text-neutral-950">UGX {paymentSuccess.transaction.amount_ugx.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Credits Added:</span>
              <strong className="text-neutral-950">+{paymentSuccess.transaction.credits_added}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">New Wallet Balance:</span>
              <strong className="text-neutral-950">{paymentSuccess.wallet?.available_credits ?? wallet?.available_credits}</strong>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => onNavigate('send_sms')}
              className="text-neutral-950 font-bold underline hover:text-neutral-700"
            >
              Start Sending SMS Now &rarr;
            </button>
            <button
              onClick={() => {
                setPaymentSuccess(null);
                setSelectedPkg(null);
                setPesapalOrder(null);
              }}
              className="px-3 py-1 bg-neutral-950 text-white text-[11px] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Credit Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`border bg-white p-6 flex flex-col justify-between relative ${
              pkg.is_popular ? 'border-2 border-neutral-950' : 'border-neutral-200'
            }`}
          >
            {pkg.is_popular && (
              <span className="absolute -top-3 right-4 bg-neutral-950 text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
                Best Value
              </span>
            )}

            <div>
              <div className="text-xs font-mono uppercase font-bold text-neutral-500">
                {pkg.name}
              </div>
              <div className="text-2xl font-extrabold font-mono text-neutral-950 mt-2">
                UGX {pkg.price_ugx.toLocaleString()}
              </div>

              <div className="mt-2 text-xs font-mono text-neutral-700 space-y-1">
                <div>Quantity: <strong>{pkg.credits}</strong> SMS credits</div>
                <div className="text-neutral-500 text-[11px]">
                  Rate: ~UGX {pkg.rate_per_sms} per SMS part
                </div>
              </div>

              <p className="mt-4 text-xs text-neutral-600 leading-relaxed border-t border-neutral-100 pt-3">
                {pkg.description}
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPkg(pkg);
                setPaymentSuccess(null);
                setPesapalOrder(null);
                setError('');
              }}
              className={`mt-6 w-full py-2.5 text-xs font-mono font-medium transition-colors cursor-pointer ${
                pkg.is_popular
                  ? 'bg-neutral-950 text-white hover:bg-neutral-800'
                  : 'border border-neutral-900 text-neutral-950 hover:bg-neutral-950 hover:text-white'
              }`}
            >
              Pay via Pesapal &rarr;
            </button>
          </div>
        ))}
      </div>

      {/* Pesapal Live Order Modal */}
      {selectedPkg && !paymentSuccess && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                  Pesapal Live Gateway Checkout
                </h3>
                <span className="text-[11px] font-mono text-neutral-500">
                  {selectedPkg.name} · {selectedPkg.credits} SMS Credits · Currency: UGX
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedPkg(null);
                  setPesapalOrder(null);
                }}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900 flex items-start space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!pesapalOrder ? (
              <form onSubmit={handleCheckout} className="space-y-4 text-xs font-mono">
                <div className="p-3 bg-neutral-50 border border-neutral-200 flex justify-between items-center">
                  <span>Total Amount Due:</span>
                  <span className="text-lg font-bold text-neutral-950">
                    UGX {selectedPkg.price_ugx.toLocaleString()}
                  </span>
                </div>

                {/* Gateway Selector */}
                <div>
                  <label className="block text-neutral-700 font-bold mb-2">
                    Payment Gateway:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pesapal')}
                      className={`p-3 border text-left cursor-pointer transition-colors ${
                        paymentMethod === 'pesapal'
                          ? 'border-neutral-950 bg-neutral-100 font-bold text-neutral-950'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="block text-xs font-bold">Pesapal Uganda (Live)</span>
                      <span className="text-[10px] text-neutral-500">MTN MoMo, Airtel Money, Cards</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={`p-3 border text-left cursor-pointer transition-colors ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-neutral-950 bg-neutral-100 font-bold text-neutral-950'
                          : 'border-neutral-200 hover:bg-neutral-50'
                      }`}
                    >
                      <span className="block text-xs">Bank Transfer</span>
                      <span className="text-[10px] text-neutral-500">Manual Reconciliation</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-600 text-[11px] leading-relaxed">
                  Pesapal is Uganda's licensed payment processor. You can complete payments instantly using MTN Mobile Money, Airtel Money, or Visa/Mastercard on Pesapal's secure portal.
                </div>

                <div className="pt-4 border-t border-neutral-200 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPkg(null)}
                    className="px-4 py-2 border border-neutral-300 text-xs font-mono font-medium hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayment}
                    className="px-6 py-2 bg-neutral-950 text-white text-xs font-mono font-medium hover:bg-neutral-800 disabled:opacity-40 cursor-pointer inline-flex items-center space-x-2"
                  >
                    {submittingPayment ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Connecting to Pesapal Live...</span>
                      </>
                    ) : (
                      <span>Proceed to Pesapal (UGX {selectedPkg.price_ugx.toLocaleString()})</span>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Order Initiated State */
              <div className="space-y-4 text-xs font-mono">
                <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Pesapal Tracking ID:</span>
                    <strong className="text-neutral-950 font-bold">{pesapalOrder.orderTrackingId}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Merchant Reference:</span>
                    <strong className="text-neutral-950">{pesapalOrder.merchantReference}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Amount:</span>
                    <strong className="text-neutral-950">UGX {pesapalOrder.package.price_ugx.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="p-4 border border-neutral-300 text-center space-y-3 bg-white">
                  <p className="text-neutral-700 leading-normal">
                    Click below to open the Pesapal payment window and complete transaction via MTN Mobile Money, Airtel Money, or Debit Card:
                  </p>
                  <a
                    href={pesapalOrder.redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 bg-neutral-950 text-white px-5 py-2.5 font-medium hover:bg-neutral-800"
                  >
                    <span>Open Pesapal Secure Payment Page</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 bg-neutral-100 border border-neutral-300 space-y-2">
                  <span className="font-bold text-neutral-950 block">Already completed the payment?</span>
                  <button
                    type="button"
                    onClick={() => handleVerifyPesapal(pesapalOrder.orderTrackingId)}
                    disabled={verifyingOrder}
                    className="w-full bg-neutral-900 text-white py-2 text-xs font-mono font-medium hover:bg-neutral-800 disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    {verifyingOrder ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Querying Pesapal Live Status...</span>
                      </>
                    ) : (
                      <span>Verify Payment & Credit Wallet</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
