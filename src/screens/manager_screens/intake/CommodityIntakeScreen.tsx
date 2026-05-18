import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import type { RootState } from '../../../store/store';
import { useGetIntakesQuery, useCreateIntakeMutation, type CommodityIntake } from './services/intakeApiSlice';
import { useCreateReceiptMutation, type WarehouseReceipt } from '../receipts/services/receiptsApiSlice';
import { useGetSuppliersQuery } from '../farm-inputs/services/farmInputsApiSlice';
import PrintReceiptModal from '../../../components/PrintReceiptModal/PrintReceiptModal';
import Pagination from '../../../components/Pagination/Pagination';

const COMMODITIES = ['Maize', 'Rice', 'Sorghum', 'Millet', 'Cowpea', 'Groundnut', 'Soybean', 'Cassava', 'Yam', 'Sweet Potato', 'Wheat', 'Sesame', 'Other'];

const EMPTY_FORM = {
  commodity: '', quantityKg: '', gradeQuality: '',
  sourceType: 'farmer' as 'farmer' | 'supplier',
  supplierId: '', supplierName: '',
  farmerName: '', farmerPhone: '', farmerNin: '',
  sourceState: '', sourceLga: '', notes: '',
};

export default function CommodityIntakeScreen() {
  const user                                               = useSelector((s: RootState) => s.auth.user);
  const navigate                                           = useNavigate();
  const location                                           = useLocation();
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const { data, isLoading }                                = useGetIntakesQuery({ page, limit });
  const [createIntake, { isLoading: submitting }]          = useCreateIntakeMutation();
  const [createReceipt, { isLoading: generatingReceipt }]  = useCreateReceiptMutation();

  const [showForm, setShowForm]         = useState(false);
  const [selected, setSelected]         = useState<CommodityIntake | null>(null);
  const [printReceipt, setPrintReceipt] = useState<WarehouseReceipt | null>(null);
  const [receiptError, setReceiptError] = useState('');
  const [formError, setFormError]       = useState('');
  const [form, setForm]                 = useState(EMPTY_FORM);

  const { data: suppliersData } = useGetSuppliersQuery({ page: 1, limit: 100 }, { skip: !showForm });
  const suppliers = suppliersData?.data ?? [];

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Auto-open form prefilled when navigated from Collections → Log Intake
  useEffect(() => {
    const prefill = (location.state as any)?.prefillFromCollection;
    if (!prefill) return;
    setForm({
      commodity:    prefill.commodity   ?? '',
      quantityKg:   String(prefill.quantityKg ?? ''),
      gradeQuality: '',
      sourceType:   'farmer',
      supplierId:   '',
      supplierName: '',
      farmerName:   prefill.farmerName  ?? '',
      farmerPhone:  prefill.farmerPhone ?? '',
      farmerNin:    prefill.farmerNin   ?? '',
      sourceState:  prefill.sourceState ?? '',
      sourceLga:    prefill.sourceLga   ?? '',
      notes:        prefill.collectionRef ? `From collection ${prefill.collectionRef}` : '',
    });
    setFormError('');
    setShowForm(true);
    // Clear the state so refreshing doesn't re-open the form
    window.history.replaceState({}, '');
  }, []);

  const handleSupplierSelect = (id: string) => {
    set('supplierId', id);
    if (id) {
      const found = suppliers.find(s => String(s.id) === id);
      if (found) set('supplierName', found.name);
    } else {
      set('supplierName', '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createIntake({
        commodity:    form.commodity,
        quantityKg:   parseFloat(form.quantityKg),
        gradeQuality: form.gradeQuality   || undefined,
        sourceType:   form.sourceType,
        supplierId:   form.supplierId ? parseInt(form.supplierId) : undefined,
        supplierName: form.sourceType === 'supplier' ? (form.supplierName || undefined) : undefined,
        farmerName:   form.sourceType === 'farmer'   ? (form.farmerName   || undefined) : undefined,
        farmerPhone:  form.sourceType === 'farmer'   ? (form.farmerPhone  || undefined) : undefined,
        farmerNin:    form.sourceType === 'farmer'   ? (form.farmerNin    || undefined) : undefined,
        sourceState:  form.sourceState  || undefined,
        sourceLga:    form.sourceLga    || undefined,
        notes:        form.notes        || undefined,
      }).unwrap();
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to log intake.');
    }
  };

  const handleGenerateReceipt = async (intake: CommodityIntake) => {
    setReceiptError('');
    try {
      const result = await createReceipt({
        intakeId:    intake.id,
        commodity:   intake.commodity,
        quantityKg:  intake.quantityKg,
        gradeQuality: intake.gradeQuality ?? undefined,
        farmerName:  intake.farmerName ?? undefined,
        farmerPhone: intake.farmerPhone ?? undefined,
        farmerNin:   intake.farmerNin ?? undefined,
      }).unwrap();
      setSelected(null);
      setPrintReceipt(result.data);
    } catch (err: any) {
      setReceiptError(err?.data?.message ?? 'Failed to generate receipt.');
    }
  };

  const intakes      = data?.data ?? [];
  const totalToday   = intakes
    .filter(i => i.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((sum, i) => sum + i.quantityKg, 0);
  const totalAll     = intakes.reduce((sum, i) => sum + i.quantityKg, 0);

  const inputCls = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Commodity Intake</h1>
          <p className="text-slate-500 text-sm mt-0.5">Log and track commodities received at your centre</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Log Intake
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Intakes"  value={data?.total ?? intakes.length}       icon="inventory_2" color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard label="Today's Volume" value={`${totalToday.toLocaleString()} kg`} icon="scale"       color="bg-blue-50 text-blue-700 border-blue-200" />
        <StatCard label="Total Volume"   value={`${totalAll.toLocaleString()} kg`}   icon="warehouse"   color="bg-amber-50 text-amber-700 border-amber-200" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : intakes.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
            <p className="text-slate-400 text-sm mt-2">No intakes logged yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Source</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Quantity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Grade</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">From</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {intakes.map((intake) => (
                  <tr key={intake.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{intake.refId}</td>
                    <td className="px-5 py-3.5">
                      <SourceBadge type={intake.sourceType ?? 'farmer'} />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{intake.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-700">{intake.quantityKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 text-slate-600">{intake.gradeQuality ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {intake.sourceType === 'supplier'
                        ? (intake.supplierName ?? '—')
                        : (intake.farmerName ?? '—')}
                      {intake.farmerPhone && intake.sourceType !== 'supplier' && (
                        <span className="block text-xs text-slate-400">{intake.farmerPhone}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{intake.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => { setSelected(intake); setReceiptError(''); }}
                        className="text-boa-green text-xs font-medium hover:underline">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 0 && (
          <Pagination
            page={page} totalPages={data.totalPages} total={data.total} limit={limit}
            onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      {/* Log Intake Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Log Commodity Intake</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

              {/* Source type toggle */}
              <div>
                <label className={labelCls}>Intake Source <span className="text-red-400">*</span></label>
                <div className="grid grid-cols-2 gap-2">
                  {(['farmer', 'supplier'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, sourceType: type, commodity: '' }))}
                      className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition
                        ${form.sourceType === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:border-emerald-300'}`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {type === 'farmer' ? 'agriculture' : 'storefront'}
                      </span>
                      {type === 'farmer' ? 'From Farmer' : 'From Supplier'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Commodity + Qty + Grade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>
                    {form.sourceType === 'supplier' ? 'Product / Item' : 'Commodity'}
                    <span className="text-red-400"> *</span>
                  </label>
                  {form.sourceType === 'supplier' ? (
                    <input
                      value={form.commodity}
                      onChange={e => set('commodity', e.target.value)}
                      required
                      className={inputCls}
                      placeholder="e.g. AZ Fertilizer, Jute Bags, Palm Oil…"
                    />
                  ) : COMMODITIES.includes(form.commodity) || form.commodity === '' ? (
                    <select
                      value={form.commodity}
                      onChange={e => e.target.value === '__other__' ? set('commodity', ' ') : set('commodity', e.target.value)}
                      required
                      className={inputCls}
                    >
                      <option value="">Select commodity…</option>
                      {COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__other__">Other / Not Listed…</option>
                    </select>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        value={form.commodity.trim()}
                        onChange={e => set('commodity', e.target.value)}
                        required
                        className={inputCls}
                        placeholder="Type commodity name…"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => set('commodity', '')}
                        className="px-3 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 text-sm"
                        title="Back to list"
                      >↩</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Quantity (kg) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.1" step="0.1" value={form.quantityKg} onChange={e => set('quantityKg', e.target.value)} required
                    className={inputCls} placeholder="e.g. 1000" />
                </div>
                <div>
                  <label className={labelCls}>Grade / Quality</label>
                  <input value={form.gradeQuality} onChange={e => set('gradeQuality', e.target.value)}
                    className={inputCls} placeholder="e.g. Grade A" />
                </div>
              </div>

              {/* Conditional: Supplier section */}
              {form.sourceType === 'supplier' && (
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Supplier Details</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelCls}>Select Supplier</label>
                      <select value={form.supplierId} onChange={e => handleSupplierSelect(e.target.value)} className={inputCls}>
                        <option value="">— Enter manually —</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.phone ? ` · ${s.phone}` : ''}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className={labelCls}>Supplier Name {!form.supplierId && <span className="text-red-400">*</span>}</label>
                      <input value={form.supplierName} onChange={e => set('supplierName', e.target.value)}
                        required={!form.supplierId} className={inputCls} placeholder="Supplier / company name" />
                    </div>
                  </div>
                </>
              )}

              {/* Conditional: Farmer section */}
              {form.sourceType === 'farmer' && (
                <>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Farmer Details (optional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={labelCls}>Farmer Name</label>
                      <input value={form.farmerName} onChange={e => set('farmerName', e.target.value)}
                        className={inputCls} placeholder="Full name" />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input value={form.farmerPhone} onChange={e => set('farmerPhone', e.target.value)}
                        className={inputCls} placeholder="08012345678" />
                    </div>
                    <div>
                      <label className={labelCls}>NIN</label>
                      <input value={form.farmerNin} onChange={e => set('farmerNin', e.target.value)}
                        className={inputCls} placeholder="11-digit NIN" />
                    </div>
                    <div>
                      <label className={labelCls}>Source State</label>
                      <input value={form.sourceState} onChange={e => set('sourceState', e.target.value)}
                        className={inputCls} placeholder="e.g. Kano" />
                    </div>
                    <div>
                      <label className={labelCls}>Source LGA</label>
                      <input value={form.sourceLga} onChange={e => set('sourceLga', e.target.value)}
                        className={inputCls} placeholder="e.g. Kano Municipal" />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                  className={`${inputCls} resize-none`} placeholder="Additional notes…" />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {submitting ? 'Logging…' : 'Log Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800">{selected.commodity}</p>
                  <SourceBadge type={selected.sourceType ?? 'farmer'} />
                </div>
                <p className="text-xs text-slate-400 font-mono">{selected.refId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              <Section label="Intake Details">
                <Field label="Commodity"   value={selected.commodity} />
                <Field label="Quantity"    value={`${selected.quantityKg.toLocaleString()} kg`} />
                <Field label="Grade"       value={selected.gradeQuality} />
                <Field label="Date Logged" value={selected.createdAt.slice(0, 10)} />
              </Section>

              {selected.sourceType === 'supplier' ? (
                <Section label="Supplier Information">
                  <Field label="Supplier" value={selected.supplierName} />
                  <Field label="State"    value={selected.sourceState} />
                  <Field label="LGA"      value={selected.sourceLga} />
                </Section>
              ) : (
                <Section label="Farmer Information">
                  <Field label="Name"   value={selected.farmerName} />
                  <Field label="Phone"  value={selected.farmerPhone} />
                  <Field label="NIN"    value={selected.farmerNin} />
                  <Field label="State"  value={selected.sourceState} />
                  <Field label="LGA"    value={selected.sourceLga} />
                </Section>
              )}

              {selected.notes && (
                <Section label="Notes">
                  <p className="text-slate-700">{selected.notes}</p>
                </Section>
              )}

              {/* Generate receipt callout — only for farmer intakes */}
              {selected.sourceType !== 'supplier' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-emerald-800 mb-0.5">Ready to issue a receipt?</p>
                  <p className="text-xs text-emerald-600 mb-3">Generate an AgriHub Receipt (AHR) for this intake — all details will be pre-filled.</p>
                  {receiptError && <p className="text-xs text-red-500 mb-2">{receiptError}</p>}
                  <button
                    onClick={() => handleGenerateReceipt(selected)}
                    disabled={generatingReceipt}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
                  >
                    <span className="material-symbols-outlined text-base">receipt_long</span>
                    {generatingReceipt ? 'Generating…' : 'Generate Receipt'}
                  </button>
                </div>
              )}

              {/* Post to Marketplace */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-800 mb-0.5">Post to Marketplace?</p>
                <p className="text-xs text-amber-600 mb-3">
                  Create a marketplace listing for this intake — commodity, quantity and grade will be pre-filled.
                </p>
                <button
                  onClick={() => {
                    setSelected(null);
                    navigate('/manager/marketplace/listings', {
                      state: {
                        prefill: {
                          commodity:           selected.commodity,
                          quantityAvailableKg: selected.quantityKg,
                          gradeQuality:        selected.gradeQuality ?? '',
                          centreState:         selected.sourceState  ?? '',
                          centreLga:           selected.sourceLga    ?? '',
                        },
                      },
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 transition"
                >
                  <span className="material-symbols-outlined text-base">storefront</span>
                  Post to Marketplace
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

function SourceBadge({ type }: { type: string }) {
  return type === 'supplier'
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <span className="material-symbols-outlined text-xs" style={{ fontSize: 12 }}>storefront</span>
        Supplier
      </span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <span className="material-symbols-outlined text-xs" style={{ fontSize: 12 }}>agriculture</span>
        Farmer
      </span>;
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
