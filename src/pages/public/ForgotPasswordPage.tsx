import React, { useState } from 'react';
import { api } from '../../lib/api';
import { Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

interface ForgotPasswordPageProps {
  onNavigate: (page: string) => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.forgotPassword(email);
      setMessage(res.message);
      setStep('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.auth.resetPassword({ email, password: newPassword });
      setMessage(res.message);
      setTimeout(() => {
        onNavigate('login');
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-neutral-200">
        <div>
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center space-x-1 text-xs text-neutral-500 hover:text-neutral-950 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </button>
          <h2 className="text-xl font-bold text-neutral-950">
            {step === 'request' ? 'Password Recovery' : 'Set New Password'}
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            {step === 'request'
              ? 'Enter your registered email address to receive password reset instructions.'
              : `Enter the new password for ${email}.`}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-start space-x-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {step === 'request' ? (
          <form className="space-y-4" onSubmit={handleRequest}>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                  placeholder="name@company.ug"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-950 text-white py-2.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {loading ? 'Sending Request...' : 'Send Recovery Instructions'}
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={handleReset}>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                New Password (Min. 6 characters)
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
                  placeholder="••••••••••••"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-neutral-950 text-white py-2.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              {loading ? 'Updating Password...' : 'Save New Password & Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
