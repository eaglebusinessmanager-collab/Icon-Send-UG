import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Check, Send, Users, Shield, BarChart2, Smartphone, Terminal } from 'lucide-react';
import { calculateSmsSegments, normalizeUgandanPhone } from '../../../server/sms/smsUtils';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [calculatorCount, setCalculatorCount] = useState<number>(500);
  const [demoMessage, setDemoMessage] = useState<string>(
    'Dear Customer, your order #8921 is ready for collection at our Kampala shop. Thank you for shopping with us.'
  );

  const estimatedCost = Math.round(calculatorCount * 38.5);
  const demoCalc = calculateSmsSegments(demoMessage);

  return (
    <div className="bg-white text-neutral-900">
      {/* Hero Section */}
      <section className="border-b border-neutral-200 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 text-xs font-mono uppercase tracking-wider text-neutral-700 bg-neutral-100 border border-neutral-300 px-3 py-1 mb-6">
              <span>Operated by The Eagle Icon Developers UG</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-950 leading-tight">
              Simple, Reliable Bulk SMS for Your Business.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-neutral-600 leading-relaxed max-w-2xl">
              Reach your customers, communicate with your audience and manage your SMS campaigns from one simple platform. Built specifically for Ugandan enterprises, institutions and retailers.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <button
                  onClick={() => onNavigate(user.role === 'admin' || user.role === 'super_admin' ? 'admin_overview' : 'dashboard')}
                  className="bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-2"
                >
                  <span>Go to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('register')}
                    className="bg-neutral-950 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onNavigate('login')}
                    className="border border-neutral-300 text-neutral-900 px-6 py-3 text-sm font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Sign In
                  </button>
                </>
              )}
              <button
                onClick={() => onNavigate('pricing')}
                className="text-neutral-700 px-4 py-3 text-sm hover:text-neutral-950 font-medium"
              >
                View Pricing (UGX) &rarr;
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-neutral-200 text-xs text-neutral-600 font-mono">
              <div>
                <span className="block text-neutral-950 font-bold">MTN & Airtel</span>
                Direct Carrier Route
              </div>
              <div>
                <span className="block text-neutral-950 font-bold">Instant Delivery</span>
                Real-time Handset Receipts
              </div>
              <div>
                <span className="block text-neutral-950 font-bold">UGX Currency</span>
                MTN MoMo & Airtel Money
              </div>
              <div>
                <span className="block text-neutral-950 font-bold">UCC Compliant</span>
                Custom Approved Sender IDs
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Preview & Segment Tester */}
      <section className="py-16 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Live Message Composer Demo */}
            <div className="bg-white border border-neutral-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                  Interactive SMS Composer & Segment Engine
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 bg-neutral-100 text-neutral-700 border border-neutral-200">
                  Sender: ICONSEND
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Try typing a sample marketing or transaction message:
                </label>
                <textarea
                  rows={4}
                  value={demoMessage}
                  onChange={(e) => setDemoMessage(e.target.value)}
                  className="w-full text-sm p-3 border border-neutral-300 font-mono focus:outline-none focus:border-neutral-900 bg-neutral-50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-neutral-50 border border-neutral-200 text-xs font-mono">
                <div>
                  <span className="text-neutral-500 block">Length:</span>
                  <span className="text-base font-bold text-neutral-950">{demoCalc.characterCount} chars</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Encoding:</span>
                  <span className="text-base font-bold text-neutral-950">{demoCalc.encoding}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Segments (Parts):</span>
                  <span className="text-base font-bold text-neutral-950">{demoCalc.segmentCount} Part{demoCalc.segmentCount > 1 ? 's' : ''}</span>
                </div>
              </div>

              <p className="text-xs text-neutral-500 leading-normal">
                Standard GSM 7-bit supports up to 160 characters in a single message part. Messages exceeding 160 characters are joined seamlessly into multi-part messages by the carrier.
              </p>
            </div>

            {/* Live UGX Cost Estimator */}
            <div className="bg-white border border-neutral-200 p-6 space-y-5">
              <div className="border-b border-neutral-200 pb-3">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
                  Uganda Shilling (UGX) Credit Estimator
                </span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-neutral-600">Audience Size:</span>
                  <span className="font-bold text-neutral-950">{calculatorCount.toLocaleString()} SMS messages</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={calculatorCount}
                  onChange={(e) => setCalculatorCount(parseInt(e.target.value, 10))}
                  className="w-full accent-neutral-950 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-neutral-400 font-mono mt-1">
                  <span>100 SMS</span>
                  <span>5,000 SMS</span>
                  <span>10,000+ SMS</span>
                </div>
              </div>

              <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-600">Rate per message part:</span>
                  <span className="text-neutral-950">~UGX 38.5</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-600">Estimated Total:</span>
                  <span className="text-lg font-bold font-mono text-neutral-950">
                    UGX {estimatedCost.toLocaleString()}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500 pt-1 border-t border-neutral-200">
                  Top-up instantly via MTN Mobile Money or Airtel Money with zero hidden gateway fees.
                </div>
              </div>

              <button
                onClick={() => onNavigate('register')}
                className="w-full bg-neutral-950 text-white py-2.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Create Account & Top Up via Pesapal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Features Grid */}
      <section className="py-20 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold mb-2">
              Features
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              Everything required to send business SMS in Uganda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="border border-neutral-200 p-6 space-y-3 bg-white">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-950">
                01
              </div>
              <h3 className="text-base font-bold text-neutral-950">Bulk SMS Engine</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Send to 10 or 100,000 customers in seconds. Paste raw phone numbers, upload Excel/CSV files, and eliminate duplicates automatically.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="border border-neutral-200 p-6 space-y-3 bg-white">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-950">
                02
              </div>
              <h3 className="text-base font-bold text-neutral-950">Ugandan Phone Normalization</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Accepts 07XXXXXXXX, 03XXXXXXXX, or international format. Automatically formats numbers and detects MTN, Airtel, and UTL carriers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="border border-neutral-200 p-6 space-y-3 bg-white">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-950">
                03
              </div>
              <h3 className="text-base font-bold text-neutral-950">Custom Sender IDs</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Replace generic numbers with your approved brand name (up to 11 characters) registered in compliance with UCC regulations.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="border border-neutral-200 p-6 space-y-3 bg-white">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-950">
                04
              </div>
              <h3 className="text-base font-bold text-neutral-950">Two-Phase Credit Protection</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Credits are strictly reserved during sending and deducted only upon successful gateway dispatch. Failed numbers are automatically refunded.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="border border-neutral-200 p-6 space-y-3 bg-white">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-950">
                05
              </div>
              <h3 className="text-base font-bold text-neutral-950">Delivery Reports & Audit</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Track exact carrier delivery statuses (Submitted, Sent, Buffered, Delivered, Failed) directly linked to provider tracking IDs.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="border border-neutral-200 p-6 space-y-3 bg-white">
              <div className="w-8 h-8 flex items-center justify-center bg-neutral-100 border border-neutral-300 font-mono text-xs font-bold text-neutral-950">
                06
              </div>
              <h3 className="text-base font-bold text-neutral-950">Mobile Money Integration</h3>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Top up your SMS credit wallet instantly using MTN Mobile Money, Airtel Money, or bank transfer with automated invoice reconciliation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview Section */}
      <section className="py-20 border-b border-neutral-200 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-bold mb-2">
              Transparent Pricing
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-neutral-950">
              Simple SMS credit packages in UGX.
            </p>
            <p className="text-sm text-neutral-600 mt-2">
              No monthly subscription fees. Credits never expire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Starter */}
            <div className="border border-neutral-200 bg-white p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Starter</span>
                <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">UGX 5,000</div>
                <div className="text-xs font-mono text-neutral-500 mt-1">125 SMS + 5 Bonus</div>
                <div className="text-xs text-neutral-600 mt-4 pt-4 border-t border-neutral-200">
                  Ideal for small retail shops and event alerts.
                </div>
              </div>
              <button
                onClick={() => onNavigate('register')}
                className="mt-6 w-full border border-neutral-300 hover:bg-neutral-100 py-2 text-xs font-medium text-neutral-900 transition-colors"
              >
                Choose Starter
              </button>
            </div>

            {/* Business */}
            <div className="border-2 border-neutral-950 bg-white p-6 flex flex-col justify-between relative">
              <span className="absolute -top-3 right-4 bg-neutral-950 text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
                Most Popular
              </span>
              <div>
                <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Business Growth</span>
                <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">UGX 10,000</div>
                <div className="text-xs font-mono text-neutral-500 mt-1">260 SMS + 20 Bonus</div>
                <div className="text-xs text-neutral-600 mt-4 pt-4 border-t border-neutral-200">
                  Best value for growing SMEs and flash sales.
                </div>
              </div>
              <button
                onClick={() => onNavigate('register')}
                className="mt-6 w-full bg-neutral-950 text-white hover:bg-neutral-800 py-2 text-xs font-medium transition-colors"
              >
                Choose Business
              </button>
            </div>

            {/* Professional */}
            <div className="border border-neutral-200 bg-white p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Professional</span>
                <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">UGX 25,000</div>
                <div className="text-xs font-mono text-neutral-500 mt-1">700 SMS + 60 Bonus</div>
                <div className="text-xs text-neutral-600 mt-4 pt-4 border-t border-neutral-200">
                  High volume retail, SACCOs, and corporate alerts.
                </div>
              </div>
              <button
                onClick={() => onNavigate('register')}
                className="mt-6 w-full border border-neutral-300 hover:bg-neutral-100 py-2 text-xs font-medium text-neutral-900 transition-colors"
              >
                Choose Professional
              </button>
            </div>

            {/* Enterprise */}
            <div className="border border-neutral-200 bg-white p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">Enterprise</span>
                <div className="text-2xl font-bold font-mono text-neutral-950 mt-2">UGX 50,000</div>
                <div className="text-xs font-mono text-neutral-500 mt-1">1,500 SMS + 150 Bonus</div>
                <div className="text-xs text-neutral-600 mt-4 pt-4 border-t border-neutral-200">
                  Schools, churches, and marketing agencies.
                </div>
              </div>
              <button
                onClick={() => onNavigate('register')}
                className="mt-6 w-full border border-neutral-300 hover:bg-neutral-100 py-2 text-xs font-medium text-neutral-900 transition-colors"
              >
                Choose Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action */}
      <section className="py-20 bg-neutral-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Start reaching your customers across Uganda today.
          </h2>
          <p className="mt-4 text-sm sm:text-base text-neutral-400">
            Sign up in 30 seconds and start sending SMS immediately with instant Pesapal UGX top-ups.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('register')}
              className="bg-white text-neutral-950 px-6 py-3 text-sm font-medium hover:bg-neutral-100 transition-colors"
            >
              Create Free Account
            </button>
            <button
              onClick={() => onNavigate('contact')}
              className="border border-neutral-700 text-white px-6 py-3 text-sm font-medium hover:bg-neutral-900 transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
