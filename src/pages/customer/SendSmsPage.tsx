import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { PhoneInput } from '../../components/sms/PhoneInput';
import { SegmentCounter } from '../../components/sms/SegmentCounter';
import { SenderID, SMSMessage } from '../../types';
import { Send, CheckCircle2, AlertCircle, ArrowRight, Smartphone, RefreshCw } from 'lucide-react';

interface SendSmsPageProps {
  onNavigate: (page: string) => void;
}

export const SendSmsPage: React.FC<SendSmsPageProps> = ({ onNavigate }) => {
  const { wallet, refreshWallet } = useAuth();
  const [recipient, setRecipient] = useState<string>('');
  const [normalizedRecipient, setNormalizedRecipient] = useState<string>('');
  const [isPhoneValid, setIsPhoneValid] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('ICONSEND');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successResult, setSuccessResult] = useState<SMSMessage | null>(null);

  useEffect(() => {
    api.senderIds.list().then((list) => {
      setSenderIds(list);
      const approved = list.find(s => s.status === 'approved');
      if (approved) setSelectedSenderId(approved.sender_id);
    }).catch(console.error);
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessResult(null);

    if (!isPhoneValid) {
      setError('Please provide a valid Ugandan mobile phone number.');
      return;
    }

    if (!message || message.trim() === '') {
      setError('Please type your SMS message.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.sms.sendSingle({
        recipient: normalizedRecipient,
        message,
        sender_id: selectedSenderId,
      });

      setSuccessResult(res.data);
      setMessage('');
      setRecipient('');
      await refreshWallet();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending SMS');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Send Single SMS
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Direct dispatch to any MTN, Airtel, or UTL number across Uganda.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-500 font-mono block">Available Credits:</span>
            <span className="text-lg font-bold font-mono text-neutral-950">
              {(wallet?.available_credits ?? 0).toLocaleString()} Credits
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-neutral-200 p-6">
            {error && (
              <div className="mb-4 p-3 bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successResult && (
              <div className="mb-4 p-4 bg-neutral-50 border border-neutral-950 text-xs font-mono space-y-2">
                <div className="flex items-center space-x-2 text-neutral-950 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SMS Submitted Successfully to Gateway!</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-neutral-600 text-[11px] pt-1 border-t border-neutral-200">
                  <div>Recipient: <strong className="text-neutral-950">{successResult.normalized_recipient}</strong></div>
                  <div>Tracking ID: <strong className="text-neutral-950">{successResult.provider_message_id}</strong></div>
                  <div>Carrier: <strong className="text-neutral-950">{successResult.carrier}</strong></div>
                  <div>Credits Deducted: <strong className="text-neutral-950">{successResult.credits_deducted}</strong></div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSuccessResult(null)}
                    className="text-[11px] underline text-neutral-900 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              {/* Sender ID selection */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-neutral-800">
                    Sender ID
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className="text-[11px] text-neutral-500 hover:text-neutral-950 underline"
                  >
                    Request Custom Sender ID &rarr;
                  </button>
                </div>
                <select
                  value={selectedSenderId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
                >
                  <option value="ICONSEND">ICONSEND (Platform Default)</option>
                  <option value="EAGLEICON">EAGLEICON (The Eagle Icon)</option>
                  {senderIds
                    .filter(s => s.status === 'approved' && s.sender_id !== 'ICONSEND' && s.sender_id !== 'EAGLEICON')
                    .map(s => (
                      <option key={s.id} value={s.sender_id}>
                        {s.sender_id} (Your Approved ID)
                      </option>
                    ))}
                </select>
              </div>

              {/* Recipient Phone */}
              <PhoneInput
                value={recipient}
                onChange={(raw, norm, valid) => {
                  setRecipient(raw);
                  setNormalizedRecipient(norm);
                  setIsPhoneValid(valid);
                }}
              />

              {/* Message Content */}
              <div>
                <label className="block text-xs font-medium text-neutral-800 mb-1">
                  SMS Message Text *
                </label>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your SMS message here. Include 'Reply STOP to opt out' for promotional messages..."
                  className="w-full text-sm p-3 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-sans"
                />
                <SegmentCounter message={message} recipientCount={1} />
              </div>

              {/* Quick Template Insert Buttons */}
              <div className="pt-2">
                <span className="text-[11px] font-mono text-neutral-500 block mb-1">
                  Quick Sample Templates:
                </span>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setMessage('Dear Customer, your order has been received and is being dispatched. Track: iconsend.ug/track. Thank you!')}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-[11px] cursor-pointer"
                  >
                    Order Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage('Reminder: Your payment of UGX 50,000 is due on Friday. Pay via MTN MoMo / Airtel Money to avoid disruption.')}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-[11px] cursor-pointer"
                  >
                    Payment Reminder
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage('FLASH SALE: Enjoy 20% off all retail goods this weekend at our Kampala store! Reply STOP to opt out.')}
                    className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-[11px] cursor-pointer"
                  >
                    Promotional Promo
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
                <div className="text-xs text-neutral-500 font-mono">
                  {isPhoneValid ? (
                    <span className="text-neutral-900 font-semibold">Ready to dispatch</span>
                  ) : (
                    <span>Enter valid recipient</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !isPhoneValid || !message.trim()}
                  className="bg-neutral-950 text-white px-6 py-2.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer inline-flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send SMS</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Live Handset Preview */}
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 p-5">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase font-bold text-neutral-950 pb-3 border-b border-neutral-200">
              <Smartphone className="w-4 h-4" />
              <span>Handset Screen Preview</span>
            </div>

            {/* Handset mockup frame */}
            <div className="mt-4 mx-auto max-w-[260px] bg-neutral-950 p-3 shadow-md">
              <div className="bg-white p-3 min-h-[320px] flex flex-col justify-between text-neutral-900">
                {/* Status Bar */}
                <div className="border-b border-neutral-100 pb-2 flex items-center justify-between text-[9px] font-mono text-neutral-500">
                  <span>MTN / Airtel UG</span>
                  <span>100% 12:45</span>
                </div>

                {/* Sender badge */}
                <div className="my-3 text-center">
                  <span className="inline-block text-[11px] font-bold font-mono px-2 py-0.5 bg-neutral-100 text-neutral-950">
                    {selectedSenderId || 'ICONSEND'}
                  </span>
                  <span className="block text-[9px] text-neutral-400 font-mono mt-0.5">
                    {normalizedRecipient || '+256 7XX XXX XXX'}
                  </span>
                </div>

                {/* Chat bubble */}
                <div className="flex-1">
                  <div className="bg-neutral-100 p-2.5 text-xs text-neutral-950 font-sans leading-relaxed border border-neutral-200 shadow-sm">
                    {message || 'Type in the composer to preview how the SMS will appear on your customer\'s handset in Uganda...'}
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 block text-right mt-1">
                    Just now · SMS
                  </span>
                </div>

                {/* Bottom Reply bar */}
                <div className="border-t border-neutral-200 pt-2 text-[9px] text-neutral-400 font-mono text-center">
                  Reply STOP to opt out
                </div>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-neutral-500 font-mono text-center">
              Real-time representation of carrier text formatting.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
