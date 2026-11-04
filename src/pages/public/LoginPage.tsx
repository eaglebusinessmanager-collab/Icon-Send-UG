import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // AuthContext updates user state
      onNavigate('dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError('');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 border border-neutral-200">
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
            Sign in to your SMS Account
          </h2>
          <p className="mt-1 text-center text-xs text-neutral-500">
            Access your SMS wallet, campaigns and contact database.
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
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                placeholder="you@company.ug"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot_password')}
                className="text-[11px] text-neutral-500 hover:text-neutral-950"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
                placeholder="••••••••••••"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-950 text-white py-2.5 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Quick test credentials */}
        <div className="pt-4 border-t border-neutral-200">
          <span className="block text-[11px] font-mono uppercase text-neutral-400 mb-2 text-center">
            Quick Fill Accounts for Testing
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => fillCredentials('demo@iconsend.ug', 'DemoCustomer2026!')}
              className="p-2 border border-neutral-300 hover:bg-neutral-100 text-left cursor-pointer"
            >
              <span className="font-bold block text-neutral-900">Demo Customer</span>
              <span className="text-[10px] text-neutral-500">demo@iconsend.ug</span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('eaglebusinessmanager@gmail.com', 'Admin@IconSend2026!')}
              className="p-2 border border-neutral-300 hover:bg-neutral-100 text-left cursor-pointer"
            >
              <span className="font-bold block text-neutral-900">Admin Account</span>
              <span className="text-[10px] text-neutral-500">eaglebusinessmanager@...</span>
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-600">
          Don't have an account yet?{' '}
          <button
            onClick={() => onNavigate('register')}
            className="font-medium text-neutral-950 underline hover:text-neutral-700"
          >
            Register Here
          </button>
        </div>
      </div>
    </div>
  );
};
