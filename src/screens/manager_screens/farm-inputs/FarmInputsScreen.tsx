import { useState, type ChangeEvent } from 'react';
import { printReceipt } from '../../../utils/printReceipt';
import {
  useGetFarmInputsQuery, useCreateFarmInputMutation, useUpdateFarmInputMutation, useDeleteFarmInputMutation,
  useGetFarmInputSalesQuery, useCreateFarmInputSaleMutation,
  useGetSuppliersQuery, useCreateSupplierMutation, useUpdateSupplierMutation, useDeleteSupplierMutation,
  type FarmInput, type FarmInputSale, type Supplier,
} from './services/farmInputsApiSlice';
import Pagination from '../../../components/Pagination/Pagination';

type Tab = 'stock' | 'sales' | 'suppliers';

const INPUT_TYPES    = ['seed', 'fertilizer', 'equipment', 'other'];
const UNITS          = ['kg', 'bag', 'liter', 'piece', 'set'];
const PAYMENT_METHODS = ['cash', 'mobile_money', 'bank_transfer'];

const EMPTY_STOCK_FORM = {
  inputType: '', inputName: '', brand: '', supplierId: '', unit: 'kg',
  quantityReceived: '', purchasePricePerUnit: '', sellingPricePerUnit: '', notes: '',
};
const EMPTY_SUPPLIER_FORM = {
  name: '', phone: '', email: '', address: '', state: '', lga: '', supplierType: 'individual',
};

