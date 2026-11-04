import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const FaqPage: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'What is Bulk SMS and how does it benefit my business in Uganda?',
      a: 'Bulk SMS allows you to send thousands of text messages directly to customers\' mobile phones instantly. In Uganda, where SMS has over 98% open rates compared to email, businesses use it for promotional discounts, order updates, school fee balances, church notices, and urgent alerts.'
    },
    {
      q: 'How many characters are counted in 1 SMS credit?',
      a: 'Using standard GSM 7-bit text characters, 1 SMS credit covers up to 160 characters. If your message exceeds 160 characters, it is concatenated into multiple segments (153 characters per part). If your message contains special characters or emojis, it switches to Unicode (UCS-2), which accommodates up to 70 characters per part.'
    },
    {
      q: 'Which telecom networks are supported?',
      a: 'ICON SEND UG connects to all Ugandan mobile operators including MTN Uganda (077, 078, 076), Airtel Uganda (070, 075, 074), Uganda Telecom (071, 041), Smile, and LycaMobile.'
    },
    {
      q: 'How do I top up my SMS wallet using MTN Mobile Money or Airtel Money?',
      a: 'Simply navigate to the "Buy Credits" section in your customer workspace, select any package (starting from UGX 5,000), choose MTN MoMo or Airtel Money, and initiate the top-up. The credits are added to your wallet immediately.'
    },
    {
      q: 'How do I get a custom Sender ID (e.g. MYBRAND)?',
      a: 'In your workspace under Sender IDs, submit your desired name (up to 11 alphanumeric characters) along with your business registration details and sample message. In accordance with Uganda Communications Commission (UCC) guidelines, approval takes between 2 to 24 hours.'
    },
    {
      q: 'What happens if a recipient number is invalid or delivery fails?',
      a: 'Our two-phase transaction system only reserves credits during batch initiation. Credits for numbers that fail or are rejected by the network gateway are automatically released and credited back to your balance.'
    },
    {
      q: 'Can customers opt out or unsubscribe from my messages?',
      a: 'Yes. In compliance with UCC consumer protection regulations, marketing broadcasts must include an opt-out option (such as "Reply STOP to opt out"). When a customer unsubscribes, their number is automatically blacklisted in our database to prevent accidental future messaging.'
    },
  ];

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="border-b border-neutral-200 pb-8 mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Knowledge Base
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-2">
            Frequently Asked Questions
          </h1>
          <p className="text-neutral-600 mt-3 text-sm">
            Everything you need to know about pricing, character limits, sender IDs, and gateway connectivity in Uganda.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div key={idx} className="border border-neutral-200 bg-white">
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full text-left p-5 flex items-center justify-between space-x-4 cursor-pointer hover:bg-neutral-50"
                >
                  <span className="text-sm font-bold text-neutral-950">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-neutral-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-600 border-t border-neutral-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
