import React from 'react';

export const TermsPage: React.FC = () => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-neutral-200 pb-8 mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Legal & Compliance
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-950 mt-2">
            Terms & Conditions of Service
          </h1>
          <p className="text-neutral-500 text-xs font-mono mt-2">
            Last Updated: January 2026 · The Eagle Icon Developers UG
          </p>
        </div>

        <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ICON SEND UG ("the Service"), operated by The Eagle Icon Developers UG, you agree to comply with and be bound by these Terms and Conditions and all applicable regulations of the Uganda Communications Commission (UCC).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">2. Permitted Use & Spam Prevention</h2>
            <p>
              The Service must only be used to transmit legitimate transactional, informational, and consensual promotional SMS messages. You agree not to send unsolicited spam, deceptive financial offers, political hate speech, defamation, or fraudulent messages. Accounts identified transmitting abusive content will be suspended immediately without refund.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">3. Sender ID Compliance</h2>
            <p>
              All custom alphanumeric Sender IDs must correspond to genuine registered businesses, registered trademarks, or verified organizations in Uganda. Sender IDs may not impersonate banks, financial institutions, telecommunication companies, or government authorities.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">4. SMS Credits & Payments</h2>
            <p>
              All SMS credits purchased in Uganda Shillings (UGX) are non-refundable once allocated. Credits do not expire. In the event of gateway transmission failures resulting from mobile network downtimes, eligible reserved credits will be re-credited to your internal wallet.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">5. Limitation of Liability</h2>
            <p>
              While The Eagle Icon Developers UG maintains carrier routing redundancy, we shall not be liable for delivery delays caused by recipient device disconnection, network operator outages, or handset filtering software.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
