import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import {
  useGetReceiptsQuery,
  useCreateReceiptMutation,
  useUpdateReceiptStatusMutation,
  type WarehouseReceipt,
} from './services/receiptsApiSlice';
import { useGetIntakesQuery } from '../intake/services/intakeApiSlice';
import PrintReceiptModal from '../../../components/PrintReceiptModal/PrintReceiptModal';
import Pagination from '../../../components/Pagination/Pagination';

const statusStyle: Record<string, string> = {
  active:   'bg-emerald-100 text-emerald-700',
  pledged:  'bg-amber-100 text-amber-700',
  redeemed: 'bg-slate-100 text-slate-500',
  expired:  'bg-red-100 text-red-500',
};

const COMMODITIES = ['Maize', 'Rice', 'Sorghum', 'Millet', 'Cowpea', 'Groundnut', 'Soybean', 'Cassava', 'Yam', 'Sweet Potato', 'Wheat', 'Sesame', 'Other'];

export default function WarehouseReceiptsScreen() {
  const user                                          = useSelector((s: RootState) => s.auth.user);
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: receiptsData, isLoading }             = useGetReceiptsQuery({ page, limit });
  const { data: intakesData }                         = useGetIntakesQuery({});
  const [createReceipt, { isLoading: creating }]      = useCreateReceiptMutation();
  const [updateStatus]                                = useUpdateReceiptStatusMutation();

  const [showForm, setShowForm]     = useState(false);
  const [printReceipt, setPrintReceipt] = useState<WarehouseReceipt | null>(null);
  const [error, setError]           = useState('');
  const [useIntake, setUseIntake]   = useState(false);

  const [form, setForm] = useState({
    intakeId: '', commodity: '', quantityKg: '', gradeQuality: '',
    farmerName: '', farmerPhone: '', farmerNin: '', expiresAt: '', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const intakes    = intakesData?.data ?? [];
  const receipts   = receiptsData?.data ?? [];

  const handleIntakeSelect = (id: string) => {
    set('intakeId', id);
    if (!id) return;
    const intake = intakes.find(i => String(i.id) === id);
    if (intake) {
      setForm(f => ({
        ...f,
        intakeId:     id,
        commodity:    intake.commodity,
        quantityKg:   String(intake.quantityKg),
        gradeQuality: intake.gradeQuality ?? '',
        farmerName:   intake.farmerName ?? '',
        farmerPhone:  intake.farmerPhone ?? '',
        farmerNin:    intake.farmerNin ?? '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createReceipt({
        intakeId:    form.intakeId ? parseInt(form.intakeId) : undefined,
        commodity:   form.commodity   || undefined,
        quantityKg:  form.quantityKg  ? parseFloat(form.quantityKg) : undefined,
        gradeQuality: form.gradeQuality || undefined,
        farmerName:  form.farmerName  || undefined,
        farmerPhone: form.farmerPhone || undefined,
        farmerNin:   form.farmerNin   || undefined,
        expiresAt:   form.expiresAt   || undefined,
        notes:       form.notes       || undefined,
      }).unwrap();
      setShowForm(false);
      setForm({ intakeId: '', commodity: '', quantityKg: '', gradeQuality: '', farmerName: '', farmerPhone: '', farmerNin: '', expiresAt: '', notes: '' });
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to generate receipt.');
    }
  };

  const active   = receipts.filter(r => r.status === 'active').length;
  const redeemed = receipts.filter(r => r.status === 'redeemed').length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>AgriHub Receipts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Generate and manage AgriHub Receipts (AHRs) for stored commodities</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">receipt_long</span>
          Generate Receipt
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Receipts" value={receipts.length}   icon="receipt_long"   color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard label="Active"         value={active}            icon="check_circle"   color="bg-blue-50 text-blue-700 border-blue-200" />
        <StatCard label="Redeemed"       value={redeemed}          icon="task_alt"       color="bg-slate-50 text-slate-600 border-slate-200" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : receipts.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            <p className="text-slate-400 text-sm mt-2">No receipts generated yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt No.</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Farmer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Issued</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {receipts.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{r.receiptNumber}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{r.commodity}</td>
                  <td className="px-5 py-3.5 text-slate-700">{r.quantityKg.toLocaleString()} kg</td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {r.farmerName}
                    {r.farmerPhone && <span className="block text-xs text-slate-400">{r.farmerPhone}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{r.issuedAt.slice(0, 10)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setPrintReceipt(r)} className="text-boa-green text-xs font-medium hover:underline">
                        Print
                      </button>
                      {r.status === 'active' && (
                        <button
                          onClick={() => updateStatus({ id: r.id, status: 'redeemed' })}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700"
                        >
                          Redeem
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {receiptsData && receiptsData.totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={receiptsData.totalPages}
            total={receiptsData.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      {/* Generate Receipt Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Generate AgriHub Receipt</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {intakes.length > 0 && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2 cursor-pointer">
                    <input type="checkbox" checked={useIntake} onChange={e => setUseIntake(e.target.checked)} className="rounded" />
                    Link to an existing intake record
                  </label>
                  {useIntake && (
                    <select value={form.intakeId} onChange={e => handleIntakeSelect(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                      <option value="">Select intake…</option>
                      {intakes.map(i => (
                        <option key={i.id} value={i.id}>{i.refId} — {i.commodity} {i.quantityKg} kg {i.farmerName ? `(${i.farmerName})` : ''}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Commodity <span className="text-red-400">*</span></label>
                  <select value={form.commodity} onChange={e => set('commodity', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                    <option value="">Select commodity…</option>
                    {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (kg) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.1" step="0.1" value={form.quantityKg} onChange={e => set('quantityKg', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 1000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Grade / Quality</label>
                  <input value={form.gradeQuality} onChange={e => set('gradeQuality', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="e.g. Grade A" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Farmer Name <span className="text-red-400">*</span></label>
                  <input value={form.farmerName} onChange={e => set('farmerName', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Farmer Phone</label>
                  <input value={form.farmerPhone} onChange={e => set('farmerPhone', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="08012345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Farmer NIN</label>
                  <input value={form.farmerNin} onChange={e => set('farmerNin', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="11-digit NIN" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (optional)</label>
                  <input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none" placeholder="Additional notes…" />
                </div>
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {creating ? 'Generating…' : 'Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Receipt */}
      {printReceipt && (
        <PrintReceiptModal
          receipt={printReceipt}
          managerName={user?.name ?? ''}
          onClose={() => setPrintReceipt(null)}
        />
      )}
    </div>
  );
}


function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const [bg, text, border] = color.split(' ');
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${text}`}>{label}</p>
          <p className={`text-2xl font-bold mt-1 ${text}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined text-2xl opacity-70 ${text}`}>{icon}</span>
      </div>
    </div>
  );
}