export default function FarmInputsScreen() {
  const [tab, setTab] = useState<Tab>('stock');

  // Queries
  const [stockPage, setStockPage]   = useState(1);
  const [stockLimit, setStockLimit] = useState(20);
  const [salesPage, setSalesPage]   = useState(1);
  const [salesLimit, setSalesLimit] = useState(20);
  const { data: stockData, isLoading: loadingStock }   = useGetFarmInputsQuery({ page: stockPage, limit: stockLimit });
  const { data: salesData, isLoading: loadingSales }   = useGetFarmInputSalesQuery({ page: salesPage, limit: salesLimit });
  const { data: suppliersData }                        = useGetSuppliersQuery({ page: 1, limit: 100 });

  // Mutations
  const [createInput,   { isLoading: addingStock }]    = useCreateFarmInputMutation();
  const [updateInput,   { isLoading: updatingStock }]  = useUpdateFarmInputMutation();
  const [deleteInput,   { isLoading: deletingStock }]  = useDeleteFarmInputMutation();
  const [createSale,    { isLoading: recordingSale }]  = useCreateFarmInputSaleMutation();
  const [createSupplier,{ isLoading: addingSupplier }] = useCreateSupplierMutation();
  const [updateSupplier,{ isLoading: updatingSupplier }] = useUpdateSupplierMutation();
  const [deleteSupplier,{ isLoading: deletingSupplier }] = useDeleteSupplierMutation();

  // UI state
  const [showAddStock,      setShowAddStock]      = useState(false);
  const [showEditStock,     setShowEditStock]      = useState(false);
  const [editingInput,      setEditingInput]       = useState<FarmInput | null>(null);
  const [showRecordSale,    setShowRecordSale]     = useState(false);
  const [showAddSupplier,   setShowAddSupplier]    = useState(false);
  const [showEditSupplier,  setShowEditSupplier]   = useState(false);
  const [editingSupplier,   setEditingSupplier]    = useState<Supplier | null>(null);
  const [confirmDeleteInput, setConfirmDeleteInput] = useState<FarmInput | null>(null);
  const [confirmDeleteSupplier, setConfirmDeleteSupplier] = useState<Supplier | null>(null);
  const [selectedInput,     setSelectedInput]      = useState<FarmInput | null>(null);
  const [selectedSale,      setSelectedSale]       = useState<FarmInputSale | null>(null);
  const [selectedSupplier,  setSelectedSupplier]   = useState<Supplier | null>(null);
  const [formError, setFormError] = useState('');

  // Forms
  const [stockForm, setStockForm]       = useState(EMPTY_STOCK_FORM);
  const [editStockForm, setEditStockForm] = useState({ inputName: '', brand: '', sellingPricePerUnit: '', purchasePricePerUnit: '', notes: '' });
  const [saleForm, setSaleForm]         = useState({ inputId: '', quantitySold: '', pricePerUnit: '', buyerName: '', buyerPhone: '', buyerNin: '', paymentMethod: 'cash', notes: '' });
  const [supplierForm, setSupplierForm] = useState(EMPTY_SUPPLIER_FORM);
  const [editSupplierForm, setEditSupplierForm] = useState({ name: '', phone: '', email: '', address: '', state: '', lga: '', supplierType: 'individual', isActive: true });

  const setS    = (k: string, v: string)           => setStockForm(f        => ({ ...f, [k]: v } as typeof f));
  const setES   = (k: string, v: string | boolean) => setEditStockForm(f    => ({ ...f, [k]: v } as typeof f));
  const setSF   = (k: string, v: string)           => setSaleForm(f         => ({ ...f, [k]: v } as typeof f));
  const setSup  = (k: string, v: string)           => setSupplierForm(f     => ({ ...f, [k]: v } as typeof f));
  const setESup = (k: string, v: string | boolean) => setEditSupplierForm(f => ({ ...f, [k]: v } as typeof f));

  const openEditStock = (inp: FarmInput) => {
    setEditStockForm({
      inputName:            inp.inputName,
      brand:                inp.brand ?? '',
      sellingPricePerUnit:  inp.sellingPricePerUnit  != null ? String(inp.sellingPricePerUnit)  : '',
      purchasePricePerUnit: inp.purchasePricePerUnit != null ? String(inp.purchasePricePerUnit) : '',
      notes:                inp.notes ?? '',
    });
    setEditingInput(inp);
    setSelectedInput(null);
    setShowEditStock(true);
  };

  const openEditSupplier = (sup: Supplier) => {
    setEditSupplierForm({
      name:         sup.name,
      phone:        sup.phone  ?? '',
      email:        sup.email  ?? '',
      address:      sup.address ?? '',
      state:        sup.state  ?? '',
      lga:          sup.lga    ?? '',
      supplierType: sup.supplierType,
      isActive:     sup.isActive,
    });
    setEditingSupplier(sup);
    setSelectedSupplier(null);
    setShowEditSupplier(true);
  };

  // Submit handlers
  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    try {
      await createInput({
        inputType:            stockForm.inputType as any,
        inputName:            stockForm.inputName,
        brand:                stockForm.brand || undefined,
        supplierId:           stockForm.supplierId ? parseInt(stockForm.supplierId) as any : undefined,
        unit:                 stockForm.unit as any,
        quantityReceived:     parseFloat(stockForm.quantityReceived) as any,
        purchasePricePerUnit: stockForm.purchasePricePerUnit ? parseFloat(stockForm.purchasePricePerUnit) as any : undefined,
        sellingPricePerUnit:  stockForm.sellingPricePerUnit  ? parseFloat(stockForm.sellingPricePerUnit)  as any : undefined,
        notes:                stockForm.notes || undefined,
      }).unwrap();
      setShowAddStock(false);
      setStockForm(EMPTY_STOCK_FORM);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to add stock.'); }
  };

  const handleEditStock = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!editingInput) return;
    try {
      await updateInput({
        id: editingInput.id,
        body: {
          inputName:            editStockForm.inputName,
          brand:                editStockForm.brand || undefined,
          sellingPricePerUnit:  editStockForm.sellingPricePerUnit  ? parseFloat(editStockForm.sellingPricePerUnit)  as any : undefined,
          purchasePricePerUnit: editStockForm.purchasePricePerUnit ? parseFloat(editStockForm.purchasePricePerUnit) as any : undefined,
          notes:                editStockForm.notes || undefined,
        },
      }).unwrap();
      setEditingInput(null);
      setShowEditStock(false);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to update stock.'); }
  };

  const handleDeleteInput = async () => {
    if (!confirmDeleteInput) return;
    try {
      await deleteInput(confirmDeleteInput.id).unwrap();
      setConfirmDeleteInput(null);
      setSelectedInput(null);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to delete.'); }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    try {
      const result = await createSale({
        inputId:       parseInt(saleForm.inputId) as any,
        quantitySold:  parseFloat(saleForm.quantitySold) as any,
        pricePerUnit:  parseFloat(saleForm.pricePerUnit) as any,
        buyerName:     saleForm.buyerName  || undefined,
        buyerPhone:    saleForm.buyerPhone || undefined,
        buyerNin:      saleForm.buyerNin   || undefined,
        paymentMethod: saleForm.paymentMethod as any,
        notes:         saleForm.notes      || undefined,
      }).unwrap();
      setShowRecordSale(false);
      setSaleForm({ inputId: '', quantitySold: '', pricePerUnit: '', buyerName: '', buyerPhone: '', buyerNin: '', paymentMethod: 'cash', notes: '' });
      setSelectedSale(result.data);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to record sale.'); }
  };

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    try {
      await createSupplier({ ...supplierForm, supplierType: supplierForm.supplierType as any }).unwrap();
      setShowAddSupplier(false);
      setSupplierForm(EMPTY_SUPPLIER_FORM);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to add supplier.'); }
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    if (!editingSupplier) return;
    try {
      await updateSupplier({
        id: editingSupplier.id,
        body: { ...editSupplierForm, supplierType: editSupplierForm.supplierType as any },
      }).unwrap();
      setEditingSupplier(null);
      setShowEditSupplier(false);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to update supplier.'); }
  };

  const handleDeleteSupplier = async () => {
    if (!confirmDeleteSupplier) return;
    try {
      await deleteSupplier(confirmDeleteSupplier.id).unwrap();
      setConfirmDeleteSupplier(null);
      setSelectedSupplier(null);
    } catch (err: any) { setFormError(err?.data?.message ?? 'Failed to delete supplier.'); }
  };

  const stock     = stockData?.data ?? [];
  const sales     = salesData?.data ?? [];
  const suppliers = suppliersData?.data ?? [];
  const selectedInputForSale = stock.find(i => i.id === parseInt(saleForm.inputId));

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Farm Inputs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage seeds, fertilizers, and equipment stock</p>
        </div>
        <div className="flex gap-2">
          {tab === 'stock'     && <button onClick={() => { setShowAddStock(true);    setFormError(''); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"><span className="material-symbols-outlined text-base">add</span>Add Stock</button>}
          {tab === 'sales'     && <button onClick={() => { setShowRecordSale(true);  setFormError(''); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"><span className="material-symbols-outlined text-base">point_of_sale</span>Record Sale</button>}
          {tab === 'suppliers' && <button onClick={() => { setShowAddSupplier(true); setFormError(''); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"><span className="material-symbols-outlined text-base">add</span>Add Supplier</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1 w-fit">
        {(['stock', 'sales', 'suppliers'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition capitalize ${tab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Stock Tab */}
      {tab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loadingStock ? (
            <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
          ) : stock.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">grass</span>
              <p className="text-slate-400 text-sm mt-2">No farm inputs in stock</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[680px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Supplier</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Available</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sell Price</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stock.map(input => (
                    <tr key={input.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{input.refId}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{input.inputName}{input.brand && <span className="block text-xs text-slate-400">{input.brand}</span>}</td>
                      <td className="px-5 py-3.5"><TypeBadge type={input.inputType} /></td>
                      <td className="px-5 py-3.5 text-slate-600">{input.supplierName ?? '—'}</td>
                      <td className="px-5 py-3.5"><span className={`font-semibold ${input.quantityAvailable > 0 ? 'text-emerald-700' : 'text-red-500'}`}>{input.quantityAvailable.toLocaleString()} {input.unit}</span></td>
                      <td className="px-5 py-3.5 text-slate-600">{input.sellingPricePerUnit != null ? `₦${input.sellingPricePerUnit.toLocaleString()}/${input.unit}` : '—'}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setSelectedInput(input)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {stockData && stockData.totalPages > 0 && (
            <Pagination page={stockPage} totalPages={stockData.totalPages} total={stockData.total} limit={stockLimit}
              onPageChange={setStockPage} onLimitChange={(l) => { setStockLimit(l); setStockPage(1); }} />
          )}
        </div>
      )}

      {/* Sales Tab */}
      {tab === 'sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {loadingSales ? <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
          : sales.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
              <p className="text-slate-400 text-sm mt-2">No input sales recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipt</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Input</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Buyer</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{sale.receiptNumber}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">{sale.inputName}<span className="block text-xs text-slate-400 capitalize">{sale.inputType}</span></td>
                      <td className="px-5 py-3.5 text-slate-600">{sale.quantitySold.toLocaleString()} {sale.unit}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">₦{sale.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-slate-600">{sale.buyerName ?? '—'}</td>
                      <td className="px-5 py-3.5"><PaymentBadge method={sale.paymentMethod} /></td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs">{sale.createdAt.slice(0, 10)}</td>
                      <td className="px-5 py-3.5"><button onClick={() => setSelectedSale(sale)} className="text-boa-green text-xs font-medium hover:underline">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {salesData && salesData.totalPages > 0 && (
            <Pagination page={salesPage} totalPages={salesData.totalPages} total={salesData.total} limit={salesLimit}
              onPageChange={setSalesPage} onLimitChange={(l) => { setSalesLimit(l); setSalesPage(1); }} />
          )}
        </div>
      )}

      {/* Suppliers Tab */}
      {tab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {suppliers.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">storefront</span>
              <p className="text-slate-400 text-sm mt-2">No suppliers added yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">State</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {suppliers.map(sup => (
                    <tr key={sup.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-medium text-slate-800">{sup.name}</td>
                      <td className="px-5 py-3.5 text-slate-600 capitalize">{sup.supplierType}</td>
                      <td className="px-5 py-3.5 text-slate-600">{sup.phone ?? '—'}</td>
                      <td className="px-5 py-3.5 text-slate-600">{sup.state ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${sup.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {sup.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5"><button onClick={() => setSelectedSupplier(sup)} className="text-boa-green text-xs font-medium hover:underline">View</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ── */}

      {showAddStock && (
        <Modal title="Add Farm Input Stock" onClose={() => setShowAddStock(false)}>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Input Type <span className="text-red-400">*</span></label>
                <select value={stockForm.inputType} onChange={e => setS('inputType', e.target.value)} required className="input">
                  <option value="">Select type…</option>
                  {INPUT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                </select></div>
              <div><label className="label">Unit <span className="text-red-400">*</span></label>
                <select value={stockForm.unit} onChange={e => setS('unit', e.target.value)} className="input">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select></div>
              <div className="col-span-2"><label className="label">Input Name <span className="text-red-400">*</span></label>
                <input value={stockForm.inputName} onChange={e => setS('inputName', e.target.value)} required className="input" placeholder="e.g. NPK Fertilizer 20:10:10" /></div>
              <div><label className="label">Brand</label>
                <input value={stockForm.brand} onChange={e => setS('brand', e.target.value)} className="input" placeholder="e.g. Notore" /></div>
              <div><label className="label">Supplier</label>
                <select value={stockForm.supplierId} onChange={e => setS('supplierId', e.target.value)} className="input">
                  <option value="">No supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select></div>
              <div><label className="label">Qty Received <span className="text-red-400">*</span></label>
                <input type="number" min="0.01" step="0.01" value={stockForm.quantityReceived} onChange={e => setS('quantityReceived', e.target.value)} required className="input" placeholder="0" /></div>
              <div><label className="label">Purchase Price / {stockForm.unit} (₦)</label>
                <input type="number" min="0" step="0.01" value={stockForm.purchasePricePerUnit} onChange={e => setS('purchasePricePerUnit', e.target.value)} className="input" placeholder="0" /></div>
              <div className="col-span-2"><label className="label">Selling Price / {stockForm.unit} (₦)</label>
                <input type="number" min="0" step="0.01" value={stockForm.sellingPricePerUnit} onChange={e => setS('sellingPricePerUnit', e.target.value)} className="input" placeholder="0" /></div>
              <div className="col-span-2"><label className="label">Notes</label>
                <textarea rows={2} value={stockForm.notes} onChange={e => setS('notes', e.target.value)} className="input resize-none" placeholder="Additional notes…" /></div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowAddStock(false)} submitting={addingStock} submitLabel="Add Stock" />
          </form>
        </Modal>
      )}

      {showEditStock && editingInput && (
        <Modal title="Edit Stock Item" onClose={() => { setShowEditStock(false); setEditingInput(null); }}>
          <form onSubmit={handleEditStock} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Name <span className="text-red-400">*</span></label>
                <input value={editStockForm.inputName} onChange={e => setES('inputName', e.target.value)} required className="input" /></div>
              <div><label className="label">Brand</label>
                <input value={editStockForm.brand} onChange={e => setES('brand', e.target.value)} className="input" /></div>
              <div><label className="label">Purchase Price / {editingInput.unit} (₦)</label>
                <input type="number" min="0" step="0.01" value={editStockForm.purchasePricePerUnit} onChange={e => setES('purchasePricePerUnit', e.target.value)} className="input" /></div>
              <div className="col-span-2"><label className="label">Selling Price / {editingInput.unit} (₦)</label>
                <input type="number" min="0" step="0.01" value={editStockForm.sellingPricePerUnit} onChange={e => setES('sellingPricePerUnit', e.target.value)} className="input" /></div>
              <div className="col-span-2"><label className="label">Notes</label>
                <textarea rows={2} value={editStockForm.notes} onChange={e => setES('notes', e.target.value)} className="input resize-none" /></div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowEditStock(false)} submitting={updatingStock} submitLabel="Save Changes" />
          </form>
        </Modal>
      )}

      {showRecordSale && (
        <Modal title="Record Input Sale" onClose={() => setShowRecordSale(false)}>
          <form onSubmit={handleRecordSale} className="space-y-4">
            <div><label className="label">Input <span className="text-red-400">*</span></label>
              <select value={saleForm.inputId} onChange={e => setSF('inputId', e.target.value)} required className="input">
                <option value="">Select input…</option>
                {stock.filter(i => i.quantityAvailable > 0).map(i => (
                  <option key={i.id} value={i.id}>{i.inputName} ({i.quantityAvailable.toLocaleString()} {i.unit} available)</option>
                ))}
              </select>
              {selectedInputForSale && <p className="text-xs text-emerald-600 mt-1">Sell price: {selectedInputForSale.sellingPricePerUnit != null ? `₦${selectedInputForSale.sellingPricePerUnit}/${selectedInputForSale.unit}` : 'not set'}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Quantity <span className="text-red-400">*</span></label>
                <input type="number" min="0.01" step="0.01" value={saleForm.quantitySold} onChange={e => setSF('quantitySold', e.target.value)} required className="input" placeholder="0" /></div>
              <div><label className="label">Price / unit (₦) <span className="text-red-400">*</span></label>
                <input type="number" min="0.01" step="0.01" value={saleForm.pricePerUnit} onChange={e => setSF('pricePerUnit', e.target.value)} required className="input" placeholder="0" /></div>
              {saleForm.quantitySold && saleForm.pricePerUnit && (
                <div className="col-span-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-800">
                  Total: <strong>₦{(parseFloat(saleForm.quantitySold) * parseFloat(saleForm.pricePerUnit)).toLocaleString()}</strong>
                </div>
              )}
              <div><label className="label">Buyer Name</label><input value={saleForm.buyerName} onChange={e => setSF('buyerName', e.target.value)} className="input" placeholder="Full name" /></div>
              <div><label className="label">Buyer Phone</label><input value={saleForm.buyerPhone} onChange={e => setSF('buyerPhone', e.target.value)} className="input" placeholder="08012345678" /></div>
              <div><label className="label">Buyer NIN</label><input value={saleForm.buyerNin} onChange={e => setSF('buyerNin', e.target.value)} className="input" placeholder="11-digit NIN" /></div>
              <div><label className="label">Payment Method</label>
                <select value={saleForm.paymentMethod} onChange={e => setSF('paymentMethod', e.target.value)} className="input">
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
                </select></div>
              <div className="col-span-2"><label className="label">Notes</label>
                <textarea rows={2} value={saleForm.notes} onChange={e => setSF('notes', e.target.value)} className="input resize-none" placeholder="Additional notes…" /></div>
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowRecordSale(false)} submitting={recordingSale} submitLabel="Record Sale" />
          </form>
        </Modal>
      )}

      {showAddSupplier && (
        <Modal title="Add Supplier" onClose={() => setShowAddSupplier(false)}>
          <form onSubmit={handleAddSupplier} className="space-y-4">
            <SupplierFormFields form={supplierForm} set={setSup} />
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <ModalActions onCancel={() => setShowAddSupplier(false)} submitting={addingSupplier} submitLabel="Add Supplier" />
          </form>
        </Modal>
      )}

      {showEditSupplier && editingSupplier && (
        <Modal title="Edit Supplier" onClose={() => { setShowEditSupplier(false); setEditingSupplier(null); }}>
          <form onSubmit={handleEditSupplier} className="space-y-4">
            <SupplierFormFields form={editSupplierForm} set={setESup as any} showActiveToggle />
            {formError && <p className="text-sm text-red-500">{formError}</p>}
            <ModalActions onCancel={() => { setShowEditSupplier(false); setEditingSupplier(null); }} submitting={updatingSupplier} submitLabel="Save Changes" />
          </form>
        </Modal>
      )}

      {/* ── Delete confirmations ── */}
      {confirmDeleteInput && (
        <ConfirmDelete
          label={confirmDeleteInput.inputName}
          onConfirm={handleDeleteInput}
          onCancel={() => setConfirmDeleteInput(null)}
          loading={deletingStock}
        />
      )}
      {confirmDeleteSupplier && (
        <ConfirmDelete
          label={confirmDeleteSupplier.name}
          onConfirm={handleDeleteSupplier}
          onCancel={() => setConfirmDeleteSupplier(null)}
          loading={deletingSupplier}
        />
      )}

      {/* ── Drawers ── */}

      {selectedInput && (
        <Drawer onClose={() => setSelectedInput(null)} title={selectedInput.inputName} subtitle={selectedInput.refId}
          actions={
            <div className="flex gap-2">
              <button onClick={() => { openEditStock(selectedInput); setFormError(''); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition">
                <span className="material-symbols-outlined text-sm">edit</span>Edit
              </button>
              <button onClick={() => setConfirmDeleteInput(selectedInput)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition">
                <span className="material-symbols-outlined text-sm">delete</span>Delete
              </button>
            </div>
          }
        >
          <Section label="Details">
            <Field label="Type"           value={selectedInput.inputType} />
            <Field label="Brand"          value={selectedInput.brand} />
            <Field label="Unit"           value={selectedInput.unit} />
            <Field label="Supplier"       value={selectedInput.supplierName} />
            <Field label="Received"       value={`${selectedInput.quantityReceived.toLocaleString()} ${selectedInput.unit}`} />
            <Field label="Available"      value={`${selectedInput.quantityAvailable.toLocaleString()} ${selectedInput.unit}`} />
            <Field label="Sold"           value={`${selectedInput.quantitySold.toLocaleString()} ${selectedInput.unit}`} />
            <Field label="Purchase Price" value={selectedInput.purchasePricePerUnit != null ? `₦${selectedInput.purchasePricePerUnit}/${selectedInput.unit}` : null} />
            <Field label="Selling Price"  value={selectedInput.sellingPricePerUnit  != null ? `₦${selectedInput.sellingPricePerUnit}/${selectedInput.unit}`  : null} />
          </Section>
          {selectedInput.notes && <Section label="Notes"><p className="text-slate-700 text-sm">{selectedInput.notes}</p></Section>}
        </Drawer>
      )}

      {selectedSale && (
        <Drawer onClose={() => setSelectedSale(null)} title="Input Sale Receipt" subtitle={selectedSale.receiptNumber}
          actions={
            <button
              onClick={() => printReceipt({
                title: 'Farm Input Sale Receipt',
                receiptNumber: selectedSale.receiptNumber,
                date: new Date(selectedSale.createdAt).toLocaleString(),
                lines: [
                  { label: 'Item',       value: `${selectedSale.inputName} (${selectedSale.inputType})` },
                  { label: 'Quantity',   value: `${selectedSale.quantitySold.toLocaleString()} ${selectedSale.unit}` },
                  { label: 'Price/unit', value: `₦${selectedSale.pricePerUnit.toLocaleString()}` },
                  { label: 'Total',      value: `₦${selectedSale.totalAmount.toLocaleString()}`, bold: true },
                  { label: 'Payment',    value: selectedSale.paymentMethod.replace('_', ' ') },
                ],
                buyerName:  selectedSale.buyerName,
                buyerPhone: selectedSale.buyerPhone,
                buyerNin:   selectedSale.buyerNin,
                notes:      selectedSale.notes,
              })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-boa-green text-white text-xs font-semibold hover:bg-emerald-700 transition">
              <span className="material-symbols-outlined text-sm">print</span>Print Receipt
            </button>
          }>
          <Section label="Sale Details">
            <Field label="Input"      value={`${selectedSale.inputName} (${selectedSale.inputType})`} />
            <Field label="Quantity"   value={`${selectedSale.quantitySold.toLocaleString()} ${selectedSale.unit}`} />
            <Field label="Price/unit" value={`₦${selectedSale.pricePerUnit.toLocaleString()}`} />
            <Field label="Total"      value={`₦${selectedSale.totalAmount.toLocaleString()}`} />
            <Field label="Payment"    value={selectedSale.paymentMethod.replace('_', ' ')} />
            <Field label="Date"       value={selectedSale.createdAt.slice(0, 10)} />
          </Section>
          <Section label="Buyer">
            <Field label="Name"  value={selectedSale.buyerName} />
            <Field label="Phone" value={selectedSale.buyerPhone} />
            <Field label="NIN"   value={selectedSale.buyerNin} />
          </Section>
        </Drawer>
      )}

      {selectedSupplier && (
        <Drawer onClose={() => setSelectedSupplier(null)} title={selectedSupplier.name} subtitle={selectedSupplier.supplierType}
          actions={
            <div className="flex gap-2">
              <button onClick={() => { openEditSupplier(selectedSupplier); setFormError(''); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition">
                <span className="material-symbols-outlined text-sm">edit</span>Edit
              </button>
              <button onClick={() => setConfirmDeleteSupplier(selectedSupplier)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 transition">
                <span className="material-symbols-outlined text-sm">delete</span>Delete
              </button>
            </div>
          }
        >
          <Section label="Contact">
            <Field label="Phone"   value={selectedSupplier.phone} />
            <Field label="Email"   value={selectedSupplier.email} />
            <Field label="Address" value={selectedSupplier.address} />
            <Field label="State"   value={selectedSupplier.state} />
            <Field label="LGA"     value={selectedSupplier.lga} />
            <Field label="Status"  value={selectedSupplier.isActive ? 'Active' : 'Inactive'} />
          </Section>
        </Drawer>
      )}
    </div>
  );
}

// ── Shared form component ────────────────────────────────────────────────────

function SupplierFormFields({ form, set, showActiveToggle }: { form: any; set: (k: string, v: any) => void; showActiveToggle?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2"><label className="label">Supplier Name <span className="text-red-400">*</span></label>
        <input value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => set('name', e.target.value)} required className="input" placeholder="Full name or company name" /></div>
      <div><label className="label">Type</label>
        <select value={form.supplierType} onChange={(e: ChangeEvent<HTMLSelectElement>) => set('supplierType', e.target.value)} className="input">
          <option value="individual">Individual</option>
          <option value="company">Company</option>
        </select></div>
      <div><label className="label">Phone</label>
        <input value={form.phone} onChange={(e: ChangeEvent<HTMLInputElement>) => set('phone', e.target.value)} className="input" placeholder="08012345678" /></div>
      <div className="col-span-2"><label className="label">Email</label>
        <input value={form.email} onChange={(e: ChangeEvent<HTMLInputElement>) => set('email', e.target.value)} className="input" placeholder="email@example.com" /></div>
      <div><label className="label">State</label>
        <input value={form.state} onChange={(e: ChangeEvent<HTMLInputElement>) => set('state', e.target.value)} className="input" placeholder="e.g. Kano" /></div>
      <div><label className="label">LGA</label>
        <input value={form.lga} onChange={(e: ChangeEvent<HTMLInputElement>) => set('lga', e.target.value)} className="input" placeholder="e.g. Kano Municipal" /></div>
      <div className="col-span-2"><label className="label">Address</label>
        <input value={form.address} onChange={(e: ChangeEvent<HTMLInputElement>) => set('address', e.target.value)} className="input" placeholder="Street address" /></div>
      {showActiveToggle && (
        <div className="col-span-2 flex items-center gap-3">
          <label className="label mb-0">Active</label>
          <button type="button" onClick={() => set('isActive', !form.isActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared helper components ─────────────────────────────────────────────────

function ConfirmDelete({ label, onConfirm, onCancel, loading }: { label: string; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-2xl text-red-600">delete</span>
        </div>
        <h3 className="text-base font-semibold text-slate-800 mb-1">Delete "{label}"?</h3>
        <p className="text-sm text-slate-500 mb-5">This action cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition">
            {loading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function ModalActions({ onCancel, submitting, submitLabel }: { onCancel: () => void; submitting: boolean; submitLabel: string }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Cancel</button>
      <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
        {submitting ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}

function Drawer({ title, subtitle, onClose, actions, children }: { title: string; subtitle?: string; onClose: () => void; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold text-slate-800">{title}</p>
              {subtitle && <p className="text-xs text-slate-400 font-mono mt-0.5 capitalize">{subtitle}</p>}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
          </div>
          {actions && <div>{actions}</div>}
        </div>
        <div className="flex-1 px-6 py-5 space-y-5 text-sm">{children}</div>
        <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">Close</button>
        </div>
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

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = { seed: 'bg-green-100 text-green-700', fertilizer: 'bg-amber-100 text-amber-700', equipment: 'bg-blue-100 text-blue-700', other: 'bg-slate-100 text-slate-600' };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${colors[type] ?? 'bg-slate-100 text-slate-600'}`}>{type}</span>;
}

function PaymentBadge({ method }: { method: string }) {
  const colors: Record<string, string> = { cash: 'bg-emerald-100 text-emerald-700', mobile_money: 'bg-blue-100 text-blue-700', bank_transfer: 'bg-purple-100 text-purple-700' };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[method] ?? 'bg-slate-100 text-slate-600'}`}>{method.replace('_', ' ')}</span>;
}
