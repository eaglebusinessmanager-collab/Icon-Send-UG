import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { SenderID } from '../../types';
import { User, Lock, BadgeCheck, AlertCircle, CheckCircle2, Shield } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [companyName, setCompanyName] = useState(user?.company_name || '');
  const [profileMsg, setProfileMsg] = useState('');

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordErr, setPasswordErr] = useState('');

  // Sender IDs
  const [senderIds, setSenderIds] = useState<SenderID[]>([]);
  const [newSenderId, setNewSenderId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [sampleMessage, setSampleMessage] = useState('');
  const [senderIdMsg, setSenderIdMsg] = useState('');
  const [senderIdErr, setSenderIdErr] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    api.senderIds.list().then(setSenderIds).catch(console.error);
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      await api.auth.updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        company_name: companyName,
      });
      await refreshUser();
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(''), 4000);
    } catch {
      setProfileMsg('Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg('');
    setPasswordErr('');

    if (newPassword !== confirmPassword) {
      setPasswordErr('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErr('Password must be at least 6 characters');
      return;
    }

    try {
      if (user?.email) {
        await api.auth.resetPassword({ email: user.email, password: newPassword });
        setPasswordMsg('Password changed successfully.');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMsg(''), 4000);
      }
    } catch {
      setPasswordErr('Failed to update password');
    }
  };

  const handleRequestSenderId = async (e: React.FormEvent) => {
    e.preventDefault();
    setSenderIdMsg('');
    setSenderIdErr('');

    const clean = newSenderId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length < 3 || clean.length > 11) {
      setSenderIdErr('Sender ID must be between 3 and 11 alphanumeric characters.');
      return;
    }

    setRequesting(true);
    try {
      const res = await api.senderIds.request({
        sender_id: clean,
        purpose,
        sample_message: sampleMessage,
      });
      setSenderIdMsg(res.message);
      setNewSenderId('');
      setPurpose('');
      setSampleMessage('');
      const updated = await api.senderIds.list();
      setSenderIds(updated);
    } catch (err: unknown) {
      setSenderIdErr(err instanceof Error ? err.message : 'Error submitting request');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
          Account Profile & Sender ID Registrations
        </h2>
        <p className="text-xs text-neutral-500 font-mono mt-0.5">
          Manage your organization details, security credentials, and UCC-approved Sender IDs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info Form */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Personal & Company Information
            </span>
            <span className="text-[11px] font-mono text-neutral-500">{user?.role}</span>
          </div>

          {profileMsg && (
            <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
              {profileMsg}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-700 font-medium mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-neutral-500 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1">Registered Phone Number</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1">Company / Brand Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Kampala Retail Traders"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="bg-neutral-950 text-white px-4 py-2 font-mono font-medium hover:bg-neutral-800 transition-colors"
              >
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white border border-neutral-200 p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-neutral-200">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900">
              Security & Credentials
            </span>
          </div>

          {passwordMsg && (
            <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
              {passwordMsg}
            </div>
          )}

          {passwordErr && (
            <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
              {passwordErr}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div>
              <label className="block text-neutral-700 font-medium mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm"
              />
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 text-neutral-500 text-[11px] leading-relaxed">
              Passwords are salted and hashed using PBKDF2 with SHA-512. Never share your password or API access tokens.
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="border border-neutral-900 text-neutral-950 px-4 py-2 font-mono font-medium hover:bg-neutral-900 hover:text-white transition-colors"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sender ID Management Section */}
      <div className="bg-white border border-neutral-200 p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
          <div>
            <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
              Alphanumeric Sender IDs (UCC Regulatory Desk)
            </h3>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Custom brand names replacing phone numbers on customer handsets (max 11 characters).
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800">
            Regulatory Body: UCC Uganda
          </span>
        </div>

        {/* Existing Sender IDs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Sender ID</th>
                <th className="p-3">Intended Business Purpose</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {senderIds.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-950 text-sm">{s.sender_id}</td>
                  <td className="p-3 text-neutral-700 font-sans">{s.purpose}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase ${
                        s.status === 'approved'
                          ? 'bg-neutral-950 text-white'
                          : s.status === 'rejected'
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-300'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-neutral-400 text-[10px]">
                    {new Date(s.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Request New Sender ID Form */}
        <div className="pt-4 border-t border-neutral-200">
          <h4 className="text-xs font-mono font-bold uppercase text-neutral-900 mb-3">
            Request New Alphanumeric Sender ID
          </h4>

          {senderIdMsg && (
            <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900 mb-3">
              {senderIdMsg}
            </div>
          )}

          {senderIdErr && (
            <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900 mb-3">
              {senderIdErr}
            </div>
          )}

          <form onSubmit={handleRequestSenderId} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-700 font-medium mb-1">
                  Requested Sender ID (3 to 11 characters) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={11}
                  value={newSenderId}
                  onChange={(e) => setNewSenderId(e.target.value.toUpperCase())}
                  placeholder="e.g. KAMPTRADERS"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono text-sm tracking-widest font-bold"
                />
                <span className="text-[10px] text-neutral-400 mt-0.5 block font-mono">
                  {newSenderId.length} / 11 characters (letters and numbers only)
                </span>
              </div>

              <div>
                <label className="block text-neutral-700 font-medium mb-1">
                  Business Purpose / Registration *
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Wholesale order receipts & promotions"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-700 font-medium mb-1">
                Sample Message to be sent under this Sender ID *
              </label>
              <textarea
                rows={2}
                required
                value={sampleMessage}
                onChange={(e) => setSampleMessage(e.target.value)}
                placeholder="e.g. Dear Customer, your order has arrived at Luwum St branch. Reply STOP to opt out."
                className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-sans text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={requesting}
              className="bg-neutral-950 text-white px-5 py-2 text-xs font-mono font-medium hover:bg-neutral-800 disabled:opacity-40 cursor-pointer"
            >
              {requesting ? 'Submitting to UCC Desk...' : 'Submit Sender ID for Approval'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
