import { Router } from 'express';
import { db } from '../db.js';
import { authenticateUser } from './auth.js';
import { User, SMSCampaign } from '../types.js';

export const campaignsRouter = Router();

// GET /api/campaigns
campaignsRouter.get('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const campaigns = db.getCampaigns().filter(c => c.user_id === user.id);
  res.json(campaigns);
});

// GET /api/campaigns/:id
campaignsRouter.get('/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const campaign = db.getCampaigns().find(c => c.id === id && c.user_id === user.id);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const messages = db.getMessages().filter(m => m.campaign_id === id);
  const delivered = messages.filter(m => m.status === 'delivered').length;
  const pending = messages.filter(m => ['queued', 'submitted', 'sent', 'buffered'].includes(m.status)).length;
  const failed = messages.filter(m => ['failed', 'rejected'].includes(m.status)).length;

  res.json({
    campaign,
    messages,
    stats: {
      total: messages.length,
      delivered,
      pending,
      failed,
      deliveryRate: messages.length ? Math.round((delivered / messages.length) * 100) : 0,
    },
  });
});

// POST /api/campaigns (Save as draft or scheduled)
campaignsRouter.post('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { name, message, sender_id, scheduled_for, recipients_count, total_credits } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Campaign name and message are required' });
  }

  const newCampaign: SMSCampaign = {
    id: `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    name: name.trim(),
    message: message.trim(),
    sender_id: sender_id || 'ICONSEND',
    total_recipients: recipients_count || 0,
    valid_recipients: recipients_count || 0,
    invalid_recipients: 0,
    duplicate_recipients: 0,
    total_segments: 1,
    total_credits: total_credits || 0,
    status: scheduled_for ? 'scheduled' : 'draft',
    scheduled_for: scheduled_for || undefined,
    created_at: new Date().toISOString(),
  };

  db.getCampaigns().unshift(newCampaign);
  db.persist();

  res.status(201).json(newCampaign);
});

// DELETE /api/campaigns/:id
campaignsRouter.delete('/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const idx = db.getCampaigns().findIndex(c => c.id === id && c.user_id === user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  db.getCampaigns().splice(idx, 1);
  db.persist();

  res.json({ message: 'Campaign deleted' });
});
