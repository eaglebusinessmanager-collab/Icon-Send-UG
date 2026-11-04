import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db.ts';
import { authenticateUser } from './auth.ts';
import { smsGateway } from '../sms/SMSGatewayManager.ts';
import type { User, SMSPackage } from '../types.ts';
import { PesapalService } from '../pesapal/pesapalService.ts';

export const adminRouter = express.Router();

// Middleware: Require Admin or Super Admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as User;
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
}

// Apply authentication and admin verification to all admin routes
adminRouter.use(authenticateUser);
adminRouter.use(requireAdmin);

// GET /api/admin/overview
adminRouter.get('/overview', async (req, res) => {
  const users = db.getUsers();
  const customers = users.filter(u => u.role === 'customer');
  const activeCustomers = customers.filter(u => u.status === 'active');

  const messages = db.getMessages();
  const totalSmsSubmitted = messages.length;
  const delivered = messages.filter(m => m.status === 'delivered').length;
  const failed = messages.filter(m => m.status === 'failed' || m.status === 'rejected').length;
  const pending = messages.filter(m => ['queued', 'submitted', 'sent', 'buffered'].includes(m.status)).length;

  const payments = db.getPaymentTransactions();
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalRevenueUgx = completedPayments.reduce((acc, p) => acc + (p.amount_ugx || 0), 0);
  const totalCreditsSold = completedPayments.reduce((acc, p) => acc + (p.credits_added || 0), 0);

  // Financial model: Bulk SMS Uganda wholesale rate is approx UGX 22 - 25 per SMS
  const wholesaleCostPerSms = 24;
  const estimatedGatewayExpenditure = messages.filter(m => m.status !== 'failed').length * wholesaleCostPerSms;
  const grossMargin = totalRevenueUgx - estimatedGatewayExpenditure;

  // Active provider status
  const activeProviderSlug = smsGateway.getActiveSlug();
  const providerBalance = await smsGateway.getBalance();

  res.json({
    metrics: {
      totalCustomers: customers.length,
      activeCustomers: activeCustomers.length,
      totalSmsSubmitted,
      delivered,
      failed,
      pending,
      totalCreditsSold,
      totalRevenueUgx,
      estimatedGatewayExpenditure,
      grossMargin,
      grossMarginPercentage: totalRevenueUgx > 0 ? Math.round((grossMargin / totalRevenueUgx) * 100) : 0,
      activeProviderSlug,
      providerCredits: providerBalance.creditsAvailable,
    },
    recentTransactions: payments.slice(0, 8),
    recentCampaigns: db.getCampaigns().slice(0, 6),
    recentMessages: messages.slice(0, 10),
  });
});

// GET /api/admin/customers
adminRouter.get('/customers', (req, res) => {
  const users = db.getUsers().filter(u => u.role === 'customer');
  const data = users.map(user => {
    const wallet = db.getWalletByUserId(user.id);
    const userMessages = db.getMessages().filter(m => m.user_id === user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        phone_number: user.phone_number,
        company_name: user.company_name,
        status: user.status,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
      wallet,
      stats: {
        totalMessagesSent: userMessages.length,
        delivered: userMessages.filter(m => m.status === 'delivered').length,
      },
    };
  });

  res.json(data);
});

// PUT /api/admin/customers/:id/status
adminRouter.put('/customers/:id/status', (req, res) => {
  const admin = (req as any).user as User;
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be active or suspended' });
  }

  const updated = db.updateUser(id, { status });
  if (!updated) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  db.logAudit(
    admin.id,
    admin.email,
    status === 'suspended' ? 'CUSTOMER_SUSPENDED' : 'CUSTOMER_REACTIVATED',
    'USER',
    id,
    { reason: reason || 'Admin action', targetEmail: updated.email },
    req.ip || '127.0.0.1'
  );

  res.json({ message: `Customer marked as ${status}`, user: updated });
});

