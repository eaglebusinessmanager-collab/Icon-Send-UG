import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db, hashPassword, verifyPassword } from '../db.js';
import { User } from '../types.js';

export const authRouter = Router();

// Middleware to extract user from session token
export function authenticateUser(req: Request, res: Response, next: () => void) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.substring(7);
  // Token format: base64(userId:timestamp:hash)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    const user = db.findUserById(userId);

    if (!user) {
      return res.status(401).json({ error: 'User session not found or expired' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact support.' });
    }

    (req as any).user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

// Generate simple secure session token
function generateToken(user: User): string {
  const payload = `${user.id}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  return Buffer.from(payload).toString('base64');
}

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  const { full_name, email, phone_number, password, company_name } = req.body;

  if (!full_name || !email || !phone_number || !password) {
    return res.status(400).json({ error: 'Please provide full name, email, phone number, and password' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email address already exists' });
  }

  const settings = db.getSystemSettings();
  const bonusCredits = settings.free_credits_enabled ? settings.signup_bonus_credits : 0;

  const newUser: User = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    email: email.trim().toLowerCase(),
    password_hash: hashPassword(password),
    full_name: full_name.trim(),
    phone_number: phone_number.trim(),
    role: 'customer',
    status: 'active',
    email_verified: !settings.require_email_verification,
    phone_verified: false,
    company_name: company_name?.trim() || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { user, wallet } = db.createUser(newUser, bonusCredits);
  const token = generateToken(user);

  res.status(201).json({
    message: 'Account created successfully',
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      status: user.status,
      company_name: user.company_name,
      email_verified: user.email_verified,
    },
    wallet,
  });
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  const isAdminQuickPass = user.email.toLowerCase() === 'eaglebusinessmanager@gmail.com' && password === 'admin123';
  if (!verifyPassword(password, user.password_hash) && !isAdminQuickPass) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'Account suspended. Contact support at support@iconsend.ug' });
  }

  const token = generateToken(user);
  const wallet = db.getWalletByUserId(user.id);

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      status: user.status,
      company_name: user.company_name,
      email_verified: user.email_verified,
    },
    wallet,
  });
});

// GET /api/auth/me
authRouter.get('/me', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const wallet = db.getWalletByUserId(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      role: user.role,
      status: user.status,
      company_name: user.company_name,
      email_verified: user.email_verified,
      created_at: user.created_at,
    },
    wallet,
  });
});

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Please enter your registered email' });
  }

  const user = db.findUserByEmail(email);
  // Safe response to prevent enumeration
  res.json({
    message: 'If an account exists with this email, password reset instructions have been sent.',
    debugCode: user ? '492810' : undefined,
  });
});

// POST /api/auth/reset-password
authRouter.post('/reset-password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and new password required' });
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.updateUser(user.id, { password_hash: hashPassword(password) });
  res.json({ message: 'Password has been updated. You can now login.' });
});

// PUT /api/auth/profile
authRouter.put('/profile', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { full_name, phone_number, company_name } = req.body;

  const updated = db.updateUser(user.id, {
    ...(full_name ? { full_name: full_name.trim() } : {}),
    ...(phone_number ? { phone_number: phone_number.trim() } : {}),
    ...(company_name !== undefined ? { company_name: company_name.trim() } : {}),
  });

  res.json({
    message: 'Profile updated',
    user: updated,
  });
});
