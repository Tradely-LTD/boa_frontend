import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useGetShopInventoryQuery, useCreateShopIntakeMutation, type ShopIntake } from './services/shopApiSlice';

const COMMODITY_OPTIONS = ['Maize', 'Soybean', 'Sorghum', 'Rice', 'Groundnut', 'Millet', 'Cowpea', 'Wheat'];
const GRADE_OPTIONS     = ['Grade A', 'Grade B', 'Grade C'];

export default function ShopInventoryScreen() {
  const user   = useSelector((s: RootState) => s.auth.user);
  const shopId = (user as any)?.shopId as number;
  const isOwner = user?.role === 'shop_owner';

  const { data, isLoading, refetch } = useGetShopInventoryQuery(shopId, { skip: !shopId });
  const [logIntake, { isLoading: submitting }]  = useCreateShopIntakeMutation();

  const [showForm, setShowForm]     = useState(false);
  const [selected, setSelected]     = useState<ShopIntake | null>(null);
  const [formError, setFormError]   = useState('');
  const [form, setForm] = useState({
    commodity: '', quantityKg: '', gradeQuality: '', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const inventory = data?.data ?? [];
  const totalKg    = inventory.reduce((s, i) => s + parseFloat(i.quantityKg), 0);
  const availableKg = inventory.reduce((s, i) => s + (i.availableKg ?? parseFloat(i.quantityKg)), 0);
  const soldKg      = inventory.reduce((s, i) => s + (i.soldKg ?? 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await logIntake({
        shopId,
        commodity:    form.commodity,
        quantityKg:   parseFloat(form.quantityKg),
        gradeQuality: form.gradeQuality || undefined,
        notes:        form.notes        || undefined,
      }).unwrap();
      setShowForm(false);
      setForm({ commodity: '', quantityKg: '', gradeQuality: '', notes: '' });
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to log intake.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Stock received and available for sale</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
          <span className="material-symbols-outlined text-base">add</span>
          Log Intake
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Received" value={`${totalKg.toLocaleString()} kg`}    icon="inventory_2"   color="bg-slate-50 text-slate-700 border-slate-200" />
        <StatCard label="Available"      value={`${availableKg.toLocaleString()} kg`} icon="scale"         color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard label="Sold"           value={`${soldKg.toLocaleString()} kg`}      icon="shopping_cart" color="bg-blue-50 text-blue-700 border-blue-200" />
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : inventory.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
            <p className="text-slate-400 text-sm mt-2">No stock recorded yet</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-boa-green text-sm font-medium hover:underline">Log first intake</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sold</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventory.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">{item.refId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{item.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-500">{item.gradeQuality ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{parseFloat(item.quantityKg).toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 text-slate-600">{(item.soldKg ?? 0).toLocaleString()} kg</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${(item.availableKg ?? 0) > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                        {(item.availableKg ?? parseFloat(item.quantityKg)).toLocaleString()} kg
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{item.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(item)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Intake Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Log Intake</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commodity <span className="text-red-400">*</span></label>
                <select value={form.commodity} onChange={e => set('commodity', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                  <option value="">Select commodity…</option>
                  {COMMODITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (kg) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.1" step="0.1" value={form.quantityKg}
                    onChange={e => set('quantityKg', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="e.g. 500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                  <select value={form.gradeQuality} onChange={e => set('gradeQuality', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                    <option value="">Not specified</option>
                    {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Source, condition, etc." />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {submitting ? 'Logging…' : 'Log Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">Intake Detail</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.refId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 text-sm">
              <Section label="Stock">
                <Field label="Commodity"  value={selected.commodity} />
                <Field label="Grade"      value={selected.gradeQuality} />
                <Field label="Received"   value={`${parseFloat(selected.quantityKg).toLocaleString()} kg`} />
                <Field label="Sold"       value={`${(selected.soldKg ?? 0).toLocaleString()} kg`} />
                <Field label="Available"  value={`${(selected.availableKg ?? parseFloat(selected.quantityKg)).toLocaleString()} kg`} />
                <Field label="Logged on"  value={selected.createdAt.slice(0, 10)} />
              </Section>
              {selected.notes && <Section label="Notes"><p className="text-slate-700">{selected.notes}</p></Section>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  const [bg, text, border] = color.split(' ');
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${text}`}>{label}</p>
          <p className={`text-xl font-bold mt-1 ${text}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined text-2xl opacity-60 ${text}`}>{icon}</span>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{label}</p>
      <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{String(value)}</span>
    </div>
  );
}
