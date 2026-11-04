import { Router } from 'express';
import { db } from '../db.js';
import { authenticateUser } from './auth.js';
import { smsGateway } from '../sms/SMSGatewayManager.js';
import { normalizeUgandanPhone, calculateSmsSegments } from '../sms/smsUtils.js';
import { SMSMessage, SMSCampaign, User } from '../types.js';

export const smsRouter = Router();

// Public/authenticated phone validation endpoint
smsRouter.post('/validate-number', (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const result = normalizeUgandanPhone(phone);
  const isUnsub = db.isUnsubscribed(result.normalized);

  res.json({
    ...result,
    isUnsubscribed: isUnsub,
  });
});

// Segment counter endpoint
smsRouter.post('/calculate-segments', (req, res) => {
  const { message } = req.body;
  const result = calculateSmsSegments(message || '');
  res.json(result);
});

// POST /api/sms/send-single
smsRouter.post('/send-single', authenticateUser, async (req, res) => {
  const user = (req as any).user as User;
  const { recipient, message, sender_id } = req.body;

  if (!recipient || !message || message.trim() === '') {
    return res.status(400).json({ error: 'Recipient phone number and message are required' });
  }

  // 1. Validate phone number
  const phoneCheck = normalizeUgandanPhone(recipient);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ error: phoneCheck.error || 'Invalid Ugandan phone number' });
  }

  // 2. Check unsubscribe / opt-out
  if (db.isUnsubscribed(phoneCheck.normalized)) {
    return res.status(400).json({
      error: `Recipient ${phoneCheck.normalized} has unsubscribed and cannot receive marketing or promo SMS.`,
    });
  }

  // 3. Calculate segments and required credits
  const segCalc = calculateSmsSegments(message);
  const creditsNeeded = segCalc.creditsRequired;

  // 4. Reserve credits in user wallet
  const reserved = db.reserveCredits(user.id, creditsNeeded);
  if (!reserved) {
    const wallet = db.getWalletByUserId(user.id);
    return res.status(402).json({
      error: `Insufficient SMS credits. Required: ${creditsNeeded}, Available: ${wallet?.available_credits || 0}. Please purchase credits.`,
      availableCredits: wallet?.available_credits || 0,
      creditsNeeded,
    });
  }

  const activeProviderSlug = smsGateway.getActiveSlug();
  const effectiveSender = sender_id || 'ICONSEND';

  // 5. Submit to active SMS provider
  const result = await smsGateway.sendSMS(phoneCheck.normalized, message, effectiveSender);

  const messageRecord: SMSMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: user.id,
    recipient: phoneCheck.original,
    normalized_recipient: phoneCheck.normalized,
    carrier: phoneCheck.carrier,
    message,
    sender_id: effectiveSender,
    segments: segCalc.segmentCount,
    character_count: segCalc.characterCount,
    encoding: segCalc.encoding,
    credits_deducted: result.success ? creditsNeeded : 0,
    status: result.success ? result.status : 'failed',
    provider_slug: activeProviderSlug,
    provider_message_id: result.providerMessageId,
    error_message: result.errorMessage,
    created_at: new Date().toISOString(),
    delivered_at: result.status === 'delivered' ? new Date().toISOString() : undefined,
  };

  db.getMessages().unshift(messageRecord);

  if (result.success) {
    // 6. Commit credit deduction
    db.commitDeduction(
      user.id,
      creditsNeeded,
      `Single SMS to ${phoneCheck.normalized} (${segCalc.segmentCount} part${segCalc.segmentCount > 1 ? 's' : ''})`,
      messageRecord.id
    );

    res.json({
      success: true,
      message: 'SMS submitted successfully',
      data: messageRecord,
      wallet: db.getWalletByUserId(user.id),
    });
  } else {
    // 7. Release reserved credits on failure
    db.releaseReservedCredits(user.id, creditsNeeded);
    db.persist();

    res.status(502).json({
      success: false,
      error: result.errorMessage || 'SMS Gateway rejected the request',
      data: messageRecord,
      wallet: db.getWalletByUserId(user.id),
    });
  }
});