// POST /api/admin/customers/:id/adjust-credits
adminRouter.post('/customers/:id/adjust-credits', (req, res) => {
  const admin = (req as any).user as User;
  const { id } = req.params;
  const { amount_credits, reason } = req.body;

  const count = parseInt(String(amount_credits), 10);
  if (isNaN(count) || count === 0) {
    return res.status(400).json({ error: 'Please enter a valid non-zero number of credits' });
  }

  if (!reason || reason.trim() === '') {
    return res.status(400).json({ error: 'An audit reason is required for manual credit adjustments' });
  }

  const customer = db.findUserById(id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }

  const wallet = db.addCredits(
    customer.id,
    count,
    'admin_adjustment',
    `Manual adjustment by admin (${admin.email}): ${reason.trim()}`
  );

  db.logAudit(
    admin.id,
    admin.email,
    'CREDIT_ADJUSTMENT',
    'WALLET',
    wallet.id,
    { customerId: customer.id, customerEmail: customer.email, creditsAdjusted: count, reason },
    req.ip || '127.0.0.1'
  );

  db.createNotification(
    customer.id,
    count > 0 ? 'SMS Credits Added by Support' : 'SMS Credits Deducted by Support',
    `${Math.abs(count)} SMS credits have been ${count > 0 ? 'added to' : 'deducted from'} your wallet. Reason: ${reason}`,
    count > 0 ? 'success' : 'warning'
  );

  res.json({
    message: `Adjusted ${count} credits for ${customer.email}`,
    wallet,
  });
});

// GET /api/admin/sms-monitoring
adminRouter.get('/sms-monitoring', (req, res) => {
  const messages = db.getMessages();
  res.json(messages);
});

// GET /api/admin/providers
adminRouter.get('/providers', async (req, res) => {
  const providers = smsGateway.getAllProviders().map(p => ({
    ...p,
    config: {
      ...p.config,
      api_key: p.config.api_key && p.config.api_key.trim() !== '' ? '••••••••••••••••' : '',
      api_secret: p.config.api_secret && p.config.api_secret.trim() !== '' ? '••••••••••••••••' : '',
    },
  }));
  res.json(providers);
});

// PUT /api/admin/providers/active
adminRouter.put('/providers/active', (req, res) => {
  const admin = (req as any).user as User;
  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Provider slug is required' });
  }

  const success = smsGateway.setActiveProvider(slug);
  if (!success) {
    return res.status(404).json({ error: `Provider adapter "${slug}" not found` });
  }

  const settings = db.getSystemSettings();
  settings.active_provider_slug = slug;
  db.persist();

  db.logAudit(
    admin.id,
    admin.email,
    'SMS_PROVIDER_SWITCHED',
    'SMS_GATEWAY',
    slug,
    { newActiveProvider: slug },
    req.ip || '127.0.0.1'
  );

  res.json({
    message: `Active SMS Provider switched to ${slug}`,
    activeSlug: slug,
  });
});

// PUT /api/admin/providers/:slug
adminRouter.put('/providers/:slug', (req, res) => {
  const admin = (req as any).user as User;
  const { slug } = req.params;
  const { api_key, api_url, api_secret, sender_id, test_mode } = req.body;

  const isMaskedOrEmpty = (str?: string) => !str || str.includes('••') || str.trim() === '';
  const sanitizedApiKey = !isMaskedOrEmpty(api_key) ? api_key.trim() : undefined;
  const sanitizedApiSecret = !isMaskedOrEmpty(api_secret) ? api_secret.trim() : undefined;

  const updatePayload: Record<string, unknown> = {
    ...(sanitizedApiKey !== undefined ? { api_key: sanitizedApiKey } : {}),
    ...(api_url !== undefined ? { api_url: api_url.trim() } : {}),
    ...(sanitizedApiSecret !== undefined ? { api_secret: sanitizedApiSecret } : {}),
    ...(sender_id !== undefined ? { sender_id: sender_id.trim() } : {}),
    ...(test_mode !== undefined ? { test_mode: Boolean(test_mode) } : {}),
  };

  const updated = smsGateway.updateProviderConfig(slug, updatePayload);

  if (!updated) {
    return res.status(404).json({ error: 'Provider adapter not found' });
  }

  // Update in persisted provider settings
  const pList = db.getProviderSettings();
  const existingIdx = pList.findIndex(p => p.slug === slug);
  if (existingIdx !== -1) {
    pList[existingIdx] = {
      ...pList[existingIdx],
      ...updatePayload,
    };
  }
  db.persist();

  db.logAudit(
    admin.id,
    admin.email,
    'PROVIDER_SETTINGS_UPDATED',
    'SMS_GATEWAY',
    slug,
    { slug, testMode: test_mode, senderId: sender_id },
    req.ip || '127.0.0.1'
  );

  res.json({ message: `Provider ${slug} settings updated successfully` });
});

