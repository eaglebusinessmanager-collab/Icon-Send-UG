import React from 'react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-neutral-200 pb-8">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            About The Platform
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-2">
            ICON SEND UG & The Eagle Icon Developers
          </h1>
          <p className="text-neutral-600 mt-4 leading-relaxed">
            A production-grade, enterprise messaging infrastructure engineered in Kampala, Uganda.
          </p>
        </div>

        <div className="py-10 space-y-8 text-neutral-800 text-sm leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-950">Our Mission</h2>
            <p>
              ICON SEND UG was developed by <strong>The Eagle Icon Developers UG</strong> to bridge the gap between complex telecom carrier interfaces and Ugandan businesses. Whether you are a small wholesale merchant downtown in Kampala, an educational institution communicating with parents, or a national SACCO sending automated transaction confirmations, our gateway delivers messages promptly and reliably.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-950">Direct Ugandan Carrier Connectivity</h2>
            <p>
              Our infrastructure connects through high-throughput SMPP and REST gateways directly into the national telecom operators:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-neutral-700">
              <li><strong>MTN Uganda:</strong> Direct routing via 077, 078, and 076 prefixes.</li>
              <li><strong>Airtel Uganda:</strong> Direct routing via 070, 075, and 074 prefixes.</li>
              <li><strong>Uganda Telecom (UTL):</strong> Support for 071 and Kampala fixed landlines (041).</li>
              <li><strong>LycaMobile & Smile Telecom:</strong> Full nationwide delivery verification.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-950">Modular Telecom Architecture</h2>
            <p>
              Unlike legacy SMS resellers whose applications break whenever a gateway is changed, ICON SEND UG is architected with a decoupled provider layer. The platform currently routes messages through Bulk SMS Uganda while supporting seamless failover and provider switching without disrupting customer balances, contact databases, or campaign logs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-neutral-950">Compliance & Regulatory Standards</h2>
            <p>
              We adhere strictly to the guidelines set forth by the Uganda Communications Commission (UCC) regarding commercial bulk messaging, alphanumeric sender ID registration, and customer opt-out mechanisms.
            </p>
          </section>

          <div className="pt-8 border-t border-neutral-200 flex items-center justify-between">
            <div>
              <span className="block text-xs font-mono uppercase text-neutral-500">Corporate Office</span>
              <span className="text-sm font-semibold text-neutral-950">Plot 14 Kampala Road, Central Division, Kampala, Uganda</span>
            </div>
            <button
              onClick={() => onNavigate('contact')}
              className="border border-neutral-900 px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-900 hover:text-white transition-colors"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
