import React from 'react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-neutral-200 pb-8 mb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Privacy Policy
          </span>
          <h1 className="text-3xl font-extrabold text-neutral-950 mt-2">
            Data Protection & Privacy Policy
          </h1>
          <p className="text-neutral-500 text-xs font-mono mt-2">
            In compliance with the Data Protection and Privacy Act, 2019 (Uganda)
          </p>
        </div>

        <div className="space-y-6 text-sm text-neutral-700 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">1. Data Ownership</h2>
            <p>
              Your contact phone numbers, campaign lists, recipient databases, and message histories remain your exclusive property. The Eagle Icon Developers UG does not sell, rent, monetize, or share your contact phone numbers with any third-party advertisers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">2. Information We Collect</h2>
            <p>
              We collect account information (name, business name, email, phone number) to administer your SMS wallet and comply with Ugandan telecom Know-Your-Customer (KYC) requirements. Transmission logs (recipient number, timestamp, character count, delivery status) are retained for audit and billing verification purposes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">3. Encryption & Storage</h2>
            <p>
              All customer sessions and API requests are encrypted using TLS/HTTPS. Passwords and API secrets are cryptographically hashed using PBKDF2 with unique salts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">4. Right to Unsubscribe & Opt-Out</h2>
            <p>
              Under Ugandan law, SMS recipients possess the absolute right to opt out of promotional broadcasts. We maintain a centralized suppression blacklist to automatically block opted-out numbers from future marketing transmissions.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-neutral-950">5. Contact Data Privacy Officer</h2>
            <p>
              For privacy inquiries, contact our Data Protection Officer at <strong>privacy@iconsend.ug</strong> or by post at Plot 14 Kampala Road, Kampala, Uganda.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