// POST /api/sms/send-bulk
smsRouter.post('/send-bulk', authenticateUser, async (req, res) => {
  const user = (req as any).user as User;
  const {
    recipients, // string[] or comma/newline separated
    message,
    sender_id,
    campaign_name,
    remove_duplicates = true,
  } = req.body;

  if (!recipients || !message || message.trim() === '') {
    return res.status(400).json({ error: 'Recipients list and message content are required' });
  }

  // Parse raw recipients
  let rawList: string[] = [];
  if (Array.isArray(recipients)) {
    rawList = recipients.map(r => String(r).trim()).filter(Boolean);
  } else if (typeof recipients === 'string') {
    rawList = recipients.split(/[\n,;]+/).map(r => r.trim()).filter(Boolean);
  }

  if (rawList.length === 0) {
    return res.status(400).json({ error: 'No recipient phone numbers provided' });
  }

  // Deduplicate and validate
  const seen = new Set<string>();
  const validRecipients: Array<{ original: string; normalized: string; carrier: string }> = [];
  let invalidCount = 0;
  let duplicateCount = 0;
  let optedOutCount = 0;

  for (const raw of rawList) {
    const val = normalizeUgandanPhone(raw);
    if (!val.isValid) {
      invalidCount++;
      continue;
    }

    if (db.isUnsubscribed(val.normalized)) {
      optedOutCount++;
      continue;
    }

    if (seen.has(val.normalized)) {
      duplicateCount++;
      if (remove_duplicates) {
        continue;
      }
    }

    seen.add(val.normalized);
    validRecipients.push({
      original: raw,
      normalized: val.normalized,
      carrier: val.carrier,
    });
  }

  if (validRecipients.length === 0) {
    return res.status(400).json({
      error: 'None of the provided phone numbers were valid Ugandan mobile numbers or they have opted out.',
      summary: { total: rawList.length, invalidCount, duplicateCount, optedOutCount },
    });
  }

  // Calculate segments and total credits
  const segCalc = calculateSmsSegments(message);
  const totalCreditsNeeded = validRecipients.length * segCalc.creditsRequired;

  // Check and reserve wallet balance
  const reserved = db.reserveCredits(user.id, totalCreditsNeeded);
  if (!reserved) {
    const wallet = db.getWalletByUserId(user.id);
    return res.status(402).json({
      error: `Insufficient SMS credits for bulk campaign. Required: ${totalCreditsNeeded} credits (${validRecipients.length} recipients × ${segCalc.creditsRequired} part/s), Available: ${wallet?.available_credits || 0}.`,
      required: totalCreditsNeeded,
      available: wallet?.available_credits || 0,
    });
  }

  const campaignId = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const effectiveSender = sender_id || 'ICONSEND';
  const campaignName = campaign_name?.trim() || `Campaign ${new Date().toLocaleDateString('en-GB')}`;

  const campaign: SMSCampaign = {
    id: campaignId,
    user_id: user.id,
    name: campaignName,
    message,
    sender_id: effectiveSender,
    total_recipients: rawList.length,
    valid_recipients: validRecipients.length,
    invalid_recipients: invalidCount,
    duplicate_recipients: duplicateCount,
    total_segments: validRecipients.length * segCalc.segmentCount,
    total_credits: totalCreditsNeeded,
    status: 'processing',
    created_at: new Date().toISOString(),
  };
  db.getCampaigns().unshift(campaign);
  db.persist();

  // Controlled batch dispatch
  const activeSlug = smsGateway.getActiveSlug();
  let successCount = 0;
  let failureCount = 0;
  let actualCreditsUsed = 0;

  // Process in background-safe batches of 10
  const normalizedList = validRecipients.map(v => v.normalized);
  const sendResults = await smsGateway.sendBulkSMS(normalizedList, message, effectiveSender);

  sendResults.forEach((result, idx) => {
    const rInfo = validRecipients[idx];
    const isSuccess = result.success;
    const itemCredits = isSuccess ? segCalc.creditsRequired : 0;

    if (isSuccess) {
      successCount++;
      actualCreditsUsed += itemCredits;
    } else {
      failureCount++;
    }

    const msgRecord: SMSMessage = {
      id: `msg_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 5)}`,
      user_id: user.id,
      campaign_id: campaignId,
      recipient: rInfo.original,
      normalized_recipient: rInfo.normalized,
      carrier: rInfo.carrier,
      message,
      sender_id: effectiveSender,
      segments: segCalc.segmentCount,
      character_count: segCalc.characterCount,
      encoding: segCalc.encoding,
      credits_deducted: itemCredits,
      status: result.status,
      provider_slug: activeSlug,
      provider_message_id: result.providerMessageId,
      error_message: result.errorMessage,
      created_at: new Date().toISOString(),
      delivered_at: result.status === 'delivered' ? new Date().toISOString() : undefined,
    };
    db.getMessages().unshift(msgRecord);
  });

  // Finalize credits
  const unusedCredits = totalCreditsNeeded - actualCreditsUsed;
  if (unusedCredits > 0) {
    db.releaseReservedCredits(user.id, unusedCredits);
  }
  if (actualCreditsUsed > 0) {
    db.commitDeduction(
      user.id,
      actualCreditsUsed,
      `Bulk Campaign "${campaignName}" (${successCount} successful)`,
      campaignId
    );
  }

  // Update campaign status
  campaign.status = failureCount === 0 ? 'completed' : successCount > 0 ? 'partially_delivered' : 'failed';
  campaign.completed_at = new Date().toISOString();

  // Create user notification
  db.createNotification(
    user.id,
    `Campaign "${campaignName}" Completed`,
    `Dispatched to ${successCount} recipients (${failureCount} failed). Deducted ${actualCreditsUsed} credits.`,
    failureCount === 0 ? 'success' : 'warning'
  );

  db.persist();

  res.json({
    success: true,
    message: `Campaign dispatched: ${successCount} successful, ${failureCount} failed`,
    campaign,
    summary: {
      totalInput: rawList.length,
      valid: validRecipients.length,
      invalid: invalidCount,
      duplicates: duplicateCount,
      optedOut: optedOutCount,
      sentSuccessfully: successCount,
      failed: failureCount,
      creditsDeducted: actualCreditsUsed,
      creditsRefunded: unusedCredits,
    },
    wallet: db.getWalletByUserId(user.id),
  });
});

