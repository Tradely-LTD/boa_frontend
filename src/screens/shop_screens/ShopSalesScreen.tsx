import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import {
  useListShopSalesQuery, useCreateShopSaleMutation,
  useGetShopInventoryQuery, type ShopSale,
} from './services/shopApiSlice';

const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer', 'pos'];
const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const today = new Date().toISOString().slice(0, 10);

export default function ShopSalesScreen() {
  const user   = useSelector((s: RootState) => s.auth.user);
  const shopId = (user as any)?.shopId as number;
  const isOwner = user?.role === 'shop_owner';

  const { data: salesData, isLoading }      = useListShopSalesQuery(shopId, { skip: !shopId });
  const { data: inventoryData }             = useGetShopInventoryQuery(shopId, { skip: !shopId });
  const [createSale, { isLoading: submitting }] = useCreateShopSaleMutation();

  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<ShopSale | null>(null);
  const [filterDate, setFilterDate] = useState(today);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    intakeId: '', commodity: '', quantityKg: '', pricePerKg: '',
    buyerName: '', buyerPhone: '', paymentMethod: 'cash', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const allSales  = salesData?.data ?? [];
  const inventory = (inventoryData?.data ?? []).filter(i => (i.availableKg ?? 0) > 0);

  const filteredSales = allSales.filter(s => s.createdAt.slice(0, 10) === filterDate);
  const todayRevenue  = filteredSales.reduce((s, sale) => s + parseFloat(sale.totalAmount), 0);

  const selectedIntake = inventory.find(i => String(i.id) === form.intakeId);

  const handleIntakeSelect = (id: string) => {
    set('intakeId', id);
    if (id) {
      const intake = inventory.find(i => String(i.id) === id);
      if (intake) set('commodity', intake.commodity);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createSale({
        shopId,
        commodity:     form.commodity,
        quantityKg:    parseFloat(form.quantityKg),
        pricePerKg:    parseFloat(form.pricePerKg),
        intakeId:      form.intakeId ? parseInt(form.intakeId) : undefined,
        buyerName:     form.buyerName  || undefined,
        buyerPhone:    form.buyerPhone || undefined,
        paymentMethod: form.paymentMethod,
        notes:         form.notes || undefined,
      }).unwrap();
      setShowForm(false);
      setForm({ intakeId: '', commodity: '', quantityKg: '', pricePerKg: '', buyerName: '', buyerPhone: '', paymentMethod: 'cash', notes: '' });
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to record sale.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Sales</h1>
          <p className="text-slate-500 text-sm mt-0.5">Record and track shop sales</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
          <span className="material-symbols-outlined text-base">add</span>
          Make a Sale
        </button>
      </div>

      {/* Date filter + daily summary */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Date:</label>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
        <div className="flex gap-3">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm">
            <span className="text-emerald-600 font-semibold">{filteredSales.length}</span>
            <span className="text-emerald-500 ml-1">sales</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-sm">
            <span className="text-emerald-600 font-semibold">{fmt(todayRevenue)}</span>
            <span className="text-emerald-500 ml-1">total</span>
          </div>
        </div>
      </div>

      {/* Sales table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : filteredSales.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            <p className="text-slate-400 text-sm mt-2">No sales on this date</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Buyer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{sale.receiptNumber}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{sale.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-600">{parseFloat(sale.quantityKg).toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{fmt(parseFloat(sale.totalAmount))}</td>
                    <td className="px-5 py-3.5 text-slate-600">{sale.buyerName ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        sale.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' :
                        sale.paymentMethod === 'mobile_money' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {sale.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(sale)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Make Sale Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Make a Sale</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* From inventory or manual */}
              {inventory.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Inventory (optional)</label>
                  <select value={form.intakeId} onChange={e => handleIntakeSelect(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                    <option value="">— Select intake batch —</option>
                    {inventory.map(i => (
                      <option key={i.id} value={i.id}>
                        {i.commodity} · {(i.availableKg ?? 0).toLocaleString()} kg available
                        {i.gradeQuality ? ` (${i.gradeQuality})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedIntake && (
                    <p className="text-xs text-emerald-600 mt-1">Available: {(selectedIntake.availableKg ?? 0).toLocaleString()} kg</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Commodity <span className="text-red-400">*</span></label>
                <input value={form.commodity} onChange={e => set('commodity', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="e.g. Maize" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (kg) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.1" step="0.1" value={form.quantityKg}
                    onChange={e => set('quantityKg', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price / kg (₦) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.01" step="0.01" value={form.pricePerKg}
                    onChange={e => set('pricePerKg', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="e.g. 500" />
                </div>
              </div>

              {form.quantityKg && form.pricePerKg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
                  Total: <strong>{fmt(parseFloat(form.quantityKg) * parseFloat(form.pricePerKg))}</strong>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Buyer (optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Buyer Name</label>
                  <input value={form.buyerName} onChange={e => set('buyerName', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input value={form.buyerPhone} onChange={e => set('buyerPhone', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="08012345678" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Additional notes…" />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {submitting ? 'Recording…' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">Sale Receipt</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.receiptNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 text-sm">
              <Section label="Sale Details">
                <Field label="Commodity"    value={selected.commodity} />
                <Field label="Quantity"     value={`${parseFloat(selected.quantityKg).toLocaleString()} kg`} />
                <Field label="Price / kg"   value={`₦${parseFloat(selected.pricePerKg).toLocaleString()}`} />
                <Field label="Total"        value={fmt(parseFloat(selected.totalAmount))} />
                <Field label="Payment"      value={selected.paymentMethod.replace('_', ' ')} />
                <Field label="Date"         value={selected.createdAt.slice(0, 10)} />
              </Section>
              {(selected.buyerName || selected.buyerPhone) && (
                <Section label="Buyer">
                  <Field label="Name"  value={selected.buyerName} />
                  <Field label="Phone" value={selected.buyerPhone} />
                </Section>
              )}
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
