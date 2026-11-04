export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  phone_number: string;
  role: 'customer' | 'admin' | 'super_admin';
  status: 'active' | 'suspended' | 'unverified';
  email_verified: boolean;
  phone_verified: boolean;
  company_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  available_credits: number;
  purchased_credits: number;
  promotional_credits: number;
  used_credits: number;
  reserved_credits: number;
  currency: 'UGX';
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  user_id: string;
  amount_credits: number;
  type: 'signup_bonus' | 'purchase' | 'sms_usage' | 'sms_refund' | 'admin_adjustment';
  description: string;
  balance_after: number;
  reference_id?: string;
  created_at: string;
}

export interface SMSMessage {
  id: string;
  user_id: string;
  campaign_id?: string;
  recipient: string;
  normalized_recipient: string;
  carrier?: string;
  message: string;
  sender_id: string;
  segments: number;
  character_count: number;
  encoding: 'GSM-7' | 'Unicode';
  credits_deducted: number;
  status: 'queued' | 'submitted' | 'sent' | 'buffered' | 'delivered' | 'failed' | 'rejected';
  provider_slug: string;
  provider_message_id?: string;
  error_message?: string;
  created_at: string;
  delivered_at?: string;
}

export interface SMSCampaign {
  id: string;
  user_id: string;
  name: string;
  message: string;
  sender_id: string;
  total_recipients: number;
  valid_recipients: number;
  invalid_recipients: number;
  duplicate_recipients: number;
  total_segments: number;
  total_credits: number;
  status: 'draft' | 'scheduled' | 'processing' | 'completed' | 'partially_delivered' | 'failed';
  scheduled_for?: string;
  created_at: string;
  completed_at?: string;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  normalized_phone: string;
  group_id?: string;
  consent_status: 'opted_in' | 'opted_out' | 'pending';
  tags: string[];
  created_at: string;
}

export interface ContactGroup {
  id: string;
  user_id: string;
  name: string;
  description: string;
  contact_count: number;
  created_at: string;
}

export interface SenderID {
  id: string;
  user_id: string;
  sender_id: string;
  status: 'pending' | 'approved' | 'rejected';
  purpose: string;
  sample_message: string;
  rejection_reason?: string;
  created_at: string;
}

export interface SMSPackage {
  id: string;
  name: string;
  price_ugx: number;
  credits: number;
  bonus_credits: number;
  rate_per_sms: number;
  is_popular: boolean;
  is_active: boolean;
  description: string;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  package_id?: string;
  amount_ugx: number;
  credits_added: number;
  payment_method: 'mtn_momo' | 'airtel_money' | 'pesapal' | 'bank_transfer' | 'cash_reconciliation';
  status: 'pending' | 'completed' | 'failed' | 'rejected';
  transaction_reference: string;
  phone_number?: string;
  notes?: string;
  approved_by_admin?: string;
  created_at: string;
}

export interface SMSProviderConfig {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  api_key: string;
  api_url: string;
  api_secret?: string;
  sender_id: string;
  balance_cached?: number;
  last_checked_at?: string;
  test_mode: boolean;
}

export interface SystemSettings {
  platform_name: string;
  support_email: string;
  whatsapp_contact: string;
  phone_contact: string;
  address_kampala: string;
  default_currency: string;
  signup_bonus_credits: number;
  free_credits_enabled: boolean;
  maintenance_mode: boolean;
  require_email_verification: boolean;
  max_bulk_batch_size: number;
  active_provider_slug: string;
  pesapal_consumer_key?: string;
  pesapal_consumer_secret?: string;
  pesapal_ipn_id?: string;
  pesapal_base_url?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
}

export interface UnsubscribeRecord {
  id: string;
  phone_number: string;
  reason?: string;
  created_at: string;
}
