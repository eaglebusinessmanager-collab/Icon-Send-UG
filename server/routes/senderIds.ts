import express from 'express';
import { db } from '../db.ts';
import { authenticateUser } from './auth.ts';
import type { SenderID, User } from '../types.ts';

export const senderIdsRouter = express.Router();

// GET /api/sender-ids
senderIdsRouter.get('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  // Return platform default sender IDs + user's own approved/pending sender IDs
  const platformIds = db.getSenderIds().filter(s => s.user_id === 'usr_admin_001');
  const userIds = db.getSenderIds().filter(s => s.user_id === user.id);

  // Combine and deduplicate
  const combined = [...platformIds, ...userIds.filter(u => !platformIds.some(p => p.sender_id === u.sender_id))];
  res.json(combined);
});

// POST /api/sender-ids/request
senderIdsRouter.post('/request', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { sender_id, purpose, sample_message } = req.body;

  if (!sender_id || !purpose) {
    return res.status(400).json({ error: 'Sender ID (alphanumeric, max 11 chars) and intended purpose are required' });
  }

  const clean = sender_id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 3 || clean.length > 11) {
    return res.status(400).json({ error: 'Sender ID must be between 3 and 11 alphanumeric characters (UCC regulation)' });
  }

  const existing = db.getSenderIds().find(
    s => s.sender_id.toUpperCase() === clean && (s.user_id === user.id || s.status === 'approved')
  );

  if (existing) {
    return res.status(400).json({ error: `Sender ID "${clean}" has already been requested or registered.` });
  }

  const newSenderId: SenderID = {
    id: `sid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    sender_id: clean,
    status: 'pending',
    purpose: purpose.trim(),
    sample_message: sample_message?.trim() || '',
    created_at: new Date().toISOString(),
  };

  db.getSenderIds().unshift(newSenderId);
  db.persist();

  // Notify admin
  db.createNotification(
    user.id,
    'Sender ID Request Submitted',
    `Your request for "${clean}" has been submitted for UCC compliance review. Standard review time is 2-24 hours.`,
    'info'
  );

  res.status(201).json({
    message: 'Sender ID submitted for approval',
    senderId: newSenderId,
  });
});
