import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, HelpCircle } from 'lucide-react';

interface PricingPageProps {
  onNavigate: (page: string) => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [customSms, setCustomSms] = useState<number>(2500);

  const calculateCustomPrice = (count: number) => {
    let rate = 38;
    if (count >= 5000) rate = 33;
    else if (count >= 2000) rate = 35;
    else if (count >= 1000) rate = 36;
    return Math.round(count * rate);
  };

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Pricing Plans (UGX)
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-2">
            Affordable, Predictable SMS Rates
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3">
            Purchase credits as needed. No monthly maintenance fees, no expiration dates, and no carrier surcharges.
          </p>
        </div>

        {/* 4 Packages */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Starter */}
          <div className="border border-neutral-200 p-6 flex flex-col justify-between bg-white">
            <div>
              <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Starter Tier</span>
              <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">UGX 5,000</div>
              <div className="text-xs font-mono text-neutral-600 mt-1">125 SMS Credits</div>

              <div className="mt-6 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Rate: ~UGX 40 per SMS part</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>MTN & Airtel coverage</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Real-time delivery receipts</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Default Sender ID (ICONSEND)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate(user ? 'buy_credits' : 'register')}
              className="mt-8 w-full border border-neutral-900 py-2 text-xs font-medium text-neutral-950 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Get Started
            </button>
          </div>

          {/* Business Growth */}
          <div className="border-2 border-neutral-950 p-6 flex flex-col justify-between bg-white relative">
            <span className="absolute -top-3 right-4 bg-neutral-950 text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
              Recommended
            </span>
            <div>
              <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Business Growth</span>
              <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">UGX 10,000</div>
              <div className="text-xs font-mono text-neutral-600 mt-1">260 SMS Credits</div>

              <div className="mt-6 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Rate: ~UGX 38.5 per SMS part</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>CSV bulk contact import</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Custom Sender ID request</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Campaign scheduling & reports</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate(user ? 'buy_credits' : 'register')}
              className="mt-8 w-full bg-neutral-950 text-white py-2 text-xs font-medium hover:bg-neutral-800 transition-colors"
            >
              Select Business
            </button>
          </div>

          {/* Professional */}
          <div className="border border-neutral-200 p-6 flex flex-col justify-between bg-white">
            <div>
              <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Professional</span>
              <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">UGX 25,000</div>
              <div className="text-xs font-mono text-neutral-600 mt-1">700 SMS Credits</div>

              <div className="mt-6 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Rate: ~UGX 35.7 per SMS part</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Priority carrier gateway queue</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Multiple approved Sender IDs</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>CSV report downloads</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate(user ? 'buy_credits' : 'register')}
              className="mt-8 w-full border border-neutral-900 py-2 text-xs font-medium text-neutral-950 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Select Professional
            </button>
          </div>

          {/* Enterprise */}
          <div className="border border-neutral-200 p-6 flex flex-col justify-between bg-white">
            <div>
              <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Enterprise</span>
              <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-2">UGX 50,000</div>
              <div className="text-xs font-mono text-neutral-600 mt-1">1,500 SMS Credits</div>

              <div className="mt-6 space-y-2 text-xs text-neutral-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Rate: ~UGX 33.3 per SMS part</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Dedicated account manager</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Direct SMPP / REST API access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-3.5 h-3.5 text-neutral-950 shrink-0" />
                  <span>Manual invoice reconciliation</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => onNavigate(user ? 'buy_credits' : 'register')}
              className="mt-8 w-full border border-neutral-900 py-2 text-xs font-medium text-neutral-950 hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Select Enterprise
            </button>
          </div>
        </div>

        {/* Custom Volume Calculator */}
        <div className="mt-16 bg-neutral-50 border border-neutral-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-lg font-bold text-neutral-950">High Volume Custom Calculator</h3>
              <p className="text-sm text-neutral-600">
                Need more than 10,000 SMS for your school term announcements, church congregation or nationwide marketing drive?
              </p>
              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span>Target SMS Volume:</span>
                  <span className="font-bold text-neutral-950">{customSms.toLocaleString()} SMS</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="50000"
                  step="500"
                  value={customSms}
                  onChange={(e) => setCustomSms(parseInt(e.target.value, 10))}
                  className="w-full accent-neutral-950 cursor-pointer"
                />
              </div>
            </div>

            <div className="p-6 bg-white border border-neutral-200 text-center">
              <div className="text-xs font-mono uppercase text-neutral-500">Estimated Total</div>
              <div className="text-2xl font-bold font-mono text-neutral-950 mt-1">
                UGX {calculateCustomPrice(customSms).toLocaleString()}
              </div>
              <div className="text-[11px] text-neutral-500 font-mono mt-1">
                Avg. UGX {(calculateCustomPrice(customSms) / customSms).toFixed(1)} / SMS
              </div>
              <button
                onClick={() => onNavigate('contact')}
                className="mt-4 w-full bg-neutral-950 text-white py-2 text-xs font-medium hover:bg-neutral-800 transition-colors"
              >
                Inquire for Volume Discount
              </button>
            </div>
          </div>
        </div>

        {/* Supported Payment Channels */}
        <div className="mt-16 border-t border-neutral-200 pt-10">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 mb-4 text-center">
            Payment Gateways Supported in Uganda
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs font-mono">
            <div className="p-4 border border-neutral-200 bg-white">
              <span className="font-bold block text-neutral-950">MTN Mobile Money</span>
              Instant Push USSD
            </div>
            <div className="p-4 border border-neutral-200 bg-white">
              <span className="font-bold block text-neutral-950">Airtel Money</span>
              Instant Push Prompt
            </div>
            <div className="p-4 border border-neutral-200 bg-white">
              <span className="font-bold block text-neutral-950">Pesapal Uganda</span>
              Visa / Mastercard / MoMo
            </div>
            <div className="p-4 border border-neutral-200 bg-white">
              <span className="font-bold block text-neutral-950">Bank Transfer & Cash</span>
              Manual Reconciliation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
