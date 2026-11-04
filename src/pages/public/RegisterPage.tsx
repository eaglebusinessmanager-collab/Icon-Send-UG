import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PhoneInput } from '../../components/sms/PhoneInput';
import { Lock, Mail, User, Building, AlertCircle, CheckCircle } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (page: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!normalizedPhone) {
      setError('Please provide a valid Ugandan phone number (e.g. 0772000000).');
      return;
    }

    setLoading(true);

    try {
      await register({
        full_name: fullName,
        email,
        phone_number: normalizedPhone,
        password,
        company_name: companyName,
      });
      onNavigate('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 border border-neutral-200">
        <div>
          <div className="flex items-center space-x-2 select-none justify-center">
            <span className="font-mono text-lg font-bold tracking-tight text-neutral-950">
              ICON SEND
            </span>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 bg-neutral-950 text-white">
              UG
            </span>
          </div>
          <h2 className="mt-4 text-center text-xl font-bold text-neutral-950">
            Create Your SMS Account
          </h2>
          <p className="mt-1 text-center text-xs text-neutral-500">
            Sign up to manage and dispatch your business SMS campaigns.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs text-neutral-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Full Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                placeholder="e.g. Kasule David"
              />
              <User className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                  placeholder="name@business.ug"
                />
                <Mail className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Company / Organization
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                  placeholder="e.g. Kampala Hardware"
                />
                <Building className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          {/* Ugandan Phone Number */}
          <PhoneInput
            value={phone}
            onChange={(raw, norm) => {
              setPhone(raw);
              setNormalizedPhone(norm);
            }}
            label="Mobile Phone Number (Uganda) *"
            placeholder="0772123456 or 0701234567"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
                  placeholder="Min. 6 chars"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
                  placeholder="Re-type password"
                />
                <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-neutral-950 mt-0.5 shrink-0" />
            <span>By registering, you agree to our Terms of Service and UCC Anti-Spam Guidelines. Top up your SMS wallet via Pesapal to start messaging.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 text-white py-2.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Creating Account & Allocating Wallet...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-xs text-neutral-600">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="font-medium text-neutral-950 underline hover:text-neutral-700"
          >
            Sign In Instead
          </button>
        </div>
      </div>
    </div>
  );
};
