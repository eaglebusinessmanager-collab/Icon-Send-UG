import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="bg-white py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-500 font-semibold">
            Contact & Support
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-950 mt-2">
            Get in Touch With Our Engineering Team
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 mt-3">
            Have questions about custom volume pricing, UCC Sender ID registration, or API integration? We are here to assist.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="border border-neutral-200 p-6 space-y-4 bg-neutral-50">
              <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-neutral-900">
                The Eagle Icon Developers UG
              </h3>

              <div className="space-y-3 text-sm text-neutral-700">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-4 h-4 text-neutral-950 mt-1 shrink-0" />
                  <span>Plot 14 Kampala Road, Central Division, Kampala, Uganda</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-neutral-950 shrink-0" />
                  <span className="font-mono text-xs">support@iconsend.ug</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-neutral-950 shrink-0" />
                  <span className="font-mono text-xs">+256 772 000001 (Phone & WhatsApp)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-500">
                Business Hours: Monday – Saturday, 8:00 AM – 6:00 PM EAT
              </div>
            </div>

            <div className="border border-neutral-200 p-6 bg-white space-y-2">
              <span className="text-xs font-mono font-bold uppercase text-neutral-950 block">Direct WhatsApp</span>
              <p className="text-xs text-neutral-600">
                Need urgent assistance with a campaign or credit top-up? Chat with our Kampala operations desk.
              </p>
              <a
                href="https://wa.me/256772000001?text=Hello%20ICON%20SEND%20UG%20Support"
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-xs font-mono font-medium underline text-neutral-950 hover:text-neutral-700"
              >
                Open WhatsApp (+256772000001) &rarr;
              </a>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-2">
            <div className="border border-neutral-200 p-8 bg-white">
              {submitted ? (
                <div className="text-center py-12 space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-neutral-950 mx-auto" />
                  <h3 className="text-xl font-bold text-neutral-950">Inquiry Received</h3>
                  <p className="text-sm text-neutral-600 max-w-md mx-auto">
                    Thank you for contacting The Eagle Icon Developers. A representative will respond to your email ({formData.email || 'provided address'}) within 2 business hours.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                    }}
                    className="border border-neutral-300 px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-50 transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Your Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                        placeholder="e.g. Kasule David"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                        placeholder="you@company.ug"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Phone Number (Uganda)</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
                        placeholder="0772000000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Subject *</label>
                      <select
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 bg-white"
                      >
                        <option value="">Select inquiry topic...</option>
                        <option value="Sender ID Request">UCC Sender ID Registration</option>
                        <option value="Enterprise Pricing">Enterprise Bulk SMS Volume</option>
                        <option value="API Integration">API & Webhook Documentation</option>
                        <option value="Payment Reconciliation">Payment / Invoice Reconciliation</option>
                        <option value="General Support">General Support & Guidance</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Your Message *</label>
                    <textarea
                      rows={5}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full text-sm p-3 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                      placeholder="Please describe your requirements, expected SMS volumes, or specific technical questions..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-neutral-950 text-white py-3 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    Submit Inquiry to The Eagle Icon Developers
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
