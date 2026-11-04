import { Router } from 'express';
import { db } from '../db.js';
import { authenticateUser } from './auth.js';
import { normalizeUgandanPhone } from '../sms/smsUtils.js';
import { Contact, ContactGroup, User } from '../types.js';

export const contactsRouter = Router();

// GET /api/contacts
contactsRouter.get('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { group_id, search, consent } = req.query;

  let contacts = db.getContacts().filter(c => c.user_id === user.id);

  if (group_id && group_id !== 'all') {
    contacts = contacts.filter(c => c.group_id === String(group_id));
  }

  if (consent && consent !== 'all') {
    contacts = contacts.filter(c => c.consent_status === String(consent));
  }

  if (search) {
    const q = String(search).toLowerCase();
    contacts = contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.phone_number.toLowerCase().includes(q) ||
      c.normalized_phone.toLowerCase().includes(q)
    );
  }

  res.json(contacts);
});

// POST /api/contacts
contactsRouter.post('/', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { name, phone_number, group_id, consent_status, tags } = req.body;

  if (!name || !phone_number) {
    return res.status(400).json({ error: 'Name and phone number are required' });
  }

  const phoneCheck = normalizeUgandanPhone(phone_number);
  if (!phoneCheck.isValid) {
    return res.status(400).json({ error: phoneCheck.error || 'Invalid Ugandan phone number' });
  }

  // Check duplicate
  const existing = db.getContacts().find(
    c => c.user_id === user.id && c.normalized_phone === phoneCheck.normalized
  );

  if (existing) {
    return res.status(400).json({ error: `A contact with phone number ${phoneCheck.normalized} already exists (${existing.name})` });
  }

  const newContact: Contact = {
    id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    name: name.trim(),
    phone_number: phone_number.trim(),
    normalized_phone: phoneCheck.normalized,
    group_id: group_id || undefined,
    consent_status: consent_status || 'opted_in',
    tags: Array.isArray(tags) ? tags : [],
    created_at: new Date().toISOString(),
  };

  db.getContacts().unshift(newContact);

  // Update group count
  if (group_id) {
    const group = db.getContactGroups().find(g => g.id === group_id);
    if (group) group.contact_count++;
  }

  db.persist();
  res.status(201).json(newContact);
});

// PUT /api/contacts/:id
contactsRouter.put('/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;
  const { name, phone_number, group_id, consent_status, tags } = req.body;

  const contact = db.getContacts().find(c => c.id === id && c.user_id === user.id);
  if (!contact) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  if (phone_number && phone_number !== contact.phone_number) {
    const check = normalizeUgandanPhone(phone_number);
    if (!check.isValid) {
      return res.status(400).json({ error: check.error || 'Invalid phone number' });
    }
    contact.phone_number = phone_number.trim();
    contact.normalized_phone = check.normalized;
  }

  if (name) contact.name = name.trim();
  if (group_id !== undefined) contact.group_id = group_id || undefined;
  if (consent_status) contact.consent_status = consent_status;
  if (Array.isArray(tags)) contact.tags = tags;

  db.persist();
  res.json(contact);
});

// DELETE /api/contacts/:id
contactsRouter.delete('/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const idx = db.getContacts().findIndex(c => c.id === id && c.user_id === user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  const [removed] = db.getContacts().splice(idx, 1);
  if (removed.group_id) {
    const group = db.getContactGroups().find(g => g.id === removed.group_id);
    if (group && group.contact_count > 0) group.contact_count--;
  }

  db.persist();
  res.json({ message: 'Contact deleted' });
});

// POST /api/contacts/import-csv
contactsRouter.post('/import-csv', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { rows, group_id, default_consent = 'opted_in' } = req.body;

  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'No contact records provided' });
  }

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  const existingPhones = new Set(
    db.getContacts().filter(c => c.user_id === user.id).map(c => c.normalized_phone)
  );

  for (const item of rows) {
    const rawName = item.name || item.fullName || item.contact || 'Customer';
    const rawPhone = item.phone || item.mobile || item.number || item.telephone || '';

    if (!rawPhone) {
      skipped++;
      continue;
    }

    const check = normalizeUgandanPhone(String(rawPhone));
    if (!check.isValid) {
      skipped++;
      continue;
    }

    if (existingPhones.has(check.normalized)) {
      duplicates++;
      continue;
    }

    existingPhones.add(check.normalized);
    const newContact: Contact = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      name: String(rawName).trim(),
      phone_number: String(rawPhone).trim(),
      normalized_phone: check.normalized,
      group_id: group_id || undefined,
      consent_status: default_consent,
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags : [String(item.tags)]) : ['CSV Import'],
      created_at: new Date().toISOString(),
    };

    db.getContacts().unshift(newContact);
    imported++;
  }

  if (group_id && imported > 0) {
    const group = db.getContactGroups().find(g => g.id === group_id);
    if (group) group.contact_count += imported;
  }

  db.persist();

  res.json({
    message: `Import completed: ${imported} contacts added`,
    summary: { imported, skipped, duplicates },
  });
});

// GET /api/contacts/groups
contactsRouter.get('/groups', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const groups = db.getContactGroups().filter(g => g.user_id === user.id);
  res.json(groups);
});

// POST /api/contacts/groups
contactsRouter.post('/groups', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Group name is required' });
  }

  const newGroup: ContactGroup = {
    id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: user.id,
    name: name.trim(),
    description: description?.trim() || '',
    contact_count: 0,
    created_at: new Date().toISOString(),
  };

  db.getContactGroups().push(newGroup);
  db.persist();
  res.status(201).json(newGroup);
});

// DELETE /api/contacts/groups/:id
contactsRouter.delete('/groups/:id', authenticateUser, (req, res) => {
  const user = (req as any).user as User;
  const { id } = req.params;

  const idx = db.getContactGroups().findIndex(g => g.id === id && g.user_id === user.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Group not found' });
  }

  db.getContactGroups().splice(idx, 1);
  // Clear group reference from contacts
  db.getContacts().forEach(c => {
    if (c.user_id === user.id && c.group_id === id) {
      c.group_id = undefined;
    }
  });

  db.persist();
  res.json({ message: 'Group deleted' });
});