// POST /api/admin/providers/:slug/test
adminRouter.post('/providers/:slug/test', async (req, res) => {
  const { slug } = req.params;
  const result = await smsGateway.testProvider(slug);
  res.json(result);
});

// GET /api/admin/providers/:slug/balance - Query live balance from provider API
adminRouter.get('/providers/:slug/balance', async (req, res) => {
  const { slug } = req.params;
  try {
    const result = await smsGateway.getProviderBalance(slug);

    // If valid credits received, update database provider cache
    if (typeof result.creditsAvailable === 'number') {
      const pList = db.getProviderSettings();
      const existing = pList.find(p => p.slug === slug);
      if (existing) {
        existing.balance_cached = result.creditsAvailable;
        db.persist();
      }
    }

    res.json({
      success: true,
      balance: result.creditsAvailable,
      currency: result.currency || 'SMS Credits',
      details: result.rawDetails,
      lastHttpStatus: result.lastHttpStatus,
      rawResponse: result.rawResponse,
      syncedAt: result.syncedAt || new Date().toISOString(),
      endpointChecked: result.endpointChecked,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query provider balance';
    res.status(500).json({ error: msg });
  }
});

// PUT /api/admin/providers/:slug/balance - Calibrate or manually adjust provider credit pool
adminRouter.put('/providers/:slug/balance', (req, res) => {
  const admin = (req as any).user as User;
  const { slug } = req.params;
  const { balance, reason } = req.body;

  const count = parseInt(String(balance), 10);
  if (isNaN(count) || count < 0) {
    return res.status(400).json({ error: 'Please enter a valid non-negative credit number' });
  }

  smsGateway.updateCachedBalance(slug, count);

  const pList = db.getProviderSettings();
  const existing = pList.find(p => p.slug === slug);
  if (existing) {
    existing.balance_cached = count;
  } else {
    pList.push({
      id: `prov_${slug}`,
      slug,
      name: slug,
      is_active: false,
      api_key: '',
      api_url: '',
      sender_id: 'ICONSEND',
      balance_cached: count,
      test_mode: false,
    });
  }
  db.persist();

  db.logAudit(
    admin.id,
    admin.email,
    'PROVIDER_BALANCE_CALIBRATED',
    'SMS_GATEWAY',
    slug,
    { slug, newBalance: count, reason: reason || 'Manual calibration by admin' },
    req.ip || '127.0.0.1'
  );

  res.json({
    message: `Provider ${slug} balance pool calibrated to ${count} credits`,
    balance: count,
  });
});

// POST /api/admin/providers/:slug/test-send - Dispatch live test SMS and receive complete telemetry
adminRouter.post('/providers/:slug/test-send', async (req, res) => {
  const admin = (req as any).user as User;
  const { slug } = req.params;
  const { recipient, message, sender_id } = req.body;

  if (!recipient || recipient.trim() === '') {
    return res.status(400).json({ error: 'A recipient phone number is required (e.g., 0772123456 or +2567...)' });
  }

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'A message body is required for the test dispatch' });
  }

  try {
    const diagnostic = await smsGateway.testSendSMS(slug, recipient.trim(), message.trim(), sender_id);

    // Sync any altered balance in DB
    const adapter = smsGateway.getAdapter(slug);
    if (adapter && typeof adapter.config.balance_cached === 'number') {
      const pList = db.getProviderSettings();
      const existing = pList.find(p => p.slug === slug);
      if (existing) {
        existing.balance_cached = adapter.config.balance_cached;
        db.persist();
      }
    }

    db.logAudit(
      admin.id,
      admin.email,
      'PROVIDER_TEST_SMS_SENT',
      'SMS_GATEWAY',
      slug,
      {
        recipient,
        senderId: sender_id || 'ICONSEND',
        success: diagnostic.success,
        responseStatus: diagnostic.responseStatus,
        providerMessageId: diagnostic.providerMessageId,
        latencyMs: diagnostic.latencyMs,
      },
      req.ip || '127.0.0.1'
    );

    res.json(diagnostic);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error executing test SMS dispatch';
    res.status(500).json({ error: msg });
  }
});

// GET /api/admin/sender-ids
adminRouter.get('/sender-ids', (req, res) => {
  const list = db.getSenderIds();
  res.json(list);
});

