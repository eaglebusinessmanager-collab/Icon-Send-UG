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
  NotificationItem,
  SystemSettings,
  SMSProviderConfig,
} from '../types';

const TOKEN_KEY = 'iconsend_auth_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { error: text || 'An unexpected server error occurred' };
  }

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  // Auth
  auth: {
    login: (credentials: { email: string; password: string }) =>
      request<{ user: User; wallet: Wallet; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (payload: {
      full_name: string;
      email: string;
      phone_number: string;
      password: string;
      company_name?: string;
    }) =>
      request<{ user: User; wallet: Wallet; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    me: () => request<{ user: User; wallet: Wallet }>('/api/auth/me'),
    forgotPassword: (email: string) =>
      request<{ message: string; debugCode?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (payload: { email: string; password: string }) =>
      request<{ message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    updateProfile: (profile: Partial<User>) =>
      request<{ message: string; user: User }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(profile),
      }),
  },

  // SMS
  sms: {
    validateNumber: (phone: string) =>
      request<{ isValid: boolean; normalized: string; carrier: string; error?: string; isUnsubscribed: boolean }>(
        '/api/sms/validate-number',
        { method: 'POST', body: JSON.stringify({ phone }) }
      ),
    calculateSegments: (message: string) =>
      request<{
        characterCount: number;
        encoding: 'GSM-7' | 'Unicode';
        segmentCount: number;
        maxCharsPerSegment: number;
        charsLeftInCurrentSegment: number;
        creditsRequired: number;
      }>('/api/sms/calculate-segments', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    sendSingle: (payload: { recipient: string; message: string; sender_id?: string }) =>
      request<{ success: boolean; data: SMSMessage; wallet: Wallet }>('/api/sms/send-single', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    sendBulk: (payload: {
      recipients: string[] | string;
      message: string;
      sender_id?: string;
      campaign_name?: string;
      remove_duplicates?: boolean;
    }) =>
      request<{
        success: boolean;
        campaign: SMSCampaign;
        summary: {
          totalInput: number;
          valid: number;
          invalid: number;
          duplicates: number;
          sentSuccessfully: number;
          failed: number;
          creditsDeducted: number;
          creditsRefunded: number;
        };
        wallet: Wallet;
      }>('/api/sms/send-bulk', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getMessages: (params: { status?: string; search?: string; campaign_id?: string; limit?: number; offset?: number } = {}) => {
      const q = new URLSearchParams();
      if (params.status) q.append('status', params.status);
      if (params.search) q.append('search', params.search);
      if (params.campaign_id) q.append('campaign_id', params.campaign_id);
      if (params.limit) q.append('limit', String(params.limit));
      if (params.offset) q.append('offset', String(params.offset));
      return request<{ total: number; limit: number; offset: number; messages: SMSMessage[] }>(
        `/api/sms/messages?${q.toString()}`
      );
    },
    checkSingleStatus: (id: string) => request<SMSMessage>(`/api/sms/messages/${id}/status`),
    syncDeliveryStatus: () => request<{ checked: number; updated: number }>('/api/sms/check-delivery', { method: 'POST' }),
    optOut: (phoneNumber: string, reason?: string) =>
      request<{ message: string }>('/api/sms/opt-out', {
        method: 'POST',
        body: JSON.stringify({ phone_number: phoneNumber, reason }),
      }),
  },

  // Campaigns
  campaigns: {
    list: () => request<SMSCampaign[]>('/api/campaigns'),
    get: (id: string) =>
      request<{
        campaign: SMSCampaign;
        messages: SMSMessage[];
        stats: { total: number; delivered: number; pending: number; failed: number; deliveryRate: number };
      }>(`/api/campaigns/${id}`),
    createDraft: (payload: Partial<SMSCampaign>) =>
      request<SMSCampaign>('/api/campaigns', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    delete: (id: string) => request<{ message: string }>(`/api/campaigns/${id}`, { method: 'DELETE' }),
  },

  // Contacts
  contacts: {
    list: (params: { group_id?: string; search?: string; consent?: string } = {}) => {
      const q = new URLSearchParams();
      if (params.group_id) q.append('group_id', params.group_id);
      if (params.search) q.append('search', params.search);
      if (params.consent) q.append('consent', params.consent);
      return request<Contact[]>(`/api/contacts?${q.toString()}`);
    },
    create: (payload: { name: string; phone_number: string; group_id?: string; consent_status?: string; tags?: string[] }) =>
      request<Contact>('/api/contacts', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id: string, payload: Partial<Contact>) =>
      request<Contact>(`/api/contacts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    delete: (id: string) => request<{ message: string }>(`/api/contacts/${id}`, { method: 'DELETE' }),
    importCsv: (payload: { rows: any[]; group_id?: string; default_consent?: string }) =>
      request<{ message: string; summary: { imported: number; skipped: number; duplicates: number } }>(
        '/api/contacts/import-csv',
        { method: 'POST', body: JSON.stringify(payload) }
      ),
    groups: () => request<ContactGroup[]>('/api/contacts/groups'),
    createGroup: (payload: { name: string; description?: string }) =>
      request<ContactGroup>('/api/contacts/groups', { method: 'POST', body: JSON.stringify(payload) }),
    deleteGroup: (id: string) => request<{ message: string }>(`/api/contacts/groups/${id}`, { method: 'DELETE' }),
  },

  // Wallet
  wallet: {
    get: () => request<{ wallet: Wallet; transactions: WalletTransaction[] }>('/api/wallet'),
    packages: () => request<SMSPackage[]>('/api/wallet/packages'),
    checkout: (payload: {
      package_id?: string;
      payment_method: string;
      phone_number?: string;
      notes?: string;
      amount?: number;
      credits?: number;
    }) =>
      request<{
        success: boolean;
        message: string;
        transaction: PaymentTransaction;
        wallet: Wallet;
      }>('/api/wallet/checkout', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    initiatePesapal: (payload: { package_id?: string; custom_amount?: number; custom_credits?: number; callback_url?: string }) =>
      request<{
        success: boolean;
        orderTrackingId: string;
        redirectUrl: string;
        merchantReference: string;
        transaction: PaymentTransaction;
        isSimulated?: boolean;
      }>('/api/wallet/pesapal/initiate', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    verifyPesapal: (orderTrackingId: string) =>
      request<{
        success: boolean;
        message: string;
        transaction: PaymentTransaction;
        wallet?: Wallet;
        status?: string;
      }>(`/api/wallet/pesapal/verify?orderTrackingId=${encodeURIComponent(orderTrackingId)}`),
    transactions: () => request<WalletTransaction[]>('/api/wallet/transactions'),
    payments: () => request<PaymentTransaction[]>('/api/wallet/payments'),
  },

  // Sender IDs
  senderIds: {
    list: () => request<SenderID[]>('/api/sender-ids'),
    request: (payload: { sender_id: string; purpose: string; sample_message?: string }) =>
      request<{ message: string; senderId: SenderID }>('/api/sender-ids/request', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  },

  // Notifications
  notifications: {
    list: () => request<NotificationItem[]>('/api/notifications'),
    markRead: (id: string) => request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request<{ success: boolean }>('/api/notifications/read-all', { method: 'PUT' }),
  },

  // Admin
  admin: {
    overview: () =>
      request<{
        metrics: {
          totalCustomers: number;
          activeCustomers: number;
          totalSmsSubmitted: number;
          delivered: number;
          failed: number;
          pending: number;
          totalCreditsSold: number;
          totalRevenueUgx: number;
          estimatedGatewayExpenditure: number;
          grossMargin: number;
          grossMarginPercentage: number;
          activeProviderSlug: string;
          providerCredits?: number;
        };
        recentTransactions: PaymentTransaction[];
        recentCampaigns: SMSCampaign[];
        recentMessages: SMSMessage[];
      }>('/api/admin/overview'),
    customers: () =>
      request<
        Array<{
          user: User;
          wallet?: Wallet;
          stats: { totalMessagesSent: number; delivered: number };
        }>
      >('/api/admin/customers'),
    updateCustomerStatus: (id: string, payload: { status: 'active' | 'suspended'; reason?: string }) =>
      request<{ message: string; user: User }>(`/api/admin/customers/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    adjustCredits: (id: string, payload: { amount_credits: number; reason: string }) =>
      request<{ message: string; wallet: Wallet }>(`/api/admin/customers/${id}/adjust-credits`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    smsMonitoring: () => request<SMSMessage[]>('/api/admin/sms-monitoring'),
    providers: () =>
      request<
        Array<{
          slug: string;
          name: string;
          isActive: boolean;
          config: SMSProviderConfig;
        }>
      >('/api/admin/providers'),
    switchActiveProvider: (slug: string) =>
      request<{ message: string; activeSlug: string }>('/api/admin/providers/active', {
        method: 'PUT',
        body: JSON.stringify({ slug }),
      }),
    updateProviderConfig: (slug: string, payload: Partial<SMSProviderConfig>) =>
      request<{ message: string }>(`/api/admin/providers/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    testProvider: (slug: string) =>
      request<{ success: boolean; message: string; balance?: number; endpoint?: string }>(`/api/admin/providers/${slug}/test`, {
        method: 'POST',
      }),
    getProviderBalance: (slug: string) =>
      request<{
        success: boolean;
        balance: number;
        currency: string;
        details?: string;
        lastHttpStatus?: number;
        rawResponse?: any;
        syncedAt: string;
        endpointChecked?: string;
      }>(`/api/admin/providers/${slug}/balance`),
    updateProviderBalance: (slug: string, payload: { balance: number; reason?: string }) =>
      request<{ message: string; balance: number }>(`/api/admin/providers/${slug}/balance`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    sendTestSms: (slug: string, payload: { recipient: string; message: string; sender_id?: string }) =>
      request<{
        success: boolean;
        latencyMs: number;
        requestUrl: string;
        requestPayload: Record<string, unknown>;
        responseStatus: number;
        responseBody: any;
        providerMessageId?: string;
        status?: string;
        calculatedCredits?: number;
        errorMessage?: string;
        timestamp: string;
      }>(`/api/admin/providers/${slug}/test-send`, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    senderIds: () => request<SenderID[]>('/api/admin/sender-ids'),
    updateSenderIdStatus: (id: string, payload: { status: 'approved' | 'rejected'; rejection_reason?: string }) =>
      request<{ message: string; senderId: SenderID }>(`/api/admin/sender-ids/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    packages: () => request<SMSPackage[]>('/api/admin/packages'),
    createPackage: (payload: Partial<SMSPackage>) =>
      request<SMSPackage>('/api/admin/packages', { method: 'POST', body: JSON.stringify(payload) }),
    updatePackage: (id: string, payload: Partial<SMSPackage>) =>
      request<SMSPackage>(`/api/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    payments: () => request<PaymentTransaction[]>('/api/admin/payments'),
    reconcilePayment: (id: string, payload: { action: 'approve' | 'reject'; notes?: string }) =>
      request<{ message: string; payment: PaymentTransaction }>(`/api/admin/payments/${id}/reconcile`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    auditLogs: () => request<any[]>('/api/admin/audit-logs'),
    systemSettings: () => request<SystemSettings>('/api/admin/system-settings'),
    updateSystemSettings: (payload: Partial<SystemSettings>) =>
      request<{ message: string; settings: SystemSettings }>('/api/admin/system-settings', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    pesapalStatus: () =>
      request<{
        configured: boolean;
        consumerKeyMasked: string;
        ipnId: string;
        baseUrl: string;
        tokenStatus: string;
      }>('/api/admin/pesapal/status'),
    registerPesapalIpn: (ipn_url?: string) =>
      request<{ success: boolean; ipn_id?: string; message: string }>('/api/admin/pesapal/register-ipn', {
        method: 'POST',
        body: JSON.stringify({ ipn_url }),
      }),
  },
};
