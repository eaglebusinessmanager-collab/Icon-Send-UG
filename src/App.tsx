/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { PricingPage } from './pages/public/PricingPage';
import { FeaturesPage } from './pages/public/FeaturesPage';
import { ContactPage } from './pages/public/ContactPage';
import { FaqPage } from './pages/public/FaqPage';
import { TermsPage } from './pages/public/TermsPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';

// Customer Pages
import { DashboardPage } from './pages/customer/DashboardPage';
import { SendSmsPage } from './pages/customer/SendSmsPage';
import { BulkSmsPage } from './pages/customer/BulkSmsPage';
import { ContactsPage } from './pages/customer/ContactsPage';
import { ContactGroupsPage } from './pages/customer/ContactGroupsPage';
import { CampaignsPage } from './pages/customer/CampaignsPage';
import { MessageHistoryPage } from './pages/customer/MessageHistoryPage';
import { ReportsPage } from './pages/customer/ReportsPage';
import { BuyCreditsPage } from './pages/customer/BuyCreditsPage';
import { WalletPage } from './pages/customer/WalletPage';
import { ProfilePage } from './pages/customer/ProfilePage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminCustomersPage } from './pages/admin/AdminCustomersPage';
import { AdminSmsMonitoringPage } from './pages/admin/AdminSmsMonitoringPage';
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';
import { AdminProviderPage } from './pages/admin/AdminProviderPage';
import { AdminSenderIdsPage } from './pages/admin/AdminSenderIdsPage';
import { AdminPricingPage } from './pages/admin/AdminPricingPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center font-mono text-xs text-neutral-600">
        <div className="flex items-center space-x-2 mb-2">
          <span className="font-bold text-neutral-950 text-base">ICON SEND</span>
          <span className="text-[10px] bg-neutral-950 text-white px-1.5 py-0.5">UG</span>
        </div>
        <span>Initializing Bulk SMS gateway connection...</span>
      </div>
    );
  }

  const isPublicPage = [
    'home',
    'about',
    'pricing',
    'features',
    'contact',
    'faq',
    'terms',
    'privacy',
    'login',
    'register',
    'forgot_password',
  ].includes(currentPage);

  // If page requires auth and user is logged out, redirect to login
  if (!isPublicPage && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar currentPage="login" onNavigate={setCurrentPage} />
        <main className="flex-1">
          <LoginPage onNavigate={setCurrentPage} />
        </main>
        <Footer onNavigate={setCurrentPage} />
      </div>
    );
  }

  // Determine Title for App Header
  const getHeaderInfo = (page: string) => {
    switch (page) {
      case 'dashboard':
        return { title: 'Customer Dashboard', subtitle: 'Overview & Quick Dispatch' };
      case 'send_sms':
        return { title: 'Send Single SMS', subtitle: 'Direct Telecom Routing' };
      case 'bulk_sms':
        return { title: 'Bulk SMS Campaign Dispatcher', subtitle: 'Batch Normalized Sending' };
      case 'contacts':
        return { title: 'Contacts & Consent Book', subtitle: 'Audience Management' };
      case 'contact_groups':
        return { title: 'Contact Groups', subtitle: 'Campaign Audience Segments' };
      case 'campaigns':
        return { title: 'SMS Campaigns', subtitle: 'Broadcast History' };
      case 'message_history':
        return { title: 'Message History & Audit', subtitle: 'Carrier Delivery Receipts' };
      case 'reports':
        return { title: 'Reports & Analytics', subtitle: 'Carrier Performance' };
      case 'buy_credits':
        return { title: 'Buy SMS Credits', subtitle: 'UGX Mobile Money Top-ups' };
      case 'wallet':
        return { title: 'SMS Wallet & Ledger', subtitle: 'Transaction Accounting' };
      case 'profile':
        return { title: 'Profile & Sender IDs', subtitle: 'UCC Regulatory Desk' };
      case 'admin_overview':
        return { title: 'Administrator Overview', subtitle: 'Executive Metrics & Margins' };
      case 'admin_customers':
        return { title: 'Customer Accounts', subtitle: 'Wallets & Status Management' };
      case 'admin_monitoring':
        return { title: 'SMS Traffic Monitor', subtitle: 'Live Global Dispatch Stream' };
      case 'admin_campaigns':
        return { title: 'All Campaigns', subtitle: 'System-wide Broadcasts' };
      case 'admin_provider':
        return { title: 'SMS Gateway Provider', subtitle: 'Bulk SMS Uganda & Modular Routing' };
      case 'admin_sender_ids':
        return { title: 'Sender ID Requests', subtitle: 'UCC Review & Approvals' };
      case 'admin_pricing':
        return { title: 'Pricing & Packages', subtitle: 'UGX SMS Rates' };
      case 'admin_payments':
        return { title: 'Payment Reconciliation', subtitle: 'Mobile Money & Bank Slips' };
      case 'admin_settings':
        return { title: 'System Settings & Guide', subtitle: 'Setup & Supabase Manual' };
      default:
        return { title: 'ICON SEND UG', subtitle: 'The Eagle Icon Developers' };
    }
  };

  const headerInfo = getHeaderInfo(currentPage);

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col font-sans">
      {isPublicPage ? (
        <>
          <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
          <main className="flex-1">
            {currentPage === 'home' && <HomePage onNavigate={setCurrentPage} />}
            {currentPage === 'about' && <AboutPage onNavigate={setCurrentPage} />}
            {currentPage === 'pricing' && <PricingPage onNavigate={setCurrentPage} />}
            {currentPage === 'features' && <FeaturesPage onNavigate={setCurrentPage} />}
            {currentPage === 'contact' && <ContactPage />}
            {currentPage === 'faq' && <FaqPage />}
            {currentPage === 'terms' && <TermsPage />}
            {currentPage === 'privacy' && <PrivacyPage />}
            {currentPage === 'login' && <LoginPage onNavigate={setCurrentPage} />}
            {currentPage === 'register' && <RegisterPage onNavigate={setCurrentPage} />}
            {currentPage === 'forgot_password' && <ForgotPasswordPage onNavigate={setCurrentPage} />}
          </main>
          <Footer onNavigate={setCurrentPage} />
        </>
      ) : (
        <div className="flex-1 flex min-h-screen">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
            <Header
              title={headerInfo.title}
              subtitle={headerInfo.subtitle}
              onOpenSidebar={() => setSidebarOpen(true)}
              onNavigate={setCurrentPage}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-neutral-50/60 max-w-7xl w-full">
              {currentPage === 'dashboard' && <DashboardPage onNavigate={setCurrentPage} />}
              {currentPage === 'send_sms' && <SendSmsPage onNavigate={setCurrentPage} />}
              {currentPage === 'bulk_sms' && <BulkSmsPage onNavigate={setCurrentPage} />}
              {currentPage === 'contacts' && <ContactsPage onNavigate={setCurrentPage} />}
              {currentPage === 'contact_groups' && <ContactGroupsPage onNavigate={setCurrentPage} />}
              {currentPage === 'campaigns' && <CampaignsPage onNavigate={setCurrentPage} />}
              {currentPage === 'message_history' && <MessageHistoryPage />}
              {currentPage === 'reports' && <ReportsPage />}
              {currentPage === 'buy_credits' && <BuyCreditsPage onNavigate={setCurrentPage} />}
              {currentPage === 'wallet' && <WalletPage onNavigate={setCurrentPage} />}
              {currentPage === 'profile' && <ProfilePage />}

              {/* Admin Pages */}
              {currentPage === 'admin_overview' && <AdminOverviewPage onNavigate={setCurrentPage} />}
              {currentPage === 'admin_customers' && <AdminCustomersPage />}
              {currentPage === 'admin_monitoring' && <AdminSmsMonitoringPage />}
              {currentPage === 'admin_campaigns' && <AdminCampaignsPage />}
              {currentPage === 'admin_provider' && <AdminProviderPage />}
              {currentPage === 'admin_sender_ids' && <AdminSenderIdsPage />}
              {currentPage === 'admin_pricing' && <AdminPricingPage />}
              {currentPage === 'admin_payments' && <AdminPaymentsPage />}
              {currentPage === 'admin_settings' && <AdminSettingsPage />}
            </main>

            <footer className="border-t border-neutral-200 bg-white py-3 px-6 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between font-mono">
              <div>ICON SEND UG · Direct Telecom Route (MTN, Airtel, UTL)</div>
              <div className="font-medium text-neutral-900 mt-1 sm:mt-0">
                Powered by The Eagle Icon Developers UG
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