// GET /api/sms/messages
smsRouter.get('/messages', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { status, search, campaign_id, limit = '50', offset = '0' } = req.query;

  let messages = db.getMessages().filter(m => m.user_id === user.id);

  if (campaign_id) {
    messages = messages.filter(m => m.campaign_id === String(campaign_id));
  }

  if (status && status !== 'all') {
    messages = messages.filter(m => m.status === String(status));
  }

  if (search) {
    const q = String(search).toLowerCase();
    messages = messages.filter(m =>
      m.recipient.toLowerCase().includes(q) ||
      m.normalized_recipient.toLowerCase().includes(q) ||
      m.message.toLowerCase().includes(q) ||
      (m.sender_id && m.sender_id.toLowerCase().includes(q))
    );
  }

  const total = messages.length;
  const pageLimit = parseInt(String(limit), 10) || 50;
  const pageOffset = parseInt(String(offset), 10) || 0;
  const paginated = messages.slice(pageOffset, pageOffset + pageLimit);

  res.json({
    total,
    limit: pageLimit,
    offset: pageOffset,
    messages: paginated,
  });
});

// GET /api/sms/messages/:id/status
smsRouter.get('/messages/:id/status', authenticateUser, async (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const msg = db.getMessages().find(m => m.id === id && m.user_id === user.id);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  if (msg.provider_message_id) {
    const statusResult = await smsGateway.checkDeliveryStatus(msg.provider_message_id, msg.provider_slug);
    if (statusResult.status !== msg.status) {
      msg.status = statusResult.status;
      if (statusResult.status === 'delivered') {
        msg.delivered_at = statusResult.deliveredAt || new Date().toISOString();
      }
      db.persist();
    }
  }

  res.json(msg);
});

// POST /api/sms/check-delivery
smsRouter.post('/check-delivery', authenticateUser, async (req, res) => {
  const user = (req as any).user as User;
  const pendingMessages = db.getMessages().filter(
    m => m.user_id === user.id && (m.status === 'sent' || m.status === 'submitted' || m.status === 'buffered') && m.provider_message_id
  ).slice(0, 20);

  let updatedCount = 0;
  for (const msg of pendingMessages) {
    if (msg.provider_message_id) {
      const res = await smsGateway.checkDeliveryStatus(msg.provider_message_id, msg.provider_slug);
      if (res.status && res.status !== msg.status) {
        msg.status = res.status;
        if (res.status === 'delivered') {
          msg.delivered_at = res.deliveredAt || new Date().toISOString();
        }
        updatedCount++;
      }
    }
  }

  if (updatedCount > 0) {
    db.persist();
  }

  res.json({ checked: pendingMessages.length, updated: updatedCount });
});

// POST /api/sms/opt-out (Public Unsubscribe handler)
smsRouter.post('/opt-out', (req, res) => {
  const { phone_number, reason } = req.body;
  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const phoneCheck = normalizeUgandanPhone(phone_number);
  const normalized = phoneCheck.isValid ? phoneCheck.normalized : phone_number.trim();

  db.addUnsubscribe(normalized, reason || 'Customer requested opt-out');
  res.json({
    message: `${normalized} has been successfully unsubscribed and will receive no further messages.`,
  });
});