// PUT /api/admin/sender-ids/:id/status
adminRouter.put('/sender-ids/:id/status', (req, res) => {
  const admin = (req as any).user as User;
  const { id } = req.params;
  const { status, rejection_reason } = req.body;

  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const senderId = db.getSenderIds().find(s => s.id === id);
  if (!senderId) {
    return res.status(404).json({ error: 'Sender ID not found' });
  }

  senderId.status = status;
  if (rejection_reason) senderId.rejection_reason = rejection_reason;
  db.persist();

  db.logAudit(
    admin.id,
    admin.email,
    'SENDER_ID_STATUS_UPDATE',
    'SENDER_ID',
    id,
    { senderId: senderId.sender_id, status, rejection_reason },
    req.ip || '127.0.0.1'
  );

  db.createNotification(
    senderId.user_id,
    `Sender ID "${senderId.sender_id}" ${status.toUpperCase()}`,
    status === 'approved'
      ? `Your requested Sender ID "${senderId.sender_id}" has been approved for commercial messaging across Uganda networks.`
      : `Your Sender ID request was rejected. Reason: ${rejection_reason || 'UCC compliance requirements not met'}.`,
    status === 'approved' ? 'success' : 'alert'
  );

  res.json({ message: `Sender ID status updated to ${status}`, senderId });
});

// GET /api/admin/packages
adminRouter.get('/packages', (req, res) => {
  res.json(db.getPackages());
});

