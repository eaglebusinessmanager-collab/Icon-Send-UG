import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { ContactGroup } from '../../types';
import { FolderOpen, Plus, Trash2, Users, X } from 'lucide-react';

interface ContactGroupsPageProps {
  onNavigate: (page: string) => void;
}

export const ContactGroupsPage: React.FC<ContactGroupsPageProps> = ({ onNavigate }) => {
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const loadGroups = async () => {
    try {
      const list = await api.contacts.groups();
      setGroups(list);
    } catch {
      console.error('Failed to load contact groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a group name');
      return;
    }

    try {
      await api.contacts.createGroup({ name, description });
      setName('');
      setDescription('');
      setShowAddModal(false);
      loadGroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error creating group');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this contact group? (Contacts inside will become unassigned)')) {
      await api.contacts.deleteGroup(id);
      loadGroups();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              Contact Groups & Audiences
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Segment your recipients for one-click bulk campaign broadcasts.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-neutral-950 text-white px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-800 transition-colors inline-flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full bg-white border border-neutral-200 p-12 text-center text-xs text-neutral-500">
            No contact groups created yet. Create one to segment your audience.
          </div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="bg-white border border-neutral-200 p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-4 h-4 text-neutral-900" />
                    <h3 className="text-sm font-bold text-neutral-950">{group.name}</h3>
                  </div>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-neutral-400 hover:text-neutral-950 p-1"
                    title="Delete group"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  {group.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-500">
                  <strong className="text-neutral-950 font-bold">{group.contact_count}</strong> Contacts
                </span>
                <button
                  onClick={() => onNavigate('bulk_sms')}
                  className="text-neutral-950 font-bold underline hover:text-neutral-700"
                >
                  Send Campaign &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                Create New Contact Group
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2 text-xs bg-neutral-100 border border-neutral-300 text-neutral-900">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VIP Wholesale Clients"
                  className="w-full text-sm px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief note about who belongs in this segment..."
                  className="w-full text-sm p-3 border border-neutral-300 focus:outline-none focus:border-neutral-950"
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
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
