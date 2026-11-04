import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SegmentCounter } from '../../components/sms/SegmentCounter';
import { normalizeUgandanPhone, calculateSmsSegments } from '../../../server/sms/smsUtils';
import { ContactGroup, SenderID, SMSCampaign } from '../../types';
import {
  Users,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Send,
} from 'lucide-react';

interface BulkSmsPageProps {
  onNavigate: (page: string) => void;
}

export const BulkSmsPage: React.FC<BulkSmsPageProps> = ({ onNavigate }) => {
  const { wallet, refreshWallet } = useAuth();
  const [campaignName, setCampaignName] = useState<string>('');
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [selectedSenderId, setSelectedSenderId] = useState<string>('ICONSEND');
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  const [inputMode, setInputMode] = useState<'paste' | 'csv' | 'group'>('paste');
  const [rawTextRecipients, setRawTextRecipients] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [parsedRecipients, setParsedRecipients] = useState<string[]>([]);

  const [message, setMessage] = useState<string>('');
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);

  const [validationStats, setValidationStats] = useState<{
    total: number;
    valid: number;
    duplicates: number;
    invalid: number;
    validList: string[];
  }>({ total: 0, valid: 0, duplicates: 0, invalid: 0, validList: [] });

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [campaignSuccess, setCampaignSuccess] = useState<any>(null);

  useEffect(() => {
    // Load sender IDs and groups
    Promise.all([api.senderIds.list(), api.contacts.groups()]).then(([sList, gList]) => {
      setSenderIds(sList);
      setGroups(gList);
      const approved = sList.find(s => s.status === 'approved');
      if (approved) setSelectedSenderId(approved.sender_id);
    });
  }, []);

  // Recalculate validation whenever inputs change
  useEffect(() => {
    let sourceList: string[] = [];

    if (inputMode === 'paste') {
      sourceList = rawTextRecipients
        .split(/[\n,;]+/)
        .map(r => r.trim())
        .filter(Boolean);
    } else if (inputMode === 'csv') {
      sourceList = parsedRecipients;
    } else if (inputMode === 'group') {
      // Group loaded contacts
      sourceList = parsedRecipients;
    }

    const seen = new Set<string>();
    const validList: string[] = [];
    let duplicates = 0;
    let invalid = 0;

    for (const raw of sourceList) {
      const check = normalizeUgandanPhone(raw);
      if (!check.isValid) {
        invalid++;
        continue;
      }

      if (seen.has(check.normalized)) {
        duplicates++;
        if (removeDuplicates) {
          continue;
        }
      }

      seen.add(check.normalized);
      validList.push(check.normalized);
    }

    setValidationStats({
      total: sourceList.length,
      valid: validList.length,
      duplicates,
      invalid,
      validList,
    });
  }, [rawTextRecipients, parsedRecipients, inputMode, removeDuplicates]);

  // Load contacts from group when group is selected
  const handleGroupSelect = async (groupId: string) => {
    setSelectedGroupId(groupId);
    if (!groupId) {
      setParsedRecipients([]);
      return;
    }

    try {
      const contacts = await api.contacts.list({ group_id: groupId });
      const phones = contacts.map(c => c.normalized_phone || c.phone_number);
      setParsedRecipients(phones);
    } catch {
      setError('Could not fetch group contacts');
    }
  };

  // CSV file parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const numbers: string[] = [];
        for (const row of results.data as any[]) {
          const val = row.phone || row.mobile || row.number || row.telephone || row.contact || Object.values(row)[0];
          if (val) numbers.push(String(val).trim());
        }
        setParsedRecipients(numbers);
      },
      error: () => {
        setError('Failed to parse CSV file. Ensure phone numbers are present.');
      },
    });
  };

  const segCalc = calculateSmsSegments(message);
  const totalCreditsNeeded = validationStats.valid * segCalc.creditsRequired;
  const hasEnoughCredits = (wallet?.available_credits || 0) >= totalCreditsNeeded;

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCampaignSuccess(null);

    if (validationStats.valid === 0) {
      setError('No valid Ugandan phone numbers to dispatch to.');
      return;
    }

    if (!message || message.trim() === '') {
      setError('Please compose your SMS campaign message.');
      return;
    }

    if (!hasEnoughCredits) {
      setError(
        `Insufficient credits! Required: ${totalCreditsNeeded}, Available: ${wallet?.available_credits || 0}. Please top up your wallet.`
      );
      return;
    }

    setLoading(true);

    try {
      const res = await api.sms.sendBulk({
        recipients: validationStats.validList,
        message,
        sender_id: selectedSenderId,
        campaign_name: campaignName.trim() || `Campaign ${new Date().toLocaleDateString('en-GB')}`,
        remove_duplicates: removeDuplicates,
      });

      setCampaignSuccess(res);
      await refreshWallet();
      setMessage('');
      setRawTextRecipients('');
      setParsedRecipients([]);
      setUploadedFileName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error sending bulk campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Bulk SMS Campaign Dispatcher
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Controlled batch submission with automatic Ugandan normalization and credit safety.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-500 font-mono block">Available Credits:</span>
            <span className="text-lg font-bold font-mono text-neutral-950">
              {(wallet?.available_credits ?? 0).toLocaleString()} Credits
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {campaignSuccess && (
        <div className="p-5 bg-neutral-50 border-2 border-neutral-950 space-y-3 font-mono text-xs">
          <div className="flex items-center space-x-2 text-neutral-950 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5" />
            <span>Campaign Successfully Dispatched to Gateway!</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-white border border-neutral-200">
            <div>
              <span className="text-neutral-500 block text-[10px]">Campaign Name:</span>
              <strong className="text-neutral-950">{campaignSuccess.campaign.name}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Sent Successfully:</span>
              <strong className="text-neutral-950">{campaignSuccess.summary.sentSuccessfully}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Failed / Reconciled:</span>
              <strong className="text-neutral-950">{campaignSuccess.summary.failed}</strong>
            </div>
            <div>
              <span className="text-neutral-500 block text-[10px]">Credits Deducted:</span>
              <strong className="text-neutral-950">{campaignSuccess.summary.creditsDeducted}</strong>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => onNavigate('campaigns')}
              className="text-neutral-950 font-bold underline hover:text-neutral-700"
            >
              View Campaign In Logs &rarr;
            </button>
            <button
              onClick={() => setCampaignSuccess(null)}
              className="px-3 py-1 bg-neutral-950 text-white text-[11px] cursor-pointer"
            >
              Close Summary
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleDispatch} className="space-y-6">
        {/* Campaign Info */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 pb-2 border-b border-neutral-200">
            1. Campaign Parameters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. End of Month Wholesale Discount"
                className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-800 mb-1">
                Sender ID
              </label>
              <select
                value={selectedSenderId}
                onChange={(e) => setSelectedSenderId(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
              >
                <option value="ICONSEND">ICONSEND (Platform Default)</option>
                <option value="EAGLEICON">EAGLEICON</option>
                {senderIds
                  .filter(s => s.status === 'approved' && s.sender_id !== 'ICONSEND' && s.sender_id !== 'EAGLEICON')
                  .map(s => (
                    <option key={s.id} value={s.sender_id}>{s.sender_id}</option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Recipients input */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 pb-2 border-b border-neutral-200">
            2. Recipient Phone Numbers
          </div>

          {/* Mode Switcher */}
          <div className="flex border-b border-neutral-200">
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`py-2 px-4 text-xs font-medium cursor-pointer ${
                inputMode === 'paste'
                  ? 'border-b-2 border-neutral-950 text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Paste Phone Numbers
            </button>
            <button
              type="button"
              onClick={() => setInputMode('csv')}
              className={`py-2 px-4 text-xs font-medium cursor-pointer ${
                inputMode === 'csv'
                  ? 'border-b-2 border-neutral-950 text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Upload CSV File
            </button>
            <button
              type="button"
              onClick={() => setInputMode('group')}
              className={`py-2 px-4 text-xs font-medium cursor-pointer ${
                inputMode === 'group'
                  ? 'border-b-2 border-neutral-950 text-neutral-950 font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Select Contact Group
            </button>
          </div>

          {inputMode === 'paste' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Paste Phone Numbers (one per line, or separated by commas)
              </label>
              <textarea
                rows={6}
                value={rawTextRecipients}
                onChange={(e) => setRawTextRecipients(e.target.value)}
                placeholder="0772123456&#10;0701987654&#10;+256782334455&#10;0312000000"
                className="w-full text-xs font-mono p-3 border border-neutral-300 focus:outline-none focus:border-neutral-950 bg-neutral-50"
              />
            </div>
          )}

          {inputMode === 'csv' && (
            <div className="p-6 border-2 border-dashed border-neutral-300 text-center space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-neutral-400 mx-auto" />
              <div>
                <label className="cursor-pointer bg-neutral-950 text-white px-4 py-2 text-xs font-mono font-medium hover:bg-neutral-800 inline-block">
                  <span>Select CSV File</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {uploadedFileName && (
                  <span className="block text-xs font-mono text-neutral-700 mt-2">
                    Loaded: <strong>{uploadedFileName}</strong> ({parsedRecipients.length} entries detected)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">
                CSV should contain a column titled "phone", "mobile", or "number".
              </p>
            </div>
          )}

          {inputMode === 'group' && (
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Choose Saved Contact Group
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => handleGroupSelect(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
              >
                <option value="">Select a group...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.contact_count} contacts)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Validation & Deduplication Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-200 text-xs font-mono">
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={removeDuplicates}
                onChange={(e) => setRemoveDuplicates(e.target.checked)}
                className="accent-neutral-950"
              />
              <span className="text-neutral-800">Auto-remove duplicate numbers</span>
            </label>

            {/* Validation Breakdown Pills */}
            <div className="flex items-center space-x-3 text-[11px]">
              <span>Total: <strong className="text-neutral-950">{validationStats.total}</strong></span>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-900 font-bold">Valid: {validationStats.valid}</span>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-500">Duplicates: {validationStats.duplicates}</span>
              <span className="text-neutral-300">|</span>
              <span className="text-neutral-500">Invalid: {validationStats.invalid}</span>
            </div>
          </div>
        </div>

        {/* Message Composer */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-950 pb-2 border-b border-neutral-200">
            3. Compose Message Content
          </div>

          <div>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your bulk campaign message. For promotional messages in Uganda, end with 'Reply STOP to opt out'..."
              className="w-full text-sm p-3 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-sans"
            />
            <SegmentCounter message={message} recipientCount={validationStats.valid} />
          </div>

          {/* Summary Box & Submission */}
          <div className="mt-4 p-4 bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div>
              <span className="text-neutral-500 block">Total Campaign Requirement:</span>
              <span className="text-sm font-bold text-neutral-950">
                {validationStats.valid} recipients × {segCalc.segmentCount} part/s = {totalCreditsNeeded} Credits
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || validationStats.valid === 0 || !message.trim() || !hasEnoughCredits}
              className="w-full sm:w-auto bg-neutral-950 text-white px-8 py-3 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors disabled:opacity-40 cursor-pointer inline-flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transmitting Campaign in Batches...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Confirm & Send Bulk Campaign</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
