import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Wallet,
  WalletTransaction,
  SMSMessage,
  SMSCampaign,
  Contact,
  ContactGroup,
  SenderID,
  SMSPackage,
  PaymentTransaction,
  SMSProviderConfig,
  SystemSettings,
  NotificationItem,
  AuditLog,
  UnsubscribeRecord,
} from './types.js';

interface DatabaseSchema {
  users: User[];
  wallets: Wallet[];
  wallet_transactions: WalletTransaction[];
  sms_messages: SMSMessage[];
  sms_campaigns: SMSCampaign[];
  contacts: Contact[];
  contact_groups: ContactGroup[];
  sender_ids: SenderID[];
  sms_packages: SMSPackage[];
  payment_transactions: PaymentTransaction[];
  provider_settings: SMSProviderConfig[];
  system_settings: SystemSettings;
  notifications: NotificationItem[];
  audit_logs: AuditLog[];
  unsubscribe_records: UnsubscribeRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'iconsend_db.json');

// Password hashing helper
export function hashPassword(password: string): string {
  const salt = 'iconsend_ug_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadDatabase();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private getInitialData(): DatabaseSchema {
    const adminPasswordHash = hashPassword('Admin@IconSend2026!');
    const demoPasswordHash = hashPassword('DemoCustomer2026!');

    const adminUser: User = {
      id: 'usr_admin_001',
      email: 'eaglebusinessmanager@gmail.com',
      password_hash: adminPasswordHash,
      full_name: 'The Eagle Icon Admin',
      phone_number: '+256772000001',
      role: 'super_admin',
      status: 'active',
      email_verified: true,
      phone_verified: true,
      company_name: 'The Eagle Icon Developers UG',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const demoUser: User = {
      id: 'usr_demo_002',
      email: 'demo@iconsend.ug',
      password_hash: demoPasswordHash,
      full_name: 'Mukasa Brian',
      phone_number: '+256772123456',
      role: 'customer',
      status: 'active',
      email_verified: true,
      phone_verified: true,
      company_name: 'Kampala Retail Traders Ltd',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    const adminWallet: Wallet = {
      id: 'wal_admin_001',
      user_id: adminUser.id,
      available_credits: 10000,
      purchased_credits: 10000,
      promotional_credits: 0,
      used_credits: 240,
      reserved_credits: 0,
      currency: 'UGX',
      updated_at: new Date().toISOString(),
    };

    const demoWallet: Wallet = {
      id: 'wal_demo_002',
      user_id: demoUser.id,
      available_credits: 350,
      purchased_credits: 400,
      promotional_credits: 10,
      used_credits: 60,
      reserved_credits: 0,
      currency: 'UGX',
      updated_at: new Date().toISOString(),
    };

    const packages: SMSPackage[] = [
      {
        id: 'pkg_starter',
        name: 'Starter Tier',
        price_ugx: 5000,
        credits: 125,
        bonus_credits: 0,
        rate_per_sms: 40,
        is_popular: false,
        is_active: true,
        description: 'Ideal for small retail businesses, schools and event notifications.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'pkg_business',
        name: 'Business Growth',
        price_ugx: 10000,
        credits: 260,
        bonus_credits: 0,
        rate_per_sms: 38.5,
        is_popular: true,
        is_active: true,
        description: 'Best choice for growing SMEs, customer alerts, and promotional announcements.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'pkg_professional',
        name: 'Professional Volume',
        price_ugx: 25000,
        credits: 700,
        bonus_credits: 0,
        rate_per_sms: 35.7,
        is_popular: false,
        is_active: true,
        description: 'For corporate marketing teams and frequent bulk communication across Uganda.',
        created_at: new Date().toISOString(),
      },
      {
        id: 'pkg_enterprise',
        name: 'Enterprise Bulk',
        price_ugx: 50000,
        credits: 1500,
        bonus_credits: 0,
        rate_per_sms: 33.3,
        is_popular: false,
        is_active: true,
        description: 'Maximum cost savings for high-volume delivery, churches, SACCOs and universities.',
        created_at: new Date().toISOString(),
      },
    ];

    const contactGroups: ContactGroup[] = [
      {
        id: 'grp_001',
        user_id: demoUser.id,
        name: 'VIP Customers - Kampala',
        description: 'Frequent buyers and high-value wholesale clients',
        contact_count: 3,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'grp_002',
        user_id: demoUser.id,
        name: 'Wholesale Outlets',
        description: 'Distributors across Jinja, Mbarara and Gulu',
        contact_count: 2,
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const contacts: Contact[] = [
      {
        id: 'cnt_001',
        user_id: demoUser.id,
        name: 'Sarah Akello',
        phone_number: '0772456789',
        normalized_phone: '+256772456789',
        group_id: 'grp_001',
        consent_status: 'opted_in',
        tags: ['VIP', 'Retail'],
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cnt_002',
        user_id: demoUser.id,
        name: 'David Ochieng',
        phone_number: '0701987654',
        normalized_phone: '+256701987654',
        group_id: 'grp_001',
        consent_status: 'opted_in',
        tags: ['VIP'],
        created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cnt_003',
        user_id: demoUser.id,
        name: 'Grace Nalubega',
        phone_number: '0782334455',
        normalized_phone: '+256782334455',
        group_id: 'grp_001',
        consent_status: 'opted_in',
        tags: ['Wholesale'],
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cnt_004',
        user_id: demoUser.id,
        name: 'Patrick Byaruhanga',
        phone_number: '0754112233',
        normalized_phone: '+256754112233',
        group_id: 'grp_002',
        consent_status: 'opted_in',
        tags: ['Distributor'],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'cnt_005',
        user_id: demoUser.id,
        name: 'Florence Namutebi',
        phone_number: '0776998877',
        normalized_phone: '+256776998877',
        group_id: 'grp_002',
        consent_status: 'opted_in',
        tags: ['Distributor'],
        created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const senderIds: SenderID[] = [
      {
        id: 'sid_001',
        user_id: adminUser.id,
        sender_id: 'ICONSEND',
        status: 'approved',
        purpose: 'Default platform sender ID for official system alerts and customer campaigns',
        sample_message: 'Your ICON SEND UG verification code is 4829. Valid for 10 minutes.',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sid_002',
        user_id: adminUser.id,
        sender_id: 'EAGLEICON',
        status: 'approved',
        purpose: 'The Eagle Icon Developers corporate brand notifications',
        sample_message: 'Update from The Eagle Icon Developers regarding your enterprise service tier.',
        created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sid_003',
        user_id: demoUser.id,
        sender_id: 'KAMPTRADERS',
        status: 'approved',
        purpose: 'Store receipts and flash sale alerts for Kampala Traders clients',
        sample_message: 'Kampala Traders: New stock of kitchenware has arrived at Luwum St branch.',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const campaigns: SMSCampaign[] = [
      {
        id: 'cmp_001',
        user_id: demoUser.id,
        name: 'End of Month Flash Sale',
        message: 'Dear Customer, enjoy 15% discount on all wholesale items this weekend at Kampala Traders. Reply STOP to opt out.',
        sender_id: 'KAMPTRADERS',
        total_recipients: 50,
        valid_recipients: 50,
        invalid_recipients: 0,
        duplicate_recipients: 0,
        total_segments: 50,
        total_credits: 50,
        status: 'completed',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 45000).toISOString(),
      },
    ];

    const messages: SMSMessage[] = [
      {
        id: 'msg_001',
        user_id: demoUser.id,
        campaign_id: 'cmp_001',
        recipient: '0772456789',
        normalized_recipient: '+256772456789',
        carrier: 'MTN Uganda',
        message: 'Dear Customer, enjoy 15% discount on all wholesale items this weekend at Kampala Traders. Reply STOP to opt out.',
        sender_id: 'KAMPTRADERS',
        segments: 1,
        character_count: 114,
        encoding: 'GSM-7',
        credits_deducted: 1,
        status: 'delivered',
        provider_slug: 'bulksmsuganda',
        provider_message_id: 'bsmsug_seed_901',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 8000).toISOString(),
      },
      {
        id: 'msg_002',
        user_id: demoUser.id,
        campaign_id: 'cmp_001',
        recipient: '0701987654',
        normalized_recipient: '+256701987654',
        carrier: 'Airtel Uganda',
        message: 'Dear Customer, enjoy 15% discount on all wholesale items this weekend at Kampala Traders. Reply STOP to opt out.',
        sender_id: 'KAMPTRADERS',
        segments: 1,
        character_count: 114,
        encoding: 'GSM-7',
        credits_deducted: 1,
        status: 'delivered',
        provider_slug: 'bulksmsuganda',
        provider_message_id: 'bsmsug_seed_902',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        delivered_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 12000).toISOString(),
      },
      {
        id: 'msg_003',
        user_id: demoUser.id,
        recipient: '0782334455',
        normalized_recipient: '+256782334455',
        carrier: 'MTN Uganda',
        message: 'Your payment of UGX 150,000 has been received. Order #8921 is being prepared for dispatch.',
        sender_id: 'KAMPTRADERS',
        segments: 1,
        character_count: 94,
        encoding: 'GSM-7',
        credits_deducted: 1,
        status: 'delivered',
        provider_slug: 'bulksmsuganda',
        provider_message_id: 'bsmsug_seed_903',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        delivered_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 4000).toISOString(),
      },
    ];

    const walletTransactions: WalletTransaction[] = [
      {
        id: 'wtx_001',
        wallet_id: demoWallet.id,
        user_id: demoUser.id,
        amount_credits: 10,
        type: 'signup_bonus',
        description: 'Free onboarding trial credits for new verified customer',
        balance_after: 10,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wtx_002',
        wallet_id: demoWallet.id,
        user_id: demoUser.id,
        amount_credits: 400,
        type: 'purchase',
        description: 'Purchased Business Growth package via MTN Mobile Money',
        balance_after: 410,
        reference_id: 'TXN-MOMO-781920',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wtx_003',
        wallet_id: demoWallet.id,
        user_id: demoUser.id,
        amount_credits: -50,
        type: 'sms_usage',
        description: 'Dispatched campaign: End of Month Flash Sale',
        balance_after: 360,
        reference_id: 'cmp_001',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wtx_004',
        wallet_id: demoWallet.id,
        user_id: demoUser.id,
        amount_credits: -1,
        type: 'sms_usage',
        description: 'Single SMS dispatched to +256782334455',
        balance_after: 359,
        reference_id: 'msg_003',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const paymentTransactions: PaymentTransaction[] = [
      {
        id: 'ptx_001',
        user_id: demoUser.id,
        package_id: 'pkg_business',
        amount_ugx: 10000,
        credits_added: 400,
        payment_method: 'mtn_momo',
        status: 'completed',
        transaction_reference: 'TXN-MOMO-781920',
        phone_number: '0772123456',
        notes: 'Automated Instant Push Confirmation',
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const notifications: NotificationItem[] = [
      {
        id: 'notif_001',
        user_id: demoUser.id,
        title: 'Welcome to ICON SEND UG',
        message: 'Your account is ready. Top up your SMS wallet via Pesapal to start dispatching business SMS campaigns immediately.',
        type: 'success',
        is_read: false,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_002',
        user_id: demoUser.id,
        title: 'Credit Top-up Successful',
        message: 'UGX 10,000 payment verified. 400 SMS credits have been added to your balance.',
        type: 'info',
        is_read: true,
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'notif_003',
        user_id: demoUser.id,
        title: 'Campaign Completed',
        message: 'End of Month Flash Sale finished sending. 50/50 messages delivered successfully.',
        type: 'success',
        is_read: true,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    const providers: SMSProviderConfig[] = [
      {
        id: 'prov_bulksmsuganda',
        name: 'Bulk SMS Uganda',
        slug: 'bulksmsuganda',
        is_active: true,
        api_key: process.env.BULKSMSUG_API_KEY || '',
        api_url: 'https://app.bulksmsug.com',
        sender_id: 'ICONSEND',
        balance_cached: 2500,
        test_mode: false,
      },
      {
        id: 'prov_africastalking',
        name: "Africa's Talking",
        slug: 'africastalking',
        is_active: false,
        api_key: '',
        api_url: 'https://api.africastalking.com/version1/messaging',
        api_secret: '',
        sender_id: 'ICONSEND',
        balance_cached: 1800,
        test_mode: true,
      },
      {
        id: 'prov_generic',
        name: 'Custom HTTP Gateway / SMPP',
        slug: 'generic_http',
        is_active: false,
        api_key: '',
        api_url: '',
        sender_id: 'ICONSEND',
        balance_cached: 5000,
        test_mode: true,
      },
    ];

    const systemSettings: SystemSettings = {
      platform_name: 'ICON SEND UG',
      support_email: 'support@iconsend.ug',
      whatsapp_contact: '+256772000001',
      phone_contact: '+256772000001',
      address_kampala: 'Plot 14 Kampala Road, Central Division, Kampala, Uganda',
      default_currency: 'UGX',
      signup_bonus_credits: 0,
      free_credits_enabled: false,
      maintenance_mode: false,
      require_email_verification: false,
      max_bulk_batch_size: 1000,
      active_provider_slug: 'bulksmsuganda',
      pesapal_consumer_key: process.env.PESAPAL_CONSUMER_KEY || '',
      pesapal_consumer_secret: process.env.PESAPAL_CONSUMER_SECRET || '',
      pesapal_ipn_id: process.env.PESAPAL_IPN_ID || '',
      pesapal_base_url: 'https://pay.pesapal.com/v3',
    };

    const auditLogs: AuditLog[] = [
      {
        id: 'aud_001',
        admin_id: adminUser.id,
        admin_email: adminUser.email,
        action: 'SYSTEM_BOOTSTRAP',
        target_type: 'SYSTEM',
        target_id: 'INIT',
        details: { message: 'Initialized ICON SEND UG database and default settings' },
        ip_address: '127.0.0.1',
        created_at: new Date().toISOString(),
      },
    ];

    return {
      users: [adminUser, demoUser],
      wallets: [adminWallet, demoWallet],
      wallet_transactions: walletTransactions,
      sms_messages: messages,
      sms_campaigns: campaigns,
      contacts,
      contact_groups: contactGroups,
      sender_ids: senderIds,
      sms_packages: packages,
      payment_transactions: paymentTransactions,
      provider_settings: providers,
      system_settings: systemSettings,
      notifications,
      audit_logs: auditLogs,
      unsubscribe_records: [],
    };
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw) as DatabaseSchema;
        // Merge missing fields if any
        const initial = this.getInitialData();
        const loadedSettings: SystemSettings = {
          ...initial.system_settings,
          ...(parsed.system_settings || {}),
          signup_bonus_credits: 0,
          free_credits_enabled: false,
        };
        return {
          ...initial,
          ...parsed,
          system_settings: loadedSettings,
        };
      }
    } catch (err) {
      console.error('Error loading database file, initializing fresh store:', err);
    }
    const initial = this.getInitialData();
    this.persist(initial);
    return initial;
  }

  public persist(data?: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const payload = JSON.stringify(data || this.data, null, 2);
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, payload, 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // Accessors
  public getUsers() { return this.data.users; }
  public getWallets() { return this.data.wallets; }
  public getWalletTransactions() { return this.data.wallet_transactions; }
  public getMessages() { return this.data.sms_messages; }
  public getCampaigns() { return this.data.sms_campaigns; }
  public getContacts() { return this.data.contacts; }
  public getContactGroups() { return this.data.contact_groups; }
  public getSenderIds() { return this.data.sender_ids; }
  public getPackages() { return this.data.sms_packages; }
  public getPaymentTransactions() { return this.data.payment_transactions; }
  public getProviderSettings() { return this.data.provider_settings; }
  public getSystemSettings() { return this.data.system_settings; }
  public getNotifications() { return this.data.notifications; }
  public getAuditLogs() { return this.data.audit_logs; }
  public getUnsubscribeRecords() { return this.data.unsubscribe_records; }

  // User queries
  public findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  }

  public createUser(user: User, initialCredits: number = 0): { user: User; wallet: Wallet } {
    this.data.users.push(user);

    const wallet: Wallet = {
      id: `wal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: user.id,
      available_credits: initialCredits,
      purchased_credits: 0,
      promotional_credits: 0,
      used_credits: 0,
      reserved_credits: 0,
      currency: 'UGX',
      updated_at: new Date().toISOString(),
    };
    this.data.wallets.push(wallet);

    if (initialCredits > 0) {
      const tx: WalletTransaction = {
        id: `wtx_${Date.now()}_bonus`,
        wallet_id: wallet.id,
        user_id: user.id,
        amount_credits: initialCredits,
        type: 'signup_bonus',
        description: `Welcome bonus: ${initialCredits} promotional SMS credits`,
        balance_after: initialCredits,
        created_at: new Date().toISOString(),
      };
      this.data.wallet_transactions.push(tx);
    }

    // Welcome notification
    this.createNotification(
      user.id,
      'Welcome to ICON SEND UG',
      `Your account is ready. Purchase SMS credits via Pesapal to start dispatching single or bulk SMS.`,
      'success'
    );

    this.persist();
    return { user, wallet };
  }

  public updateUser(userId: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      this.data.users[idx] = {
        ...this.data.users[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.persist();
      return this.data.users[idx];
    }
    return null;
  }

  // Wallet and credit transactional engine
  public getWalletByUserId(userId: string): Wallet | undefined {
    let wallet = this.data.wallets.find(w => w.user_id === userId);
    if (!wallet) {
      wallet = {
        id: `wal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        available_credits: 0,
        purchased_credits: 0,
        promotional_credits: 0,
        used_credits: 0,
        reserved_credits: 0,
        currency: 'UGX',
        updated_at: new Date().toISOString(),
      };
      this.data.wallets.push(wallet);
      this.persist();
    }
    return wallet;
  }

  /**
   * Two-phase credit reservation to prevent double deduction
   */
  public reserveCredits(userId: string, creditsNeeded: number): boolean {
    const wallet = this.getWalletByUserId(userId);
    if (!wallet) return false;

    if (wallet.available_credits < creditsNeeded) {
      return false;
    }

    wallet.available_credits -= creditsNeeded;
    wallet.reserved_credits += creditsNeeded;
    wallet.updated_at = new Date().toISOString();
    this.persist();
    return true;
  }

  /**
   * Commits deduction when sending succeeds
   */
  public commitDeduction(
    userId: string,
    creditsToDeduct: number,
    description: string,
    referenceId?: string
  ): boolean {
    const wallet = this.getWalletByUserId(userId);
    if (!wallet) return false;

    // Deduct from reserved
    wallet.reserved_credits = Math.max(0, wallet.reserved_credits - creditsToDeduct);
    wallet.used_credits += creditsToDeduct;
    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: wallet.id,
      user_id: userId,
      amount_credits: -creditsToDeduct,
      type: 'sms_usage',
      description,
      balance_after: wallet.available_credits,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };
    this.data.wallet_transactions.unshift(tx);
    this.persist();
    return true;
  }

  /**
   * Releases reserved credits if sending fails
   */
  public releaseReservedCredits(userId: string, creditsToRelease: number) {
    const wallet = this.getWalletByUserId(userId);
    if (!wallet) return;

    const actualRelease = Math.min(wallet.reserved_credits, creditsToRelease);
    wallet.reserved_credits -= actualRelease;
    wallet.available_credits += actualRelease;
    wallet.updated_at = new Date().toISOString();
    this.persist();
  }

  /**
   * Adds credits to customer wallet (Purchase, Refund, Bonus, or Admin adjustment)
   */
  public addCredits(
    userId: string,
    creditsToAdd: number,
    type: 'purchase' | 'signup_bonus' | 'sms_refund' | 'admin_adjustment',
    description: string,
    referenceId?: string
  ): Wallet {
    const wallet = this.getWalletByUserId(userId)!;
    wallet.available_credits += creditsToAdd;

    if (type === 'purchase') {
      wallet.purchased_credits += creditsToAdd;
    } else if (type === 'signup_bonus') {
      wallet.promotional_credits += creditsToAdd;
    }

    wallet.updated_at = new Date().toISOString();

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      wallet_id: wallet.id,
      user_id: userId,
      amount_credits: creditsToAdd,
      type,
      description,
      balance_after: wallet.available_credits,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
    };
    this.data.wallet_transactions.unshift(tx);
    this.persist();
    return wallet;
  }

  // Notification helper
  public createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'alert' = 'info'
  ) {
    const item: NotificationItem = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.data.notifications.unshift(item);
    this.persist();
    return item;
  }

  // Audit Log helper
  public logAudit(
    adminId: string,
    adminEmail: string,
    action: string,
    targetType: string,
    targetId: string,
    details: Record<string, unknown>,
    ip: string = '127.0.0.1'
  ) {
    const log: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      admin_id: adminId,
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
      ip_address: ip,
      created_at: new Date().toISOString(),
    };
    this.data.audit_logs.unshift(log);
    this.persist();
    return log;
  }

  // Unsubscribe management
  public isUnsubscribed(phone: string): boolean {
    const clean = phone.replace(/[\s\-().+]/g, '');
    return this.data.unsubscribe_records.some(r => r.phone_number.replace(/[\s\-().+]/g, '') === clean);
  }

  public addUnsubscribe(phone: string, reason: string = 'User requested opt-out'): void {
    if (!this.isUnsubscribed(phone)) {
      this.data.unsubscribe_records.push({
        id: `unsub_${Date.now()}`,
        phone_number: phone,
        reason,
        created_at: new Date().toISOString(),
      });
      this.persist();
    }
  }
}

export const db = new Database();
