import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, ArrowRight } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'about', label: 'About Us' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Typographic Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer flex items-center space-x-2 select-none"
          >
            <span className="font-mono text-lg font-bold tracking-tight text-neutral-950">
              ICON SEND
            </span>
            <span className="text-[11px] font-mono font-medium px-1.5 py-0.5 bg-neutral-900 text-white">
              UG
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`text-sm transition-colors cursor-pointer ${
                  currentPage === link.id
                    ? 'font-semibold text-neutral-950 border-b-2 border-neutral-950 pb-1 -mb-1'
                    : 'text-neutral-600 hover:text-neutral-950'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <button
                onClick={() => onNavigate(user.role === 'admin' || user.role === 'super_admin' ? 'admin_overview' : 'dashboard')}
                className="inline-flex items-center space-x-2 text-sm bg-neutral-950 text-white px-4 py-2 hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('login')}
                  className="text-sm font-medium text-neutral-950 px-3 py-2 hover:bg-neutral-100 transition-colors cursor-pointer border border-transparent"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="text-sm bg-neutral-950 text-white px-4 py-2 hover:bg-neutral-800 transition-colors cursor-pointer font-medium"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-800 hover:bg-neutral-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 bg-white px-4 pt-2 pb-6 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-base py-2 border-b border-neutral-100 ${
                  currentPage === link.id ? 'font-semibold text-neutral-950' : 'text-neutral-700'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          <div className="pt-4 flex flex-col space-y-2">
            {user ? (
              <button
                onClick={() => {
                  onNavigate(user.role === 'admin' || user.role === 'super_admin' ? 'admin_overview' : 'dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-center bg-neutral-950 text-white py-2.5 text-sm font-medium"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center border border-neutral-300 py-2.5 text-sm font-medium text-neutral-900"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-center bg-neutral-950 text-white py-2.5 text-sm font-medium"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
