import { Router } from 'express';
import { db } from '../db.js';
import { authenticateUser } from './auth.js';
import { User } from '../types.js';

export const notificationsRouter = Router();

// GET /api/notifications
notificationsRouter.get('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const notifs = db.getNotifications().filter(n => n.user_id === user.id);
  res.json(notifs);
});

// PUT /api/notifications/:id/read
notificationsRouter.put('/:id/read', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const notif = db.getNotifications().find(n => n.id === id && n.user_id === user.id);
  if (notif) {
    notif.is_read = true;
    db.persist();
  }
  res.json({ success: true });
});

// PUT /api/notifications/read-all
notificationsRouter.put('/read-all', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  db.getNotifications().forEach(n => {
    if (n.user_id === user.id) n.is_read = true;
  });
  db.persist();
  res.json({ success: true });
});
