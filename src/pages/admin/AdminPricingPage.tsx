import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { SMSPackage } from '../../types';
import { CreditCard, Plus, Edit2, Check, X } from 'lucide-react';

export const AdminPricingPage: React.FC = () => {
  const [packages, setPackages] = useState<SMSPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<SMSPackage | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [formData, setFormData] = useState({
    name: '',
    price_ugx: 5000,
    credits: 125,
    bonus_credits: 5,
    is_popular: false,
    is_active: true,
    description: '',
  });

  const loadPackages = async () => {
    try {
      const list = await api.admin.packages();
      setPackages(list);
    } catch {
      console.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMessage('');
      if (editingPkg) {
        await api.admin.updatePackage(editingPkg.id, formData);
      } else {
        await api.admin.createPackage(formData);
      }
      setShowModal(false);
      setEditingPkg(null);
      loadPackages();
    } catch {
      setErrorMessage('Error saving package. Please check the values and try again.');
    }
  };

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex justify-between items-center">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="text-red-500 hover:text-red-700 font-bold ml-2">✕</button>
        </div>
      )}
      <div className="bg-white border border-neutral-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
              SMS Credit Pricing & Package Management
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-0.5">
              Control selling prices in Uganda Shillings (UGX), credit allocations, and promotional bonuses.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingPkg(null);
              setFormData({
                name: '',
                price_ugx: 10000,
                credits: 260,
                bonus_credits: 20,
                is_popular: false,
                is_active: true,
                description: '',
              });
              setShowModal(true);
            }}
            className="bg-neutral-950 text-white px-3 py-2 text-xs font-mono font-medium hover:bg-neutral-800 cursor-pointer inline-flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Package</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
              <tr>
                <th className="p-3">Package Name</th>
                <th className="p-3">Price (UGX)</th>
                <th className="p-3">Standard Credits</th>
                <th className="p-3">Bonus Credits</th>
                <th className="p-3">Rate / SMS</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-neutral-50">
                  <td className="p-3">
                    <span className="font-bold text-neutral-950 block">{pkg.name}</span>
                    {pkg.is_popular && (
                      <span className="text-[10px] font-bold uppercase text-neutral-600">
                        * Highlighted as Most Popular
                      </span>
                    )}
                  </td>
                  <td className="p-3 font-bold text-neutral-950">
                    UGX {pkg.price_ugx.toLocaleString()}
                  </td>
                  <td className="p-3 text-neutral-800">{pkg.credits}</td>
                  <td className="p-3 text-neutral-950 font-semibold">+{pkg.bonus_credits || 0}</td>
                  <td className="p-3 text-neutral-600">~UGX {pkg.rate_per_sms}</td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        pkg.is_active ? 'bg-neutral-950 text-white' : 'bg-neutral-200 text-neutral-800'
                      }`}
                    >
                      {pkg.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditingPkg(pkg);
                        setFormData({
                          name: pkg.name,
                          price_ugx: pkg.price_ugx,
                          credits: pkg.credits,
                          bonus_credits: pkg.bonus_credits,
                          is_popular: pkg.is_popular,
                          is_active: pkg.is_active,
                          description: pkg.description || '',
                        });
                        setShowModal(true);
                      }}
                      className="border border-neutral-300 px-2.5 py-1 text-[11px] hover:bg-neutral-100 cursor-pointer"
                    >
                      Edit Package
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="text-sm font-bold font-mono uppercase text-neutral-950">
                {editingPkg ? 'Edit Package' : 'Create SMS Package'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-neutral-400 hover:text-neutral-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-neutral-700 font-bold mb-1">Package Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Starter Tier"
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Price (UGX) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price_ugx}
                    onChange={(e) => setFormData({ ...formData, price_ugx: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                  />
                </div>
                <div>
                  <label className="block text-neutral-700 font-bold mb-1">Standard Credits *</label>
                  <input
                    type="number"
                    required
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Promotional Bonus Credits</label>
                <input
                  type="number"
                  value={formData.bonus_credits}
                  onChange={(e) => setFormData({ ...formData, bonus_credits: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-neutral-950"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief note about target business audience..."
                  className="w-full p-2 border border-neutral-300 focus:outline-none focus:border-neutral-950 font-sans"
                />
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="accent-neutral-950"
                  />
                  <span>Mark as Popular</span>
                </label>
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="accent-neutral-950"
                  />
                  <span>Active & Visible</span>
                </label>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-neutral-300 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-950 text-white hover:bg-neutral-800"
                >
                  Save Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
