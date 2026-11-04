import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { api } from '../../lib/api';
import { Contact, ContactGroup } from '../../types';
import { PhoneInput } from '../../components/sms/PhoneInput';
import {
  Users,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

interface ContactsPageProps {
  onNavigate: (page: string) => void;
}

export const ContactsPage: React.FC<ContactsPageProps> = ({ onNavigate }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedConsent, setSelectedConsent] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    normalizedPhone: '',
    isValidPhone: false,
    group_id: '',
    consent_status: 'opted_in',
    tags: '',
  });

  const [importRows, setImportRows] = useState<any[]>([]);
  const [importGroupId, setImportGroupId] = useState<string>('');
  const [importSummary, setImportSummary] = useState<string>('');
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    try {
      const [cList, gList] = await Promise.all([
        api.contacts.list({
          search: search || undefined,
          group_id: selectedGroup !== 'all' ? selectedGroup : undefined,
          consent: selectedConsent !== 'all' ? selectedConsent : undefined,
        }),
        api.contacts.groups(),
      ]);
      setContacts(cList);
      setGroups(gList);
    } catch {
      console.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedGroup, selectedConsent]);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.isValidPhone) {
      setError('Please provide a valid contact name and Ugandan mobile phone number.');
      return;
    }

    try {
      if (editingContact) {
        await api.contacts.update(editingContact.id, {
          name: formData.name,
          phone_number: formData.normalizedPhone,
          group_id: formData.group_id || undefined,
          consent_status: formData.consent_status as any,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
      } else {
        await api.contacts.create({
          name: formData.name,
          phone_number: formData.normalizedPhone,
          group_id: formData.group_id || undefined,
          consent_status: formData.consent_status as any,
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        });
      }

      setShowAddModal(false);
      setEditingContact(null);
      setFormData({
        name: '',
        phone: '',
        normalizedPhone: '',
        isValidPhone: false,
        group_id: '',
        consent_status: 'opted_in',
        tags: '',
      });
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error saving contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      await api.contacts.delete(id);
      loadData();
    }
  };

  const handleExportCsv = () => {
    if (contacts.length === 0) return;
    const csv = Papa.unparse(
      contacts.map(c => ({
        Name: c.name,
        Phone: c.phone_number,
        Normalized: c.normalized_phone,
        Consent: c.consent_status,
        Tags: (c.tags || []).join('; '),
        DateAdded: c.created_at,
      }))
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ICON_SEND_Contacts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileParse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImportRows(results.data as any[]);
      },
    });
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0) return;
    try {
      const res = await api.contacts.importCsv({
        rows: importRows,
        group_id: importGroupId || undefined,
      });
      setImportSummary(res.message);
      setImportRows([]);
      setShowImportModal(false);
      loadData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Customer Contact Book
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Manage numbers, consent permissions, and marketing opt-ins.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingContact(null);
                setFormData({
                  name: '',
                  phone: '',
                  normalizedPhone: '',
                  isValidPhone: false,
                  group_id: '',
                  consent_status: 'opted_in',
                  tags: '',
                });
                setShowAddModal(true);
              }}
              className="bg-neutral-950 text-white px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="border border-neutral-300 text-neutral-900 px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="border border-neutral-300 text-neutral-900 px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-100 transition-colors inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {importSummary && (
        <div className="p-3 bg-neutral-100 border border-neutral-300 text-xs font-mono text-neutral-900 flex justify-between items-center">
          <span>{importSummary}</span>
          <button onClick={() => setImportSummary('')} className="text-neutral-500 hover:text-neutral-900">&times;</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or phone..."
              className="w-full text-xs px-3 py-2 pl-8 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
          </div>

          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
            >
              <option value="all">All Groups ({contacts.length})</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.contact_count})</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedConsent}
              onChange={(e) => setSelectedConsent(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
            >
              <option value="all">All Consent Statuses</option>
              <option value="opted_in">Opted In (Eligible for Marketing)</option>
              <option value="opted_out">Opted Out (Unsubscribed)</option>
              <option value="pending">Pending Consent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Full Name</th>
                <th className="p-3">Phone Number</th>
                <th className="p-3">Group</th>
                <th className="p-3">Consent Status</th>
                <th className="p-3">Tags</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    No contacts found. Click "Add Contact" or "Import CSV" to populate your address book.
                  </td>
                </tr>
              ) : (
                contacts.map((c) => {
                  const grp = groups.find(g => g.id === c.group_id);
                  return (
                    <tr key={c.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-bold text-neutral-950 font-sans text-xs">{c.name}</td>
                      <td className="p-3 font-semibold text-neutral-900">{c.normalized_phone}</td>
                      <td className="p-3 text-neutral-600">
                        {grp ? grp.name : <span className="text-neutral-400">Unassigned</span>}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            c.consent_status === 'opted_in'
                              ? 'bg-neutral-950 text-white'
                              : c.consent_status === 'opted_out'
                              ? 'bg-neutral-200 text-neutral-800'
                              : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                          }`}
                        >
                          {c.consent_status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-500">
                        {(c.tags || []).join(', ') || '-'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingContact(c);
                            setFormData({
                              name: c.name,
                              phone: c.phone_number,
                              normalizedPhone: c.normalized_phone,
                              isValidPhone: true,
                              group_id: c.group_id || '',
                              consent_status: c.consent_status,
                              tags: (c.tags || []).join(', '),
                            });
                            setShowAddModal(true);
                          }}
                          className="text-neutral-600 hover:text-neutral-950 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-neutral-400 hover:text-neutral-950 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                {editingContact ? 'Edit Contact' : 'Add New Contact'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nabukenya Joan"
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                />
              </div>

              <PhoneInput
                value={formData.phone}
                onChange={(raw, norm, valid) => {
                  setFormData({ ...formData, phone: raw, normalizedPhone: norm, isValidPhone: valid });
                }}
              />

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Contact Group</label>
                <select
                  value={formData.group_id}
                  onChange={(e) => setFormData({ ...formData, group_id: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
                >
                  <option value="">No Group (Unassigned)</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Consent Status</label>
                <select
                  value={formData.consent_status}
                  onChange={(e) => setFormData({ ...formData, consent_status: e.target.value })}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
                >
                  <option value="opted_in">Opted In (Authorized for SMS marketing)</option>
                  <option value="opted_out">Opted Out (Unsubscribed)</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Retail, VIP, Kampala"
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-neutral-300 text-xs font-mono font-medium hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-950 text-white text-xs font-mono font-medium hover:bg-neutral-800"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                Bulk CSV Contact Import
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportRows([]);
                }}
                className="text-neutral-400 hover:text-neutral-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-neutral-600">
                Upload a CSV file containing your customer list. The system will automatically map columns like "name", "phone", or "mobile" and normalize Ugandan prefixes.
              </p>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Target Group</label>
                <select
                  value={importGroupId}
                  onChange={(e) => setImportGroupId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-neutral-300 bg-white font-mono focus:outline-none focus:border-neutral-950"
                >
                  <option value="">Unassigned</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className="p-4 border-2 border-dashed border-neutral-300 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileParse}
                  className="text-xs font-mono"
                />
              </div>

              {importRows.length > 0 && (
                <div className="p-3 bg-neutral-50 border border-neutral-200 text-xs font-mono">
                  <span>Detected <strong>{importRows.length}</strong> rows ready to import.</span>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportRows([]);
                  }}
                  className="px-4 py-2 border border-neutral-300 text-xs font-mono font-medium hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={importRows.length === 0}
                  onClick={handleConfirmImport}
                  className="px-4 py-2 bg-neutral-950 text-white text-xs font-mono font-medium hover:bg-neutral-800 disabled:opacity-40"
                >
                  Import {importRows.length} Contacts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
