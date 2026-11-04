import { Router } from 'express';
import { db } from '../db.js';
import { authenticateUser } from './auth.js';
import { pesapalService } from '../pesapal/pesapalService.js';
import { PaymentTransaction, User } from '../types.js';

export const walletRouter = Router();

// GET /api/wallet
walletRouter.get('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const wallet = db.getWalletByUserId(user.id);
  const transactions = db.getWalletTransactions().filter(t => t.user_id === user.id);

  res.json({
    wallet,
    transactions,
  });
});

// GET /api/wallet/packages
walletRouter.get('/packages', (req, res) => {
  const packages = db.getPackages().filter(p => p.is_active);
  res.json(packages);
});

// POST /api/wallet/pesapal/initiate
// Initiates live Pesapal order for package or custom credit top-up
walletRouter.post('/pesapal/initiate', authenticateUser, async (req, res) => {
  const user = (req as any).user as User;
  const { package_id, custom_amount, custom_credits, callback_url } = req.body;

  let amountUgx = 10000;
  let creditsToAdd = 260;
  let description = 'ICON SEND UG - SMS Credits';

  if (package_id) {
    const pkg = db.getPackages().find(p => p.id === package_id);
    if (!pkg) {
      return res.status(404).json({ error: 'SMS package not found' });
    }
    amountUgx = pkg.price_ugx;
    creditsToAdd = pkg.credits + (pkg.bonus_credits || 0);
    description = `ICON SEND UG - ${pkg.name} (${creditsToAdd} SMS Credits)`;
  } else if (custom_amount && custom_credits) {
    amountUgx = Number(custom_amount);
    creditsToAdd = Number(custom_credits);
    description = `ICON SEND UG - Custom Top-up (${creditsToAdd} SMS Credits)`;
  }

  const txnRef = `TXN-PESAPAL-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
  const effectiveCallback = callback_url || `${req.protocol}://${req.get('host')}/?page=wallet`;

  const orderRes = await pesapalService.submitOrder({
    reference: txnRef,
    amountUgx,
    description,
    callbackUrl: effectiveCallback,
    customerEmail: user.email,
    customerPhone: user.phone_number,
    customerName: user.full_name,
  });

  if (!orderRes.success) {
    return res.status(502).json({
      error: orderRes.errorMessage || 'Failed to initiate Pesapal payment request. Please check API credentials.',
    });
  }

  // Create pending payment transaction
  const txn: PaymentTransaction = {
    id: `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    package_id,
    amount_ugx: amountUgx,
    credits_added: creditsToAdd,
    payment_method: 'pesapal',
    status: 'pending',
    transaction_reference: txnRef,
    phone_number: user.phone_number,
    notes: `Pesapal Order: ${orderRes.orderTrackingId}`,
    created_at: new Date().toISOString(),
  };

  db.getPaymentTransactions().unshift(txn);
  db.persist();

  res.json({
    success: true,
    orderTrackingId: orderRes.orderTrackingId,
    redirectUrl: orderRes.redirectUrl,
    merchantReference: txnRef,
    transaction: txn,
    isSimulated: orderRes.isSimulated,
  });
});

// Handler for verifying Pesapal order status
async function handlePesapalVerification(req: any, res: any) {
  const user = req.user as User;
  const orderTrackingId = (req.query.orderTrackingId || req.body?.orderTrackingId) as string;

  if (!orderTrackingId || typeof orderTrackingId !== 'string') {
    return res.status(400).json({ error: 'OrderTrackingId is required' });
  }

  // Find payment record
  const payment = db.getPaymentTransactions().find(
    p => p.notes?.includes(orderTrackingId) || p.transaction_reference === orderTrackingId
  );

  if (!payment) {
    return res.status(404).json({ error: 'Matching payment transaction not found in records' });
  }

  if (payment.status === 'completed') {
    return res.json({
      success: true,
      message: 'Payment has already been confirmed and credits credited.',
      transaction: payment,
      wallet: db.getWalletByUserId(payment.user_id),
    });
  }

  const statusRes = await pesapalService.getTransactionStatus(orderTrackingId);

  if (!statusRes) {
    return res.status(502).json({ error: 'Could not query transaction status from Pesapal Live API' });
  }

  if (statusRes.status_code === 1 || statusRes.payment_status_description === 'Completed') {
    payment.status = 'completed';
    payment.notes = `${payment.notes || ''} | Pesapal Confirmed: ${statusRes.confirmation_code || ''} via ${statusRes.payment_method}`;

    // Add credits to user wallet
    db.addCredits(
      payment.user_id,
      payment.credits_added,
      'purchase',
      `Pesapal Live Payment (${statusRes.payment_method || 'Mobile Money/Card'}) - Ref: ${payment.transaction_reference}`,
      payment.id
    );

    db.createNotification(
      payment.user_id,
      'Pesapal Payment Verified & Credits Allocated',
      `UGX ${payment.amount_ugx.toLocaleString()} payment confirmed via Pesapal. ${payment.credits_added} SMS credits added to your wallet.`,
      'success'
    );

    db.persist();

    return res.json({
      success: true,
      message: `Payment confirmed! Added ${payment.credits_added} credits to your account.`,
      transaction: payment,
      wallet: db.getWalletByUserId(payment.user_id),
    });
  } else if (statusRes.status_code === 2 || statusRes.payment_status_description === 'Failed') {
    payment.status = 'failed';
    payment.notes = `${payment.notes || ''} | Pesapal Failed: ${statusRes.message || ''}`;
    db.persist();

    return res.status(400).json({
      success: false,
      message: `Pesapal payment failed or was cancelled by user: ${statusRes.message || ''}`,
      transaction: payment,
    });
  } else {
    return res.json({
      success: false,
      message: 'Payment is still being processed on the carrier network. Please wait a moment.',
      transaction: payment,
      status: statusRes.payment_status_description,
    });
  }
}

walletRouter.get('/pesapal/verify', authenticateUser, handlePesapalVerification);
walletRouter.post('/pesapal/verify', authenticateUser, handlePesapalVerification);

// GET /api/wallet/pesapal/ipn
// Pesapal IPN Webhook Listener
walletRouter.get('/pesapal/ipn', async (req, res) => {
  const { OrderTrackingId, OrderNotificationType, OrderMerchantReference } = req.query;

  if (OrderTrackingId && typeof OrderTrackingId === 'string') {
    const statusRes = await pesapalService.getTransactionStatus(OrderTrackingId);

    if (statusRes && (statusRes.status_code === 1 || statusRes.payment_status_description === 'Completed')) {
      const payment = db.getPaymentTransactions().find(
        p => p.notes?.includes(OrderTrackingId) || p.transaction_reference === OrderMerchantReference
      );

      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.notes = `${payment.notes || ''} | IPN Confirmed: ${statusRes.confirmation_code}`;

        db.addCredits(
          payment.user_id,
          payment.credits_added,
          'purchase',
          `Pesapal IPN Auto-credit (${payment.transaction_reference})`,
          payment.id
        );

        db.createNotification(
          payment.user_id,
          'Payment Confirmed via Pesapal IPN',
          `Your payment of UGX ${payment.amount_ugx.toLocaleString()} has been reconciled and ${payment.credits_added} SMS credits credited.`,
          'success'
        );

        db.persist();
      }
    }
  }

  // Respond in format Pesapal expects
  res.json({
    orderNotificationType: OrderNotificationType || 'IPNCHANGE',
    orderTrackingId: OrderTrackingId,
    orderMerchantReference: OrderMerchantReference,
    status: 200,
  });
});

// POST /api/wallet/checkout (Legacy or direct option)
walletRouter.post('/checkout', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { package_id, payment_method = 'pesapal', phone_number, notes } = req.body;

  let amountUgx = 0;
  let creditsToAdd = 0;
  let pkgName = 'Custom Top-up';

  if (package_id) {
    const pkg = db.getPackages().find(p => p.id === package_id);
    if (!pkg) {
      return res.status(404).json({ error: 'Selected SMS credit package not found' });
    }
    amountUgx = pkg.price_ugx;
    creditsToAdd = pkg.credits + (pkg.bonus_credits || 0);
    pkgName = pkg.name;
  } else {
    const { amount, credits } = req.body;
    amountUgx = Number(amount) || 10000;
    creditsToAdd = Number(credits) || 260;
  }

  const txnRef = `TXN-${payment_method.toUpperCase()}-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
  const isInstant = ['pesapal', 'mtn_momo', 'airtel_money'].includes(payment_method);
  const status = isInstant ? 'completed' : 'pending';

  const txn: PaymentTransaction = {
    id: `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    package_id,
    amount_ugx: amountUgx,
    credits_added: creditsToAdd,
    payment_method: payment_method as any,
    status,
    transaction_reference: txnRef,
    phone_number: phone_number || user.phone_number,
    notes: notes || `Purchase: ${pkgName}`,
    created_at: new Date().toISOString(),
  };

  db.getPaymentTransactions().unshift(txn);

  if (isInstant) {
    db.addCredits(
      user.id,
      creditsToAdd,
      'purchase',
      `Purchased ${pkgName} via ${payment_method.toUpperCase().replace('_', ' ')} (${txnRef})`,
      txn.id
    );

    db.createNotification(
      user.id,
      'Payment Received & Credits Added',
      `UGX ${amountUgx.toLocaleString()} payment verified via ${payment_method.toUpperCase().replace('_', ' ')}. ${creditsToAdd} SMS credits are now available in your wallet.`,
      'success'
    );
  } else {
    db.createNotification(
      user.id,
      'Bank/Manual Payment Submitted',
      `Payment reference ${txnRef} for UGX ${amountUgx.toLocaleString()} has been queued for verification.`,
      'info'
    );
  }

  db.persist();

  res.status(201).json({
    success: true,
    message: isInstant
      ? `Payment processed successfully! ${creditsToAdd} credits added to your SMS wallet.`
      : 'Payment submitted for admin reconciliation. Credits will be approved promptly.',
    transaction: txn,
    wallet: db.getWalletByUserId(user.id),
  });
});

// GET /api/wallet/transactions
walletRouter.get('/transactions', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const transactions = db.getWalletTransactions().filter(t => t.user_id === user.id);
  res.json(transactions);
});

// GET /api/wallet/payments
walletRouter.get('/payments', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const payments = db.getPaymentTransactions().filter(p => p.user_id === user.id);
  res.json(payments);
});
