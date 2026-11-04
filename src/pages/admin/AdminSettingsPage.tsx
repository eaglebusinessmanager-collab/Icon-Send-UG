import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SystemSettings } from '../../types';
import { BookOpen, Settings, ShieldCheck, Database, Copy, Check, Save, CreditCard, RefreshCw, Key, AlertCircle } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    platform_name: 'ICON SEND UG',
    support_email: 'eaglebusinessmanager@gmail.com',
    whatsapp_contact: '+256772000001',
    phone_contact: '+256772000001',
    address_kampala: 'Plot 14 Kampala Road, Central Division, Kampala, Uganda',
    default_currency: 'UGX',
    signup_bonus_credits: 0,
    free_credits_enabled: false,
    maintenance_mode: false,
    require_email_verification: false,
    max_bulk_batch_size: 1000,
    active_provider_slug: 'bulksmsuganda',
    pesapal_consumer_key: '',
    pesapal_consumer_secret: '',
    pesapal_ipn_id: '',
    pesapal_base_url: 'https://pay.pesapal.com/v3',
  });

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'guide' | 'audit'>('settings');
  const [saveFeedback, setSaveFeedback] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [pesapalStatus, setPesapalStatus] = useState<any>(null);
  const [registeringIpn, setRegisteringIpn] = useState(false);
  const [ipnFeedback, setIpnFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSettingsAndStatus = () => {
    Promise.all([
      api.admin.systemSettings(),
      api.admin.auditLogs(),
      api.admin.pesapalStatus().catch(() => null),
    ]).then(([s, logs, pStatus]) => {
      setSettings(s);
      setAuditLogs(logs);
      if (pStatus) setPesapalStatus(pStatus);
    });
  };

  useEffect(() => {
    fetchSettingsAndStatus();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.updateSystemSettings(settings);
      setSaveFeedback('System settings updated successfully.');
      fetchSettingsAndStatus();
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch {
      alert('Error updating settings');
    }
  };

  const handleRegisterIpn = async () => {
    setRegisteringIpn(true);
    setIpnFeedback(null);
    try {
      // First save keys
      await api.admin.updateSystemSettings(settings);
      const res = await api.admin.registerPesapalIpn();
      setIpnFeedback(res);
      if (res.success && res.ipn_id) {
        setSettings(prev => ({ ...prev, pesapal_ipn_id: res.ipn_id }));
        fetchSettingsAndStatus();
      }
    } catch (err: any) {
      setIpnFeedback({ success: false, message: err.message || 'Failed to register IPN with Pesapal' });
    } finally {
      setRegisteringIpn(false);
    }
  };

  const copySqlToClipboard = () => {
    const sqlText = `-- ICON SEND UG Supabase DDL
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_credits INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'UGX'
);
-- Full schema available in /supabase_schema.sql`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              System Settings & Architecture Setup Guide
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Platform configurations, Supabase integration blueprint, and step-by-step administrator guide.
            </p>
          </div>

          <div className="flex border border-neutral-300">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 text-xs font-mono font-medium cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-neutral-950 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              System Config
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-3 py-1.5 text-xs font-mono font-medium cursor-pointer border-l border-neutral-300 ${
                activeTab === 'guide'
                  ? 'bg-neutral-950 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              8-Step Setup Guide
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-3 py-1.5 text-xs font-mono font-medium cursor-pointer border-l border-neutral-300 ${
                activeTab === 'audit'
                  ? 'bg-neutral-950 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              Audit Trail ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900 flex justify-between items-center">
          <span>{saveFeedback}</span>
          <button onClick={() => setSaveFeedback('')} className="text-neutral-500 hover:text-neutral-900">&times;</button>
        </div>
      )}

      {/* Tab 1: System Config */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-neutral-200 p-6 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Platform Brand Name *</label>
                <input
                  type="text"
                  required
                  value={settings.platform_name}
                  onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm font-sans"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Corporate Support Email *</label>
                <input
                  type="email"
                  required
                  value={settings.support_email}
                  onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Official WhatsApp Contact *</label>
                <input
                  type="text"
                  required
                  value={settings.whatsapp_contact}
                  onChange={(e) => setSettings({ ...settings, whatsapp_contact: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Default Platform Currency *</label>
                <input
                  type="text"
                  disabled
                  value={settings.default_currency}
                  className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-neutral-500 text-sm font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  New Customer Promotional Signup Credits
                </label>
                <input
                  type="number"
                  value={settings.signup_bonus_credits}
                  onChange={(e) => setSettings({ ...settings, signup_bonus_credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">
                  Max Bulk SMS Concurrency Batch Size
                </label>
                <input
                  type="number"
                  value={settings.max_bulk_batch_size}
                  onChange={(e) => setSettings({ ...settings, max_bulk_batch_size: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">Physical Address in Kampala</label>
              <input
                type="text"
                value={settings.address_kampala}
                onChange={(e) => setSettings({ ...settings, address_kampala: e.target.value })}
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm font-sans"
              />
            </div>

            <div className="p-4 bg-neutral-50 border border-neutral-200 space-y-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.free_credits_enabled}
                  onChange={(e) => setSettings({ ...settings, free_credits_enabled: e.target.checked })}
                  className="accent-neutral-950"
                />
                <span className="text-neutral-900 font-bold">Enable Free Trial Credits on Signup</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  className="accent-neutral-950"
                />
                <span className="text-neutral-900 font-bold">Maintenance Mode</span>
              </label>
            </div>

            {/* Pesapal Uganda Live Gateway Settings */}
            <div className="border border-neutral-300 p-5 bg-neutral-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-4 h-4 text-neutral-950" />
                  <span className="font-bold text-neutral-950 text-sm">Pesapal Uganda Live Gateway Configuration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 border ${
                    pesapalStatus?.configured
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white text-neutral-600 border-neutral-300'
                  }`}>
                    {pesapalStatus?.tokenStatus || (settings.pesapal_consumer_key ? 'Credentials Provided' : 'Missing Live Keys')}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-600 leading-relaxed">
                Connect your live Pesapal merchant account to automatically process MTN Mobile Money, Airtel Money, and Visa/Mastercard payments in UGX.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Pesapal Live Consumer Key
                  </label>
                  <input
                    type="text"
                    value={settings.pesapal_consumer_key || ''}
                    onChange={(e) => setSettings({ ...settings, pesapal_consumer_key: e.target.value })}
                    placeholder="e.g. gDkF9j... (from pay.pesapal.com)"
                    className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Pesapal Live Consumer Secret
                  </label>
                  <input
                    type="password"
                    value={settings.pesapal_consumer_secret || ''}
                    onChange={(e) => setSettings({ ...settings, pesapal_consumer_secret: e.target.value })}
                    placeholder="Enter Pesapal Consumer Secret"
                    className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-xs font-mono bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Pesapal API Base URL (Live)
                  </label>
                  <input
                    type="text"
                    value={settings.pesapal_base_url || 'https://pay.pesapal.com/v3'}
                    onChange={(e) => setSettings({ ...settings, pesapal_base_url: e.target.value })}
                    className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-xs font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-bold mb-1">
                    Pesapal Registered IPN ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.pesapal_ipn_id || ''}
                      onChange={(e) => setSettings({ ...settings, pesapal_ipn_id: e.target.value })}
                      placeholder="e.g. 523a604b-..."
                      className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-xs font-mono bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleRegisterIpn}
                      disabled={registeringIpn || !settings.pesapal_consumer_key || !settings.pesapal_consumer_secret}
                      className="whitespace-nowrap px-3 py-2 bg-neutral-900 text-white text-xs font-mono hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
                    >
                      {registeringIpn ? 'Registering...' : 'Register IPN'}
                    </button>
                  </div>
                </div>
              </div>

              {ipnFeedback && (
                <div className={`p-2.5 text-xs font-mono border ${
                  ipnFeedback.success
                    ? 'bg-neutral-100 text-neutral-950 border-neutral-400'
                    : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                }`}>
                  {ipnFeedback.message}
                </div>
              )}

              <div className="text-[11px] text-neutral-500 font-mono">
                Webhook listener: <span className="text-neutral-900 font-bold">/api/wallet/pesapal/ipn</span> (Automatically triggered when customers approve MTN/Airtel USSD prompts).
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-neutral-950 text-white px-6 py-2.5 font-medium hover:bg-neutral-800 inline-flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save System Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: 8-Step Complete Production Setup Guide */}
      {activeTab === 'guide' && (
        <div className="bg-white border border-neutral-200 p-8 space-y-8">
          <div>
            <span className="text-xs font-mono uppercase text-neutral-500 font-semibold">
              Deployment & Integration Manual
            </span>
            <h3 className="text-xl font-bold text-neutral-950 mt-1">
              ICON SEND UG Official Operator Setup Guide
            </h3>
            <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
              Step-by-step instructions for connecting external services, telecom keys, payment webhooks, and database migrations.
            </p>
          </div>

          <div className="space-y-6 text-xs text-neutral-800 leading-relaxed font-sans">
            {/* Step 1 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                1. How to Connect Supabase PostgreSQL
              </h4>
              <p>
                ICON SEND UG ships with a complete production SQL schema in <code>/supabase_schema.sql</code>. To link a remote Supabase project:
              </p>
              <ol className="list-decimal pl-5 space-y-1 text-neutral-700">
                <li>Create a new project at <code>app.supabase.com</code>.</li>
                <li>Navigate to the <strong>SQL Editor</strong> in your Supabase dashboard.</li>
                <li>Paste the contents of <code>/supabase_schema.sql</code> (or click the button below to copy the core tables) and click <strong>Run</strong>.</li>
                <li>Copy your <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> from Project Settings &gt; API into your server environment variables.</li>
              </ol>
              <div className="pt-2">
                <button
                  onClick={copySqlToClipboard}
                  className="bg-white border border-neutral-300 text-neutral-900 px-3 py-1.5 font-mono text-[11px] font-medium hover:bg-neutral-100 inline-flex items-center space-x-1"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'SQL Copied!' : 'Copy Supabase DDL SQL'}</span>
                </button>
              </div>
            </div>

            {/* Step 2 & 3 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                2 & 3. How to Configure Bulk SMS Uganda & Enter API Credentials
              </h4>
              <p>
                Our gateway communicates with the real <strong>Bulk SMS Uganda</strong> REST API v1:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Register an account on <code>https://bulksmsug.com</code>.</li>
                <li>Navigate to the API section in your Bulk SMS Uganda client portal to generate your <strong>Bearer Token API Key</strong>.</li>
                <li>Open <strong>Admin &gt; SMS Gateway Provider</strong> inside ICON SEND UG.</li>
                <li>Paste your Bearer token in the <strong>API Key</strong> field, ensure Base URL is set to <code>https://app.bulksmsug.com</code>, and click <strong>Save</strong>.</li>
                <li>Click <strong>Test Connection</strong> to run live diagnostics. The platform will report connection health and query available wholesale credits.</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                4. How to Configure the First Administrator Securely
              </h4>
              <p>
                The platform is pre-configured with a bootstrap administrator account:
              </p>
              <div className="p-3 bg-white border border-neutral-200 font-mono text-[11px] space-y-1">
                <div>Email: <strong>eaglebusinessmanager@gmail.com</strong></div>
                <div>Default Password: <strong>Admin@IconSend2026!</strong></div>
                <div>Role: <strong>super_admin</strong> (The Eagle Icon Developers UG)</div>
              </div>
              <p>
                Upon first login, change your password under <strong>Profile &gt; Security Credentials</strong>.
              </p>
            </div>

            {/* Step 5 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                5. How to Configure & Approve Sender IDs (UCC Compliance)
              </h4>
              <p>
                Under Uganda Communications Commission guidelines, commercial bulk SMS must be dispatched under a verified alphanumeric identity:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>Customers submit requests via their <strong>Profile &gt; Sender IDs</strong> section.</li>
                <li>Administrators review requests in <strong>Admin &gt; Sender ID Requests</strong>.</li>
                <li>Verify that the requested identity (e.g. <code>KAMPTRADERS</code>) matches the customer's registered trading name or certificate of incorporation.</li>
                <li>Approved Sender IDs are submitted to Bulk SMS Uganda / telecom operator desks for network routing provisioning.</li>
              </ul>
            </div>

            {/* Step 6 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                6. How to Configure Ugandan Payment Gateways
              </h4>
              <p>
                The application supports instant credit allocation in Uganda Shillings (UGX):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li><strong>MTN Mobile Money:</strong> Plug in your MTN MoMo OpenAPI subscription keys and collection user credentials.</li>
                <li><strong>Airtel Money:</strong> Configure Airtel Developer Portal API client credentials.</li>
                <li><strong>Pesapal Uganda:</strong> Set <code>PESAPAL_CONSUMER_KEY</code> and <code>CONSUMER_SECRET</code> for credit card and mobile money processing.</li>
                <li><strong>Manual Bank / Cash Reconciliation:</strong> Available out of the box in <strong>Admin &gt; Payment Reconciliation</strong>. Customers submit transaction references and admins verify against bank statements before crediting wallets.</li>
              </ul>
            </div>

            {/* Step 7 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                7. How to Deploy the Application
              </h4>
              <p>
                ICON SEND UG is built as a complete full-stack TypeScript application:
              </p>
              <div className="p-3 bg-white border border-neutral-200 font-mono text-[11px] space-y-1">
                <div>Build: <code>npm run build</code> (compiles client bundle)</div>
                <div>Start: <code>npm start</code> or <code>tsx server.ts</code></div>
                <div>Runtime Port: <code>3000</code></div>
                <div>Production Server: Express serving REST APIs and static Vite assets.</div>
              </div>
            </div>

            {/* Step 8 */}
            <div className="border border-neutral-200 p-5 bg-neutral-50 space-y-2">
              <h4 className="text-sm font-bold font-mono text-neutral-950">
                8. How to Switch SMS Providers Without Losing Customer Data
              </h4>
              <p>
                Our <strong>SMSGatewayManager</strong> architecture ensures total data isolation:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-neutral-700">
                <li>All customer balances, transactions, contacts, and campaigns are stored in our central database, completely separate from telecom providers.</li>
                <li>To switch to Africa's Talking, an SMPP server, or a new custom aggregator, simply visit <strong>Admin &gt; SMS Gateway Provider</strong>.</li>
                <li>Click <strong>Activate As Gateway</strong> on the target adapter.</li>
                <li>Subsequent messages will immediately route through the new provider with zero code modification and zero disruption to user wallets or message histories!</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-neutral-200">
          <div className="p-4 border-b border-neutral-200 text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
            Immutable Administrative Audit Trail
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="p-3">Action</th>
                  <th className="p-3">Admin Email</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="p-3 font-bold text-neutral-950">{log.action}</td>
                    <td className="p-3 text-neutral-700">{log.admin_email}</td>
                    <td className="p-3 text-neutral-500">{log.target_type} ({log.target_id})</td>
                    <td className="p-3 text-neutral-800 font-sans max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="p-3 text-neutral-400">{log.ip_address}</td>
                    <td className="p-3 text-neutral-400 text-[10px]">
                      {new Date(log.created_at).toLocaleDateString('en-GB', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
