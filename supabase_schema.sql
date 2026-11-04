-- =====================================================================
-- ICON SEND UG - Production Supabase PostgreSQL Database Schema
-- Platform Owner: The Eagle Icon Developers UG
-- Description: Complete schema for Users, Wallets, Modular SMS Providers,
--              Bulk Campaigns, Contacts, Sender IDs, Payments & Audits.
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS & PROFILES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'super_admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'unverified')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    company_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    business_type VARCHAR(100),
    national_id_or_nin VARCHAR(100),
    tin_number VARCHAR(100),
    address_line TEXT,
    city VARCHAR(100) DEFAULT 'Kampala',
    country VARCHAR(100) DEFAULT 'Uganda',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WALLETS & LEDGER TRANSACTIONS
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    available_credits INTEGER NOT NULL DEFAULT 0 CHECK (available_credits >= 0),
    purchased_credits INTEGER NOT NULL DEFAULT 0,
    promotional_credits INTEGER NOT NULL DEFAULT 0,
    used_credits INTEGER NOT NULL DEFAULT 0,
    reserved_credits INTEGER NOT NULL DEFAULT 0 CHECK (reserved_credits >= 0),
    currency VARCHAR(10) DEFAULT 'UGX',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_credits INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('signup_bonus', 'purchase', 'sms_usage', 'sms_refund', 'admin_adjustment')),
    description TEXT NOT NULL,
    balance_after INTEGER NOT NULL,
    reference_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MODULAR SMS PROVIDERS & GATEWAY SETTINGS
CREATE TABLE IF NOT EXISTS sms_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_slug VARCHAR(50) UNIQUE NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    api_url TEXT,
    sender_id VARCHAR(50) DEFAULT 'ICONSEND',
    balance_cached NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    test_mode BOOLEAN DEFAULT FALSE,
    last_checked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONTACT GROUPS & CONTACTS
CREATE TABLE IF NOT EXISTS contact_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    contact_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    normalized_phone VARCHAR(50) NOT NULL,
    group_id UUID REFERENCES contact_groups(id) ON DELETE SET NULL,
    consent_status VARCHAR(50) DEFAULT 'opted_in' CHECK (consent_status IN ('opted_in', 'opted_out', 'pending')),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SENDER IDS (UCC Approval Workflow)
CREATE TABLE IF NOT EXISTS sender_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_id VARCHAR(11) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    purpose TEXT NOT NULL,
    sample_message TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SMS CAMPAIGNS & RECIPIENTS
CREATE TABLE IF NOT EXISTS sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    total_recipients INTEGER DEFAULT 0,
    valid_recipients INTEGER DEFAULT 0,
    invalid_recipients INTEGER DEFAULT 0,
    duplicate_recipients INTEGER DEFAULT 0,
    total_segments INTEGER DEFAULT 0,
    total_credits INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'processing', 'completed', 'partially_delivered', 'failed')),
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
    recipient VARCHAR(50) NOT NULL,
    normalized_recipient VARCHAR(50) NOT NULL,
    carrier VARCHAR(100),
    message TEXT NOT NULL,
    sender_id VARCHAR(50) NOT NULL,
    segments INTEGER DEFAULT 1,
    character_count INTEGER NOT NULL,
    encoding VARCHAR(20) DEFAULT 'GSM-7' CHECK (encoding IN ('GSM-7', 'Unicode')),
    credits_deducted INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('queued', 'submitted', 'sent', 'buffered', 'delivered', 'failed', 'rejected')),
    provider_slug VARCHAR(50) NOT NULL,
    provider_message_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ
);

-- 8. PACKAGES & PAYMENTS (UGX Currency)
CREATE TABLE IF NOT EXISTS sms_packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price_ugx NUMERIC NOT NULL,
    credits INTEGER NOT NULL,
    bonus_credits INTEGER DEFAULT 0,
    rate_per_sms NUMERIC NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_id VARCHAR(50) REFERENCES sms_packages(id),
    amount_ugx NUMERIC NOT NULL,
    credits_added INTEGER NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('mtn_momo', 'airtel_money', 'pesapal', 'bank_transfer', 'cash_reconciliation')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'rejected')),
    transaction_reference VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(50),
    notes TEXT,
    approved_by_admin UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. NOTIFICATIONS & AUDIT LOGS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'alert')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    admin_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unsubscribe_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(50) UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id ON sms_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_campaign ON sms_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_sms_messages_status ON sms_messages(status);
CREATE INDEX IF NOT EXISTS idx_sms_messages_created_at ON sms_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(normalized_phone);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON sms_campaigns(user_id);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper policy: users can only read and manage their own resources
CREATE POLICY "Users can manage own record" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users view own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users view own wallet transactions" ON wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users manage own contacts" ON contacts
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own contact groups" ON contact_groups
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own campaigns" ON sms_campaigns
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users view own messages" ON sms_messages
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- 12. INITIAL SEED DATA
INSERT INTO sms_packages (id, name, price_ugx, credits, bonus_credits, rate_per_sms, is_popular, is_active, description)
VALUES 
    ('pkg_starter', 'Starter Tier', 5000, 125, 5, 40, false, true, 'Small businesses, schools and event notifications.'),
    ('pkg_business', 'Business Growth', 10000, 260, 20, 38.5, true, true, 'Growing SMEs, alerts and customer promos.'),
    ('pkg_professional', 'Professional Volume', 25000, 700, 60, 35.7, false, true, 'High volume retail, SACCOs, corporate alerts.'),
    ('pkg_enterprise', 'Enterprise Bulk', 50000, 1500, 150, 33.3, false, true, 'Churches, universities, marketing agencies.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sms_providers (name, slug, is_active, is_default, description)
VALUES
    ('Bulk SMS Uganda', 'bulksmsuganda', true, true, 'Initial primary gateway providing direct telecom routing to MTN, Airtel, UTL and Lyca.'),
    ('Africa''s Talking', 'africastalking', false, false, 'Alternative regional East African SMS gateway adapter.'),
    ('Custom HTTP Gateway', 'generic_http', false, false, 'Pluggable REST/SMPP webhook integration for custom telecommunications hubs.')
ON CONFLICT (slug) DO NOTHING;
