import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SMSProviderConfig } from '../../types';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Key,
  Shield,
  ArrowRight,
  Save,
  Send,
  Activity,
  Terminal,
  Clock,
  Eye,
  EyeOff,
  Sliders,
  DollarSign,
} from 'lucide-react';

interface DiagnosticResult {
  success: boolean;
  latencyMs: number;
  requestUrl: string;
  requestPayload: Record<string, unknown>;
  responseStatus: number;
  responseBody: any;
  providerMessageId?: string;
  status?: string;
  calculatedCredits?: number;
  errorMessage?: string;
  timestamp: string;
}

export const AdminProviderPage: React.FC = () => {
  const [providers, setProviders] = useState<
    Array<{
      slug: string;
      name: string;
      isActive: boolean;
      config: SMSProviderConfig;
    }>
  >([]);
  const [activeSlug, setActiveSlug] = useState<string>('bulksmsuganda');
  const [loading, setLoading] = useState<boolean>(true);

  // Live balance state
  const [liveBalance, setLiveBalance] = useState<{
    balance: number;
    currency: string;
    details?: string;
    lastHttpStatus?: number;
    rawResponse?: any;
    syncedAt?: string;
    endpointChecked?: string;
  } | null>(null);
  const [syncingBalance, setSyncingBalance] = useState<boolean>(false);
  const [balanceFeedback, setBalanceFeedback] = useState<string>('');

  // Manual pool calibration state
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [calibrationCredits, setCalibrationCredits] = useState<number>(2500);
  const [calibrating, setCalibrating] = useState<boolean>(false);

  // Connection ping test state
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; balance?: number; endpoint?: string } | null>(null);
  const [testing, setTesting] = useState<boolean>(false);

  // Live SMS dispatch tester state
  const [testRecipient, setTestRecipient] = useState<string>('+256772123456');
  const [testSenderId, setTestSenderId] = useState<string>('ICONSEND');
  const [testMessage, setTestMessage] = useState<string>('Hello! This is a real-time test SMS from ICON SEND UG via Bulk SMS Uganda gateway API.');
  const [dispatchingTest, setDispatchingTest] = useState<boolean>(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);

  // Configuration edit state
  const [editingSlug, setEditingSlug] = useState<string>('mambosms');
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>('https://api-mongolia.mambosms.com');
  const [senderId, setSenderId] = useState<string>('ICONSEND');
  const [testMode, setTestMode] = useState<boolean>(false);

  const [saveFeedback, setSaveFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');

  const loadProviders = async () => {
    try {
      const list = await api.admin.providers();
      setProviders(list);
      const active = list.find((p) => p.isActive);
      const currentActiveSlug = active ? active.slug : 'mambosms';
      setActiveSlug(currentActiveSlug);

      const targetToEdit = list.find((p) => p.slug === (editingSlug || currentActiveSlug)) || list[0];
      if (targetToEdit) {
        setEditingSlug(targetToEdit.slug);
        setApiKey(targetToEdit.config.api_key || '');
        setApiUrl(targetToEdit.config.api_url || (targetToEdit.slug === 'mambosms' ? 'https://api-mongolia.mambosms.com' : 'https://app.bulksmsug.com'));
        setSenderId(targetToEdit.config.sender_id || 'ICONSEND');
        setTestMode(Boolean(targetToEdit.config.test_mode));
        setCalibrationCredits(targetToEdit.config.balance_cached || 100);
      }
    } catch {
      console.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  // Sync balance from live carrier API
  const handleSyncBalance = async (slugToSync?: string) => {
    const targetSlug = slugToSync || activeSlug;
    setSyncingBalance(true);
    setBalanceFeedback('');
    try {
      const res = await api.admin.getProviderBalance(targetSlug);
      setLiveBalance(res);
      setCalibrationCredits(res.balance);
      setBalanceFeedback(`Balance refreshed: ${res.balance.toLocaleString()} credits.`);
      loadProviders();
      setTimeout(() => setBalanceFeedback(''), 4000);
    } catch (err: unknown) {
      setBalanceFeedback(err instanceof Error ? err.message : 'Error syncing live balance from provider');
    } finally {
      setSyncingBalance(false);
    }
  };

  useEffect(() => {
    loadProviders().then(() => {
      handleSyncBalance('mambosms');
    });
  }, []);

  const handleSelectToEdit = (slug: string) => {
    setEditingSlug(slug);
    const p = providers.find((item) => item.slug === slug);
    if (p) {
      setApiKey(p.config.api_key || '');
      setApiUrl(p.config.api_url || (slug === 'mambosms' ? 'https://api-mongolia.mambosms.com' : ''));
      setSenderId(p.config.sender_id || 'ICONSEND');
      setTestMode(Boolean(p.config.test_mode));
    }
  };

  const handleSwitchProvider = async (slug: string) => {
    try {
      const res = await api.admin.switchActiveProvider(slug);
      setActiveSlug(slug);
      setEditingSlug(slug);
      setSaveFeedback(res.message);
      loadProviders();
      handleSyncBalance(slug);
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error switching provider');
    }
  };

  const handleSaveProviderConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback('');
    setError('');

    try {
      await api.admin.updateProviderConfig(editingSlug, {
        api_key: apiKey,
        api_url: apiUrl,
        sender_id: senderId,
        test_mode: testMode,
      });
      setSaveFeedback(`${editingSlug.toUpperCase()} gateway configuration saved successfully.`);
      loadProviders();
      handleSyncBalance(editingSlug);
      setTimeout(() => setSaveFeedback(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving provider config');
    }
  };

  const handleTestConnection = async (slug: string) => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.admin.testProvider(slug);
      setTestResult(res);
      if (res.balance !== undefined) {
        setCalibrationCredits(res.balance);
      }
    } catch {
      setTestResult({ success: false, message: 'Failed to communicate with SMS provider' });
    } finally {
      setTesting(false);
    }
  };

  const handleCalibrateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalibrating(true);
    try {
      const res = await api.admin.updateProviderBalance(activeSlug, {
        balance: Number(calibrationCredits),
        reason: 'Manual balance pool calibration via Admin Panel',
      });
      setLiveBalance((prev) =>
        prev
          ? { ...prev, balance: res.balance, details: 'Manually calibrated by administrator' }
          : { balance: res.balance, currency: 'SMS Credits', details: 'Manually calibrated' }
      );
      setBalanceFeedback(`Carrier balance pool calibrated to ${res.balance.toLocaleString()} credits.`);
      setShowCalibration(false);
      loadProviders();
      setTimeout(() => setBalanceFeedback(''), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error calibrating balance');
    } finally {
      setCalibrating(false);
    }
  };

  // Live Test SMS dispatch
  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchingTest(true);
    setDiagnosticResult(null);
    setError('');

    try {
      const res = await api.admin.sendTestSms(activeSlug, {
        recipient: testRecipient,
        message: testMessage,
        sender_id: testSenderId,
      });
      setDiagnosticResult(res);
      // Auto refresh balance after test send
      handleSyncBalance(activeSlug);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Test dispatch failed');
    } finally {
      setDispatchingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Owner Header */}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-mono uppercase text-neutral-500 font-semibold">
              The Eagle Icon Developers UG · Gateway Infrastructure
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-950 tracking-tight mt-1">
              SMS Provider Integration & API Diagnostics
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Direct carrier connection to Bulk SMS Uganda. Query real-time API balance, run live test message dispatches, and inspect raw telecom payloads.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold px-3 py-1.5 bg-neutral-100 border border-neutral-300 text-neutral-950">
              Active: {activeSlug.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900 flex justify-between items-center">
          <span>{saveFeedback}</span>
          <button onClick={() => setSaveFeedback('')} className="text-neutral-500 hover:text-neutral-900 cursor-pointer">
            &times;
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Real-Time Carrier Balance Section */}
      <div className="bg-white border-2 border-neutral-950 p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-200">
          <div>
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-neutral-950" />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-950">
                Live Gateway API Balance
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Live account credit balance directly from {activeSlug === 'bulksmsuganda' ? 'Bulk SMS Uganda REST API' : activeSlug}.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleSyncBalance()}
              disabled={syncingBalance}
              className="bg-neutral-950 text-white px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-800 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingBalance ? 'animate-spin' : ''}`} />
              <span>{syncingBalance ? 'Syncing...' : 'Sync Balance from API'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCalibration(!showCalibration)}
              className="border border-neutral-300 text-neutral-800 px-3 py-2 text-xs font-mono hover:bg-neutral-50 flex items-center space-x-1 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Calibrate Pool</span>
            </button>
          </div>
        </div>

        {/* Balance Display Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              Available Carrier Credits
            </div>
            <div className="text-3xl font-extrabold font-mono text-neutral-950 mt-1">
              {liveBalance ? liveBalance.balance.toLocaleString() : '...'}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-1">
              {liveBalance?.currency || 'SMS Credits'} (Shared wholesale pool)
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              API Query Status
            </div>
            <div className="text-xs font-mono font-bold text-neutral-950 mt-2 truncate">
              {liveBalance?.lastHttpStatus ? `HTTP ${liveBalance.lastHttpStatus}` : 'API Connected'}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 mt-1 line-clamp-2">
              {liveBalance?.details || 'Carrier endpoint connection online.'}
            </div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200">
            <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
              Last API Synchronization
            </div>
            <div className="text-xs font-mono text-neutral-950 mt-2">
              {liveBalance?.syncedAt ? new Date(liveBalance.syncedAt).toLocaleTimeString() : 'Just now'}
            </div>
            <div className="text-[10px] font-mono text-neutral-500 mt-1 truncate">
              Endpoint: {liveBalance?.endpointChecked || 'https://app.bulksmsug.com/api/v1/balance'}
            </div>
          </div>
        </div>

        {balanceFeedback && (
          <div className="p-2.5 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900">
            {balanceFeedback}
          </div>
        )}

        {/* Manual Calibration Form */}
        {showCalibration && (
          <form onSubmit={handleCalibrateBalance} className="p-4 bg-neutral-100 border border-neutral-300 space-y-3">
            <div className="text-xs font-mono font-bold text-neutral-900 uppercase">
              Calibrate Tracked Provider Balance Pool
            </div>
            <p className="text-[11px] font-mono text-neutral-600">
              Bulk SMS Uganda displays your credit balance on your dashboard at bulksmsug.com. If the carrier REST endpoint is unavailable or returns cached counts, you can calibrate the tracked pool here.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 items-center">
              <input
                type="number"
                min="0"
                value={calibrationCredits}
                onChange={(e) => setCalibrationCredits(Number(e.target.value))}
                className="w-full sm:w-48 px-3 py-1.5 border border-neutral-300 bg-white text-xs font-mono focus:outline-none focus:border-neutral-950"
                placeholder="2500"
              />
              <button
                type="submit"
                disabled={calibrating}
                className="w-full sm:w-auto bg-neutral-950 text-white px-4 py-1.5 text-xs font-mono hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
              >
                {calibrating ? 'Calibrating...' : 'Set Carrier Balance'}
              </button>
              <button
                type="button"
                onClick={() => setShowCalibration(false)}
                className="text-xs font-mono text-neutral-600 hover:text-neutral-950 px-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Interactive Live SMS API Dispatcher & Diagnostic Tester */}
      <div className="bg-white border border-neutral-200 p-6 space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-neutral-200">
          <Terminal className="w-4 h-4 text-neutral-950" />
          <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
            Live Gateway API Dispatch & Telemetry Tester
          </h3>
        </div>
        <p className="text-xs text-neutral-600 font-mono">
          Dispatch an instant live SMS message directly to any Ugandan phone number via the configured gateway to verify API tokens, carrier routing, and response headers.
        </p>

        <form onSubmit={handleSendTestSms} className="space-y-4 text-xs font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">
                Recipient Ugandan Phone Number *
              </label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="0772123456 or +256701234567"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
                required
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Normalized automatically to international +256 format.
              </span>
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">
                Sender ID Header
              </label>
              <input
                type="text"
                value={testSenderId}
                onChange={(e) => setTestSenderId(e.target.value)}
                placeholder="ICONSEND"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
              />
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                Approved alphanumeric sender header (max 11 chars).
              </span>
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-bold mb-1">
              Test Message Body *
            </label>
            <textarea
              rows={2}
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-xs"
              required
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-neutral-500">
              Gateway Target: <strong className="text-neutral-800">{activeSlug.toUpperCase()}</strong> ({apiUrl}/api/v1/send-sms)
            </span>
            <button
              type="submit"
              disabled={dispatchingTest}
              className="bg-neutral-950 text-white px-5 py-2 font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${dispatchingTest ? 'animate-pulse' : ''}`} />
              <span>{dispatchingTest ? 'Dispatching to Telecom...' : 'Send Live Test SMS'}</span>
            </button>
          </div>
        </form>

        {/* Live Diagnostic Telemetry Console */}
        {diagnosticResult && (
          <div className="mt-6 border border-neutral-300 bg-neutral-950 text-neutral-100 p-4 font-mono text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                    diagnosticResult.success ? 'bg-white text-neutral-950' : 'bg-neutral-700 text-white'
                  }`}
                >
                  {diagnosticResult.success ? 'DISPATCH SUCCESS' : 'DISPATCH FAILED'}
                </span>
                <span className="text-neutral-300">
                  HTTP Status: <strong>{diagnosticResult.responseStatus || 'N/A'}</strong>
                </span>
              </div>
              <div className="flex items-center space-x-3 text-neutral-400 text-[11px]">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Latency: {diagnosticResult.latencyMs} ms</span>
                </span>
                <span>Time: {new Date(diagnosticResult.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>

            {diagnosticResult.errorMessage && (
              <div className="p-2 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs">
                Error Message: {diagnosticResult.errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div>
                <div className="text-neutral-400 font-bold mb-1 uppercase text-[10px]">
                  Request Payload (Outgoing to Gateway):
                </div>
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-300 overflow-x-auto">
                  <div className="text-neutral-500 mb-1">URL: {diagnosticResult.requestUrl}</div>
                  <pre>{JSON.stringify(diagnosticResult.requestPayload, null, 2)}</pre>
                </div>
              </div>

              <div>
                <div className="text-neutral-400 font-bold mb-1 uppercase text-[10px]">
                  Gateway Raw Response (Incoming from Carrier):
                </div>
                <div className="p-2.5 bg-neutral-900 border border-neutral-800 text-neutral-200 overflow-x-auto">
                  {diagnosticResult.providerMessageId && (
                    <div className="text-neutral-300 mb-1">
                      Carrier ID: <strong className="text-white">{diagnosticResult.providerMessageId}</strong>
                    </div>
                  )}
                  <pre>{JSON.stringify(diagnosticResult.responseBody, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Provider Switching Deck */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {providers.map((p) => {
          const isActive = p.slug === activeSlug;
          return (
            <div
              key={p.slug}
              className={`border p-6 flex flex-col justify-between bg-white relative ${
                isActive ? 'border-2 border-neutral-950' : 'border-neutral-200'
              }`}
            >
              {isActive && (
                <span className="absolute -top-3 right-4 bg-neutral-950 text-white text-[10px] font-mono px-2 py-0.5 font-bold uppercase">
                  Active Dispatch Gateway
                </span>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-neutral-900" />
                  <h3 className="text-sm font-bold text-neutral-950">{p.name}</h3>
                </div>

                <div className="text-xs font-mono text-neutral-500 space-y-1">
                  <div>
                    Adapter Slug: <strong className="text-neutral-800">{p.slug}</strong>
                  </div>
                  <div>
                    Base URL: <span className="text-neutral-700 truncate block">{p.config.api_url || 'Custom SMPP/HTTP'}</span>
                  </div>
                  <div>
                    Default Sender: <strong className="text-neutral-800">{p.config.sender_id || 'ICONSEND'}</strong>
                  </div>
                  <div>
                    Mode: <strong>{p.config.test_mode ? 'Test Mode (Simulation)' : 'Production Live'}</strong>
                  </div>
                  <div>
                    Cached Balance: <strong>{p.config.balance_cached ?? 0} Credits</strong>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelectToEdit(p.slug)}
                  className={`w-full text-xs font-mono py-1.5 border ${
                    editingSlug === p.slug ? 'bg-neutral-950 text-white border-neutral-950' : 'border-neutral-300 hover:bg-neutral-50 text-neutral-800'
                  } flex items-center justify-center space-x-1 cursor-pointer`}
                >
                  <Sliders className="w-3 h-3" />
                  <span>{editingSlug === p.slug ? 'Currently Editing' : 'Configure Settings'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTestConnection(p.slug)}
                  disabled={testing}
                  className="w-full text-xs font-mono py-1.5 border border-neutral-300 hover:bg-neutral-50 text-neutral-800 flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                  <span>Ping / Test Gateway</span>
                </button>

                {!isActive && (
                  <button
                    type="button"
                    onClick={() => handleSwitchProvider(p.slug)}
                    className="w-full text-xs font-mono py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer"
                  >
                    Activate As Gateway
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ping Connection Result Box */}
      {testResult && (
        <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs font-mono space-y-2">
          <div className="flex items-center space-x-2">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-neutral-950" />
            ) : (
              <AlertCircle className="w-4 h-4 text-neutral-900" />
            )}
            <span className="font-bold text-neutral-950">
              Gateway Ping Diagnostic: {testResult.success ? 'ONLINE' : 'ERROR'}
            </span>
          </div>
          <p className="text-neutral-700">{testResult.message}</p>
          {testResult.endpoint && (
            <div className="text-neutral-500 text-[11px]">
              Endpoint Verified: {testResult.endpoint}
            </div>
          )}
          {testResult.balance !== undefined && (
            <div className="text-neutral-600">
              Reported Carrier Account Balance: <strong>{testResult.balance.toLocaleString()} Credits</strong>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Provider Configuration Form */}
      <div className="bg-white border-2 border-neutral-950 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-neutral-200 gap-2">
          <div>
            <div className="text-[10px] font-mono text-neutral-500 uppercase font-semibold">
              Selected Provider: {editingSlug.toUpperCase()}
            </div>
            <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
              {providers.find(p => p.slug === editingSlug)?.name || editingSlug} Configuration
              {editingSlug === activeSlug && (
                <span className="ml-2 text-[10px] bg-neutral-950 text-white px-2 py-0.5 font-normal">
                  PRIMARY ACTIVE GATEWAY
                </span>
              )}
            </h3>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              {editingSlug === 'mambosms'
                ? 'Direct telecom routing via Mambo SMS API (https://api-mongolia.mambosms.com/v1/send-sms)'
                : `Gateway connection endpoint: ${apiUrl || 'Custom'}`}
            </p>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-neutral-300 self-start sm:self-auto">
            Credentials Stored Securely on Backend
          </span>
        </div>

        <form onSubmit={handleSaveProviderConfig} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-neutral-700 font-bold mb-1">
              API Key / Auth Token (Kept private on server, masked from client) *
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="•••••••••••••••• (Leave unchanged or enter new key)"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-neutral-400 mt-0.5 block">
              {editingSlug === 'mambosms'
                ? 'Configured with live production Mambo SMS key. Leave unchanged or input a new key if rotating credentials.'
                : 'Leave blank to use defaults or simulation mode.'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-700 font-bold mb-1">
                API Base URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-bold mb-1">
                Default Approved Sender ID
              </label>
              <input
                type="text"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder="ICONSEND"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
              />
            </div>
          </div>

          <div className="p-3 bg-neutral-50 border border-neutral-200">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={testMode}
                onChange={(e) => setTestMode(e.target.checked)}
                className="accent-neutral-950"
              />
              <span className="text-neutral-950 font-bold">
                Enable Test / Simulation Mode (Sandbox)
              </span>
            </label>
            <p className="text-[11px] text-neutral-500 mt-1 pl-6">
              When checked, SMS dispatches are simulated without calling external telecom carriers. Keep unchecked for <strong>Live Production Dispatches</strong>.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            {editingSlug !== activeSlug && (
              <button
                type="button"
                onClick={() => handleSwitchProvider(editingSlug)}
                className="border border-neutral-950 text-neutral-950 px-4 py-2 font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-2 cursor-pointer"
              >
                <span>Make Active Provider</span>
              </button>
            )}
            <button
              type="submit"
              className="bg-neutral-950 text-white px-6 py-2.5 font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save {providers.find(p => p.slug === editingSlug)?.name || editingSlug} Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
