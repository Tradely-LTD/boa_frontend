import { useState } from 'react';
import { printReceipt } from '../../../utils/printReceipt';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  useGetInventoryQuery, useGetPosSalesQuery, useCreatePosSaleMutation,
  useGetIntakesWithStockQuery, type InventorySale,
} from './services/inventoryApiSlice';
import {
  useGetFarmInputsQuery, useGetFarmInputSalesQuery,
  type FarmInput, type FarmInputSale,
} from '../farm-inputs/services/farmInputsApiSlice';
import Pagination from '../../../components/Pagination/Pagination';

type Tab = 'produce' | 'inputs';

const PIE_COLORS = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316','#ec4899','#14b8a6'];

const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer'];

export default function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('produce');

  // Produce tab data
  const { data: inventoryData, isLoading: loadingInventory } = useGetInventoryQuery();
  const [salesPage, setSalesPage]   = useState(1);
  const [salesLimit, setSalesLimit] = useState(20);
  const { data: salesData, isLoading: loadingSales } = useGetPosSalesQuery({ page: salesPage, limit: salesLimit });

  const [showSaleForm, setShowSaleForm] = useState(false);
  const [selected, setSelected]         = useState<InventorySale | null>(null);
  const [formError, setFormError]        = useState('');
  const [createPosSale, { isLoading: submitting }] = useCreatePosSaleMutation();

  // Farm inputs tab data
  const [inputsPage, setInputsPage]     = useState(1);
  const [inputsLimit, setInputsLimit]   = useState(20);
  const [inSalesPage, setInSalesPage]   = useState(1);
  const [inSalesLimit, setInSalesLimit] = useState(20);
  const [selectedInput, setSelectedInput]           = useState<FarmInput | null>(null);
  const [selectedInputSale, setSelectedInputSale]   = useState<FarmInputSale | null>(null);
  const { data: farmInputsData, isLoading: loadingInputs }     = useGetFarmInputsQuery({ page: inputsPage, limit: inputsLimit }, { skip: activeTab !== 'inputs' });
  const { data: farmInputSalesData, isLoading: loadingInSales } = useGetFarmInputSalesQuery({ page: inSalesPage, limit: inSalesLimit }, { skip: activeTab !== 'inputs' });

  const [form, setForm] = useState({
    intakeId: '', quantityKg: '', pricePerKg: '',
    buyerName: '', buyerPhone: '', paymentMethod: 'cash', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const { data: intakesData } = useGetIntakesWithStockQuery(undefined, { skip: !showSaleForm });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      const result = await createPosSale({
        intakeId:      parseInt(form.intakeId),
        quantityKg:    parseFloat(form.quantityKg),
        pricePerKg:    parseFloat(form.pricePerKg),
        buyerName:     form.buyerName   || undefined,
        buyerPhone:    form.buyerPhone  || undefined,
        paymentMethod: form.paymentMethod,
        notes:         form.notes       || undefined,
      }).unwrap();
      setShowSaleForm(false);
      setForm({ intakeId: '', quantityKg: '', pricePerKg: '', buyerName: '', buyerPhone: '', paymentMethod: 'cash', notes: '' });
      setSelected(result.data);
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to record sale.');
    }
  };

  const overview     = inventoryData?.data ?? [];
  const totalAvailKg = overview.reduce((s, r) => s + r.availableKg, 0);
  const totalSoldKg  = overview.reduce((s, r) => s + r.totalSoldKg, 0);
  const sales        = salesData?.data ?? [];
  const todaySales   = sales.filter(s => s.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  const intakesWithStock = intakesData?.data ?? [];
  const selectedIntake   = intakesWithStock.find(i => i.id === parseInt(form.intakeId));

  // Farm inputs derived
  const farmInputs     = farmInputsData?.data ?? [];
  const farmInputSales = farmInputSalesData?.data ?? [];
  const totalInputTypes = farmInputs.length;
  const totalInputAvail = farmInputs.reduce((s, i) => s + i.quantityAvailable, 0);
  const inputTodaySales = farmInputSales.filter(s => s.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10));
  const inputTodayRev   = inputTodaySales.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Inventory</h1>
          <p className="text-slate-500 text-sm mt-0.5">Stock levels and POS sales of stored commodities</p>
        </div>
        <button
          onClick={() => setShowSaleForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">point_of_sale</span>
          Make a Sale
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {([['produce', 'grain', 'Produce / Harvest'], ['inputs', 'grass', 'Farm Inputs']] as const).map(([tab, icon, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition
              ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="material-symbols-outlined text-base">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* ── PRODUCE TAB ── */}
      {activeTab === 'produce' && <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Commodity Types"   value={overview.length}                           icon="category"       color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard label="Total Available"   value={`${totalAvailKg.toLocaleString()} kg`}     icon="inventory_2"    color="bg-blue-50 text-blue-700 border-blue-200" />
        <StatCard label="Total Sold"        value={`${totalSoldKg.toLocaleString()} kg`}      icon="shopping_cart"  color="bg-amber-50 text-amber-700 border-amber-200" />
        <StatCard label="Today's Revenue"   value={`₦${todayRevenue.toLocaleString()}`}       icon="payments"       color="bg-purple-50 text-purple-700 border-purple-200" />
      </div>

      {/* Pie chart + Stock table side by side */}
      {overview.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Stock Breakdown by Commodity</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={overview.map(r => ({ name: r.commodity, value: r.availableKg }))}
                cx="50%" cy="50%"
                innerRadius={60} outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => (percent ?? 0) > 0.04 ? `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {overview.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => `${Number(v).toLocaleString()} kg`} />
              <Legend iconType="circle" iconSize={10} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Stock overview table */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">Stock Overview</h2>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
        {loadingInventory ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : overview.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">inventory_2</span>
            <p className="text-slate-400 text-sm mt-2">No intake records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Received</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Sold</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Intakes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {overview.map((row) => (
                  <tr key={`${row.centreId}-${row.commodity}`} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{row.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-600">{row.totalReceivedKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 text-slate-600">{row.totalSoldKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold ${row.availableKg > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                        {row.availableKg.toLocaleString()} kg
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{row.intakeCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POS Sales history */}
      <h2 className="text-base font-semibold text-slate-700 mb-3">POS Sales History</h2>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loadingSales ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : sales.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            <p className="text-slate-400 text-sm mt-2">No sales recorded yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price/kg</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Buyer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{sale.receiptNumber}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{sale.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-600">{sale.quantityKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 text-slate-600">₦{sale.pricePerKg.toLocaleString()}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">₦{sale.totalAmount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-600">{sale.buyerName ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <PaymentBadge method={sale.paymentMethod} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{sale.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(sale)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {salesData && salesData.totalPages > 0 && (
          <Pagination
            page={salesPage} totalPages={salesData.totalPages} total={salesData.total} limit={salesLimit}
            onPageChange={setSalesPage} onLimitChange={(l) => { setSalesLimit(l); setSalesPage(1); }}
          />
        )}
      </div>

      {/* Make a Sale Modal */}
      {showSaleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSaleForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Make a POS Sale</h2>
              <button onClick={() => setShowSaleForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Intake Batch <span className="text-red-400">*</span></label>
                <select value={form.intakeId} onChange={e => set('intakeId', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                  <option value="">Select intake…</option>
                  {intakesWithStock.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.refId} — {i.commodity} ({i.availableKg.toLocaleString()} kg available){i.farmerName ? ` · ${i.farmerName}` : ''}
                    </option>
                  ))}
                </select>
                {selectedIntake && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Available: {selectedIntake.availableKg.toLocaleString()} kg of {selectedIntake.commodity}
                    {selectedIntake.gradeQuality ? ` (${selectedIntake.gradeQuality})` : ''}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity (kg) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.1" step="0.1" value={form.quantityKg} onChange={e => set('quantityKg', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price per kg (₦) <span className="text-red-400">*</span></label>
                  <input type="number" min="0.01" step="0.01" value={form.pricePerKg} onChange={e => set('pricePerKg', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="e.g. 450" />
                </div>
              </div>

              {form.quantityKg && form.pricePerKg && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
                  Total: <strong>₦{(parseFloat(form.quantityKg) * parseFloat(form.pricePerKg)).toLocaleString()}</strong>
                </div>
              )}

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Buyer Details (optional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Buyer Name</label>
                  <input value={form.buyerName} onChange={e => set('buyerName', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Buyer Phone</label>
                  <input value={form.buyerPhone} onChange={e => set('buyerPhone', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="08012345678" />
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
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none" placeholder="Additional notes…" />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSaleForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {submitting ? 'Recording…' : 'Record Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">Sale Receipt</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.receiptNumber}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              <Section label="Sale Details">
                <Field label="Commodity"    value={selected.commodity} />
                <Field label="Quantity"     value={`${selected.quantityKg.toLocaleString()} kg`} />
                <Field label="Price / kg"   value={`₦${selected.pricePerKg.toLocaleString()}`} />
                <Field label="Total Amount" value={`₦${selected.totalAmount.toLocaleString()}`} />
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
            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white flex gap-3">
              <button
                onClick={() => printReceipt({
                  title: 'Produce Sale Receipt',
                  receiptNumber: selected.receiptNumber,
                  date: new Date(selected.createdAt).toLocaleString(),
                  lines: [
                    { label: 'Commodity',    value: selected.commodity },
                    { label: 'Quantity',     value: `${selected.quantityKg.toLocaleString()} kg` },
                    { label: 'Price / kg',   value: `₦${selected.pricePerKg.toLocaleString()}` },
                    { label: 'Total Amount', value: `₦${selected.totalAmount.toLocaleString()}`, bold: true },
                    { label: 'Payment',      value: selected.paymentMethod.replace('_', ' ') },
                  ],
                  buyerName:  selected.buyerName,
                  buyerPhone: selected.buyerPhone,
                  notes:      selected.notes,
                })}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
                <span className="material-symbols-outlined text-base">print</span>Print Receipt
              </button>
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </>} {/* end produce tab */}

      {/* ── FARM INPUTS TAB ── */}
      {activeTab === 'inputs' && <>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Input Types"      value={totalInputTypes}                           icon="agri"           color="bg-emerald-50 text-emerald-700 border-emerald-200" />
          <StatCard label="Total Available"  value={totalInputAvail.toLocaleString()}          icon="inventory_2"    color="bg-blue-50 text-blue-700 border-blue-200" />
          <StatCard label="Today's Revenue"  value={`₦${inputTodayRev.toLocaleString()}`}      icon="payments"       color="bg-purple-50 text-purple-700 border-purple-200" />
        </div>

        {/* Stock table */}
        <h2 className="text-base font-semibold text-slate-700 mb-3">Input Stock</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-8">
          {loadingInputs ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
          ) : farmInputs.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">agri</span>
              <p className="text-slate-400 text-sm mt-2">No farm inputs in stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Received</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sell Price</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {farmInputs.map(inp => (
                    <tr key={inp.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{inp.refId}</td>
                      <td className="px-5 py-3.5">
                        <InputTypeBadge type={inp.inputType} />
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {inp.inputName}
                        {inp.brand && <span className="block text-xs text-slate-400">{inp.brand}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{inp.supplierName ?? '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{inp.quantityReceived.toLocaleString()} {inp.unit}</td>
                      <td className="px-5 py-3.5">
                        <span className={`font-semibold ${inp.quantityAvailable > 0 ? 'text-emerald-700' : 'text-red-500'}`}>
                          {inp.quantityAvailable.toLocaleString()} {inp.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {inp.sellingPricePerUnit ? `₦${inp.sellingPricePerUnit.toLocaleString()}` : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedInput(inp)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {farmInputsData && farmInputsData.totalPages > 0 && (
            <Pagination
              page={inputsPage} totalPages={farmInputsData.totalPages} total={farmInputsData.total} limit={inputsLimit}
              onPageChange={setInputsPage} onLimitChange={(l) => { setInputsLimit(l); setInputsPage(1); }}
            />
          )}
        </div>

        {/* Input sales table */}
        <h2 className="text-base font-semibold text-slate-700 mb-3">Input Sales History</h2>
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loadingInSales ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
          ) : farmInputSales.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
              <p className="text-slate-400 text-sm mt-2">No input sales recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Buyer</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {farmInputSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{sale.receiptNumber}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {sale.inputName}
                        <span className="block text-xs text-slate-400 capitalize">{sale.inputType}</span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{sale.quantitySold} {sale.unit}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">₦{sale.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-600">{sale.buyerName ?? '—'}</td>
                      <td className="px-5 py-3.5"><PaymentBadge method={sale.paymentMethod} /></td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{sale.createdAt.slice(0, 10)}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedInputSale(sale)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {farmInputSalesData && farmInputSalesData.totalPages > 0 && (
            <Pagination
              page={inSalesPage} totalPages={farmInputSalesData.totalPages} total={farmInputSalesData.total} limit={inSalesLimit}
              onPageChange={setInSalesPage} onLimitChange={(l) => { setInSalesLimit(l); setInSalesPage(1); }}
            />
          )}
        </div>

        {/* Farm Input Detail Drawer */}
        {selectedInput && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setSelectedInput(null)} />
            <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
                <div>
                  <p className="font-semibold text-slate-800">{selectedInput.inputName}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedInput.refId}</p>
                </div>
                <button onClick={() => setSelectedInput(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 px-6 py-5 space-y-5 text-sm">
                <Section label="Item Details">
                  <Field label="Name"     value={selectedInput.inputName} />
                  <Field label="Type"     value={selectedInput.inputType} />
                  <Field label="Brand"    value={selectedInput.brand} />
                  <Field label="Unit"     value={selectedInput.unit} />
                </Section>
                <Section label="Stock">
                  <Field label="Received"   value={`${selectedInput.quantityReceived} ${selectedInput.unit}`} />
                  <Field label="Available"  value={`${selectedInput.quantityAvailable} ${selectedInput.unit}`} />
                  <Field label="Sold"       value={`${selectedInput.quantitySold} ${selectedInput.unit}`} />
                  <Field label="Buy Price"  value={selectedInput.purchasePricePerUnit ? `₦${selectedInput.purchasePricePerUnit.toLocaleString()}` : undefined} />
                  <Field label="Sell Price" value={selectedInput.sellingPricePerUnit  ? `₦${selectedInput.sellingPricePerUnit.toLocaleString()}`  : undefined} />
                </Section>
                {selectedInput.supplierName && (
                  <Section label="Supplier">
                    <Field label="Name" value={selectedInput.supplierName} />
                  </Section>
                )}
                {selectedInput.notes && <Section label="Notes"><p className="text-slate-700">{selectedInput.notes}</p></Section>}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button onClick={() => setSelectedInput(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input Sale Detail Drawer */}
        {selectedInputSale && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setSelectedInputSale(null)} />
            <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
              <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
                <div>
                  <p className="font-semibold text-slate-800">Input Sale</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedInputSale.receiptNumber}</p>
                </div>
                <button onClick={() => setSelectedInputSale(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="flex-1 px-6 py-5 space-y-5 text-sm">
                <Section label="Sale Details">
                  <Field label="Item"       value={`${selectedInputSale.inputName} (${selectedInputSale.inputType})`} />
                  <Field label="Quantity"   value={`${selectedInputSale.quantitySold} ${selectedInputSale.unit}`} />
                  <Field label="Price/unit" value={`₦${selectedInputSale.pricePerUnit.toLocaleString()}`} />
                  <Field label="Total"      value={`₦${selectedInputSale.totalAmount.toLocaleString()}`} />
                  <Field label="Payment"    value={selectedInputSale.paymentMethod.replace('_', ' ')} />
                  <Field label="Date"       value={selectedInputSale.createdAt.slice(0, 10)} />
                </Section>
                {(selectedInputSale.buyerName || selectedInputSale.buyerPhone || selectedInputSale.buyerNin) && (
                  <Section label="Buyer">
                    <Field label="Name"  value={selectedInputSale.buyerName} />
                    <Field label="Phone" value={selectedInputSale.buyerPhone} />
                    <Field label="NIN"   value={selectedInputSale.buyerNin} />
                  </Section>
                )}
                {selectedInputSale.notes && <Section label="Notes"><p className="text-slate-700">{selectedInputSale.notes}</p></Section>}
              </div>
              <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button onClick={() => setSelectedInputSale(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>} {/* end inputs tab */}
    </div>
  );
}

function InputTypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    seed:       'bg-green-100 text-green-700',
    fertilizer: 'bg-amber-100 text-amber-700',
    equipment:  'bg-blue-100 text-blue-700',
    other:      'bg-slate-100 text-slate-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[type] ?? map.other}`}>
      {type}
    </span>
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

function PaymentBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    cash:           'bg-emerald-100 text-emerald-700',
    mobile_money:   'bg-blue-100 text-blue-700',
    bank_transfer:  'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${colors[method] ?? 'bg-slate-100 text-slate-600'}`}>
      {method.replace('_', ' ')}
    </span>
  );
}