// POST /api/admin/packages
adminRouter.post('/packages', (req, res) => {
  const admin = (req as any).user as User;
  const { name, price_ugx, credits, bonus_credits, description, is_popular } = req.body;

  if (!name || !price_ugx || !credits) {
    return res.status(400).json({ error: 'Package name, price in UGX, and credits are required' });
  }

  const newPkg: SMSPackage = {
    id: `pkg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    name: name.trim(),
    price_ugx: Number(price_ugx),
    credits: Number(credits),
    bonus_credits: Number(bonus_credits || 0),
    rate_per_sms: Number((Number(price_ugx) / (Number(credits) + Number(bonus_credits || 0))).toFixed(1)),
    is_popular: Boolean(is_popular),
    is_active: true,
    description: description?.trim() || '',
    created_at: new Date().toISOString(),
  };

  db.getPackages().push(newPkg);
  db.persist();

  db.logAudit(admin.id, admin.email, 'PACKAGE_CREATED', 'SMS_PACKAGE', newPkg.id, { newPkg }, req.ip || '127.0.0.1');
  res.status(201).json(newPkg);
});

// PUT /api/admin/packages/:id
adminRouter.put('/packages/:id', (req, res) => {
  const admin = (req as any).user as User;
  const { id } = req.params;
  const { name, price_ugx, credits, bonus_credits, is_popular, is_active, description } = req.body;

  const pkg = db.getPackages().find(p => p.id === id);
  if (!pkg) {
    return res.status(404).json({ error: 'Package not found' });
  }

  if (name) pkg.name = name.trim();
  if (price_ugx !== undefined) pkg.price_ugx = Number(price_ugx);
  if (credits !== undefined) pkg.credits = Number(credits);
  if (bonus_credits !== undefined) pkg.bonus_credits = Number(bonus_credits);
  if (is_popular !== undefined) pkg.is_popular = Boolean(is_popular);
  if (is_active !== undefined) pkg.is_active = Boolean(is_active);
  if (description !== undefined) pkg.description = description.trim();
  pkg.rate_per_sms = Number((pkg.price_ugx / (pkg.credits + (pkg.bonus_credits || 0))).toFixed(1));

  db.persist();
  db.logAudit(admin.id, admin.email, 'PACKAGE_UPDATED', 'SMS_PACKAGE', id, { pkg }, req.ip || '127.0.0.1');

  res.json(pkg);
});

// GET /api/admin/payments
adminRouter.get('/payments', (req, res) => {
  const payments = db.getPaymentTransactions();
  res.json(payments);
});

// PUT /api/admin/payments/:id/reconcile
adminRouter.put('/payments/:id/reconcile', (req, res) => {
  const admin = (req as any).user as User;
  const { id } = req.params;
  const { action, notes } = req.body; // action: 'approve' | 'reject'

  const payment = db.getPaymentTransactions().find(p => p.id === id);
  if (!payment) {
    return res.status(404).json({ error: 'Payment record not found' });
  }

  if (payment.status === 'completed') {
    return res.status(400).json({ error: 'Payment is already marked as completed' });
  }

  if (action === 'approve') {
    payment.status = 'completed';
    payment.approved_by_admin = admin.id;
    if (notes) payment.notes = `${payment.notes || ''} | Reconciled: ${notes}`;

    // Add credits to user wallet
    db.addCredits(
      payment.user_id,
      payment.credits_added,
      'purchase',
      `Manual Payment Reconciliation Approved: ${payment.transaction_reference} (${payment.payment_method.toUpperCase()})`,
      payment.id
    );

    db.createNotification(
      payment.user_id,
      'Payment Approved & Credits Credited',
      `Your manual payment of UGX ${payment.amount_ugx.toLocaleString()} has been reconciled. ${payment.credits_added} SMS credits added.`,
      'success'
    );
  } else {
    payment.status = 'rejected';
    if (notes) payment.notes = `${payment.notes || ''} | Rejected: ${notes}`;

    db.createNotification(
      payment.user_id,
      'Payment Reconciliation Rejected',
      `Your payment submission ${payment.transaction_reference} was rejected. Reason: ${notes || 'Payment could not be verified on bank/MoMo statement'}.`,
      'alert'
    );
  }

  db.persist();
  db.logAudit(
    admin.id,
    admin.email,
    action === 'approve' ? 'PAYMENT_APPROVED' : 'PAYMENT_REJECTED',
    'PAYMENT',
    id,
    { paymentId: id, action, notes },
    req.ip || '127.0.0.1'
  );

  res.json({ message: `Payment ${action === 'approve' ? 'approved' : 'rejected'}`, payment });
});

// GET /api/admin/audit-logs
adminRouter.get('/audit-logs', (req, res) => {
  res.json(db.getAuditLogs());
});

// GET /api/admin/system-settings
adminRouter.get('/system-settings', (req, res) => {
  res.json(db.getSystemSettings());
});

// PUT /api/admin/system-settings
adminRouter.put('/system-settings', (req, res) => {
  const admin = (req as any).user as User;
  const current = db.getSystemSettings();
  const updates = req.body;

  Object.assign(current, updates);
  db.persist();

  db.logAudit(admin.id, admin.email, 'SYSTEM_SETTINGS_UPDATED', 'SYSTEM', 'CONFIG', updates, req.ip || '127.0.0.1');
  res.json({ message: 'System settings saved', settings: current });
});

// POST /api/admin/pesapal/register-ipn
adminRouter.post('/pesapal/register-ipn', async (req, res) => {
  const { ipn_url } = req.body;
  const targetUrl = (ipn_url || `${process.env.APP_URL || 'https://iconsend.ug'}/api/wallet/pesapal/ipn`).trim();
  const pesapal = PesapalService.getInstance();
  const result = await pesapal.registerIPN(targetUrl);
  res.json(result);
});

// GET /api/admin/pesapal/status
adminRouter.get('/pesapal/status', async (req, res) => {
  const s = db.getSystemSettings();
  const consumerKey = (s.pesapal_consumer_key || process.env.PESAPAL_CONSUMER_KEY || '').trim();
  const consumerSecret = (s.pesapal_consumer_secret || process.env.PESAPAL_CONSUMER_SECRET || '').trim();
  const ipnId = (s.pesapal_ipn_id || process.env.PESAPAL_IPN_ID || '').trim();
  const baseUrl = (s.pesapal_base_url || 'https://pay.pesapal.com/v3').trim();

  let tokenStatus = 'Not tested';
  if (consumerKey && consumerSecret) {
    try {
      const pesapal = PesapalService.getInstance();
      const token = await pesapal.getAccessToken();
      tokenStatus = token ? 'Authentication Successful (Live)' : 'Authentication Failed (Check Key/Secret)';
    } catch {
      tokenStatus = 'Connection Error';
    }
  } else {
    tokenStatus = 'Missing Credentials';
  }

  res.json({
    configured: Boolean(consumerKey && consumerSecret),
    consumerKeyMasked: consumerKey ? `${consumerKey.substring(0, 6)}...` : '',
    ipnId,
    baseUrl,
    tokenStatus,
  });
});
