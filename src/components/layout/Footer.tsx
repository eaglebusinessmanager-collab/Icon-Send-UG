import React from 'react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-neutral-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-base font-bold text-neutral-950">ICON SEND</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 bg-neutral-900 text-white">UG</span>
            </div>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Professional, high-throughput Bulk SMS gateway and campaign management platform built for Ugandan enterprises, SMEs, and institutions.
            </p>
            <div className="pt-2 text-xs font-mono text-neutral-500">
              Kampala, Uganda · Direct Telecom Gateway
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-950 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li>
                <button onClick={() => onNavigate('features')} className="hover:text-neutral-950 transition-colors">
                  Single & Bulk SMS
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('pricing')} className="hover:text-neutral-950 transition-colors">
                  UGX Credit Packages
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('features')} className="hover:text-neutral-950 transition-colors">
                  Contact Groups & CSV
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('features')} className="hover:text-neutral-950 transition-colors">
                  Delivery Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-950 mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-neutral-950 transition-colors">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('faq')} className="hover:text-neutral-950 transition-colors">
                  Frequently Asked Questions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-neutral-950 transition-colors">
                  Contact & Support
                </button>
              </li>
              <li>
                <span className="text-xs text-neutral-500 block pt-1">
                  Support: support@iconsend.ug
                </span>
              </li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-950 mb-4">
              Compliance & Legal
            </h4>
            <ul className="space-y-2.5 text-sm text-neutral-600">
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-neutral-950 transition-colors">
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-neutral-950 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-neutral-950 transition-colors">
                  UCC Sender ID Guidelines
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-neutral-950 transition-colors">
                  Opt-out & Unsubscribe
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator and attribution */}
        <div className="mt-12 pt-8 border-t border-neutral-200 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 space-y-4 md:space-y-0">
          <div>
            &copy; {new Date().getFullYear()} ICON SEND UG. All rights reserved.
          </div>
          <div className="font-medium text-neutral-900 border-t md:border-t-0 pt-2 md:pt-0">
            Powered by The Eagle Icon Developers UG
          </div>
        </div>
      </div>
    </footer>
  );
};
