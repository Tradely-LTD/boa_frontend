import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import {
  useGetCommodityPricesQuery, useUpsertCommodityPriceMutation, useDeleteCommodityPriceMutation,
  type CommodityPrice,
} from '../../loan_screens/services/loanApiSlice';

const COMMODITY_OPTIONS = ['Maize', 'Soybean', 'Sorghum', 'Rice', 'Groundnut', 'Millet', 'Cowpea', 'Wheat'];
const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function CommodityPricesScreen() {
  const user    = useSelector((s: RootState) => s.auth.user);
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin';

  const { data, isLoading }                              = useGetCommodityPricesQuery();
  const [upsertPrice,  { isLoading: saving }]            = useUpsertCommodityPriceMutation();
  const [deletePrice,  { isLoading: deleting }]          = useDeleteCommodityPriceMutation();

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<CommodityPrice | null>(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ commodity: '', pricePerKg: '', notes: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const prices = data?.data ?? [];
  const globalPrices = prices.filter(p => !p.centreId);
  const centrePrices = prices.filter(p => !!p.centreId);

  const openCreate = () => {
    setEditing(null);
    setForm({ commodity: '', pricePerKg: '', notes: '' });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (price: CommodityPrice) => {
    setEditing(price);
    setForm({ commodity: price.commodity, pricePerKg: String(price.pricePerKg), notes: price.notes ?? '' });
    setFormError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await upsertPrice({
        commodity:  form.commodity,
        pricePerKg: parseFloat(form.pricePerKg),
        centreId:   editing?.centreId ?? undefined,
        notes:      form.notes || undefined,
      }).unwrap();
      setShowForm(false);
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to save price.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this price entry?')) return;
    await deletePrice(id);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Commodity Prices</h1>
          <p className="text-slate-500 text-sm mt-0.5">Set market prices used to calculate loan collateral values (70% LTV cap)</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
          <span className="material-symbols-outlined text-base">add</span>
          Set Price
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 mb-6">
        <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
        These prices are used to calculate maximum loan amounts. Loans are capped at <strong>70%</strong> of total collateral value.
        Centre-specific prices override global prices for that centre.
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Global prices */}
          <PriceTable
            title="Global Prices"
            subtitle="Apply to all centres unless overridden"
            prices={globalPrices}
            isSuperAdmin={isSuperAdmin}
            onEdit={openEdit}
            onDelete={handleDelete}
          />

          {centrePrices.length > 0 && (
            <PriceTable
              title="Centre-Specific Prices"
              subtitle="Override global prices for specific centres"
              prices={centrePrices}
              isSuperAdmin={isSuperAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          )}

          {prices.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">price_change</span>
              <p className="text-slate-400 text-sm mt-2">No commodity prices set yet</p>
              <button onClick={openCreate} className="mt-3 text-boa-green text-sm font-medium hover:underline">
                Set first price
              </button>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">{editing ? 'Update Price' : 'Set Commodity Price'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commodity <span className="text-red-400">*</span></label>
                <select value={form.commodity} onChange={e => set('commodity', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white"
                  disabled={!!editing}>
                  <option value="">Select commodity…</option>
                  {COMMODITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {editing && <p className="text-xs text-slate-400 mt-1">Commodity cannot be changed. Create a new entry to set a different commodity.</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Price per kg (₦) <span className="text-red-400">*</span></label>
                <input type="number" min="0.01" step="0.01" value={form.pricePerKg}
                  onChange={e => set('pricePerKg', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="e.g. 450.00" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="e.g. Based on commodity exchange as of today" />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {saving ? 'Saving…' : editing ? 'Update Price' : 'Set Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function PriceTable({
  title, subtitle, prices, isSuperAdmin, onEdit, onDelete,
}: {
  title: string;
  subtitle: string;
  prices: CommodityPrice[];
  isSuperAdmin: boolean;
  onEdit: (p: CommodityPrice) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      {prices.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-sm">None set</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price / kg</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Updated</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {prices.map(p => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{p.commodity}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-700">{fmt(p.pricePerKg)}</td>
                  <td className="px-5 py-3.5 text-slate-400 max-w-[200px] truncate">{p.notes ?? '—'}</td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{p.updatedAt?.slice(0, 10) ?? p.createdAt?.slice(0, 10)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => onEdit(p)} className="text-boa-green text-xs font-medium hover:underline">Edit</button>
                      {isSuperAdmin && (
                        <button onClick={() => onDelete(p.id)} className="text-red-500 text-xs font-medium hover:underline">Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
