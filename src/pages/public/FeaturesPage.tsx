import React from 'react';

interface FeaturesPageProps {
  onNavigate: (page: string) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Platform Capabilities
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-2">
            Engineered for High Deliverability & Scale
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3">
            A comprehensive overview of the technical and operational tools inside ICON SEND UG.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">01. Single & Transactional SMS</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Send fast one-to-one messages for two-factor authentication (OTP), delivery updates, receipt confirmations, and customer appointment reminders. Instant carrier response returned.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">02. High-Throughput Bulk Dispatch</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Paste thousands of phone numbers or import clean CSV lists. Built-in deduplication ensures you never pay for duplicate entries in the same campaign batch.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">03. Automated Ugandan Phone Parsing</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Accepts messy local inputs (0772..., 0701..., +256..., 256...) and normalizes them into international telecom standard (+2567...). Flags invalid numbers before dispatch so credits are not wasted.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">04. Contact Groups & Audience Segmentation</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Organize contacts into custom groups like "Kampala Wholesale", "VIP Customers", or "Staff". Easily broadcast targeted campaigns to specific groups in one click.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">05. Alphanumeric Sender IDs (UCC)</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Submit custom business Sender IDs (up to 11 alphanumeric characters) directly through the platform. Manage review status and approvals in compliance with UCC regulations.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">06. Two-Phase Wallet Deductions</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Credits are reserved upfront and only deducted when the SMS gateway confirms submission. If a network drops or a batch partially fails, unused credits are immediately refunded to your internal wallet.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">07. Real-Time Delivery Reports</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Query direct carrier handset receipts. We never simulate delivery; every record is linked to an authentic carrier message tracking ID.
            </p>
          </div>

          <div className="border border-neutral-200 p-6 space-y-3">
            <h3 className="text-base font-bold text-neutral-950 font-mono">08. Opt-out & Compliance Protection</h3>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Maintain unsubscribe blacklists. Any recipient who texts STOP or requests removal is automatically suppressed from future promotional campaigns.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => onNavigate('register')}
            className="bg-neutral-950 text-white px-8 py-3 text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Create Your Account Now
          </button>
        </div>
      </div>
    </div>
  );
};
