import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useListShopExpensesQuery, useCreateShopExpenseMutation, type ShopExpense } from './services/shopApiSlice';

const CATEGORIES = ['Rent', 'Labour', 'Transport', 'Packaging', 'Storage', 'Utilities', 'Maintenance', 'Other'];
const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const today = new Date().toISOString().slice(0, 10);

export default function ShopExpensesScreen() {
  const user    = useSelector((s: RootState) => s.auth.user);
  const shopId  = (user as any)?.shopId as number;
  const isOwner = user?.role === 'shop_owner';

  const { data, isLoading }                       = useListShopExpensesQuery(shopId, { skip: !shopId });
  const [createExpense, { isLoading: submitting }] = useCreateShopExpenseMutation();

  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]   = useState<ShopExpense | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ category: '', amount: '', description: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const allExpenses = data?.data ?? [];
  const myId = user?.userId;

  const filtered = allExpenses.filter(e => {
    const byDate   = filterDate ? e.createdAt.slice(0, 10) === filterDate : true;
    const byUser   = isOwner    ? true : e.loggedBy === myId;
    return byDate && byUser;
  });

  const totalToday = allExpenses.filter(e => {
    const isToday = e.createdAt.slice(0, 10) === today;
    return isToday && (isOwner ? true : e.loggedBy === myId);
  }).reduce((s, e) => s + parseFloat(e.amount), 0);

  const totalAll = filtered.reduce((s, e) => s + parseFloat(e.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createExpense({
        shopId,
        category:    form.category,
        amount:      parseFloat(form.amount),
        description: form.description || undefined,
      }).unwrap();
      setShowForm(false);
      setForm({ category: '', amount: '', description: '' });
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to log expense.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Expenses</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track shop operating expenses</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition">
          <span className="material-symbols-outlined text-base">add</span>
          Log Expense
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide">Today's Expenses</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{fmt(totalToday)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{filterDate ? 'Filtered Total' : 'All Time'}</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">{fmt(totalAll)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Date:</label>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
        </div>
        {filterDate && (
          <button onClick={() => setFilterDate('')} className="text-xs text-slate-400 hover:text-slate-600 underline">Clear</button>
        )}
      </div>

      {/* Expenses table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt</span>
            <p className="text-slate-400 text-sm mt-2">No expenses recorded{filterDate ? ' on this date' : ''}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">{exp.category}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">{exp.description ?? '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-red-700">{fmt(parseFloat(exp.amount))}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{exp.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(exp)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 bg-slate-50">
                  <td colSpan={2} className="px-5 py-3 text-sm font-semibold text-slate-600">Total</td>
                  <td className="px-5 py-3 font-bold text-red-700">{fmt(totalAll)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Log Expense Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Log Expense</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category <span className="text-red-400">*</span></label>
                <select value={form.category} onChange={e => set('category', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                  <option value="">Select category…</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₦) <span className="text-red-400">*</span></label>
                <input type="number" min="1" step="0.01" value={form.amount}
                  onChange={e => set('amount', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="e.g. 5000" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Details about this expense…" />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                  {submitting ? 'Logging…' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">Expense Detail</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.refId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Details</p>
                <div className="bg-slate-50 rounded-xl px-4 py-3 space-y-1.5">
                  <Row label="Category"    value={selected.category} />
                  <Row label="Amount"      value={fmt(parseFloat(selected.amount))} />
                  <Row label="Date"        value={selected.createdAt.slice(0, 10)} />
                </div>
              </div>
              {selected.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 text-slate-700">{selected.description}</div>
                </div>
              )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{value}</span>
    </div>
  );
}
