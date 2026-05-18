import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useGetMyListingsQuery,
  useCreateListingMutation,
  useUpdateListingMutation,
  useDeleteListingMutation,
  useRecordManualSaleMutation,
  useGetPresignedUrlMutation,
  type MarketplaceListing,
  type CreateListingPayload,
  type DeliveryZone,
  type PackagingInfo,
} from './services/marketplaceApiSlice';
import axios from 'axios';
import { COMMODITY_CONFIG, ALL_COMMODITIES, NIGERIAN_STATES } from './commodityConfig';

const STATUS_COLORS: Record<string, string> = {
  active:   'bg-green-100 text-green-800',
  paused:   'bg-yellow-100 text-yellow-800',
  sold_out: 'bg-red-100 text-red-800',
  expired:  'bg-gray-100 text-gray-600',
};

export default function MarketplaceListingsScreen() {
  const location = useLocation();
  const { data: listings = [], isLoading } = useGetMyListingsQuery();
  const [createListing, { isLoading: creating }] = useCreateListingMutation();
  const [updateListing, { isLoading: updating }] = useUpdateListingMutation();
  const [deleteListing] = useDeleteListingMutation();
  const [recordManualSale, { isLoading: saling }] = useRecordManualSaleMutation();
  const [getPresignedUrl] = useGetPresignedUrlMutation();

  const [showModal, setShowModal]           = useState(false);
  const [editTarget, setEditTarget]         = useState<MarketplaceListing | null>(null);
  const [manualSaleTarget, setManualSaleTarget] = useState<MarketplaceListing | null>(null);
  const [deleteConfirm, setDeleteConfirm]   = useState<MarketplaceListing | null>(null);
  const [uploadingImg, setUploadingImg]     = useState(false);
  const [previewImages, setPreviewImages]   = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_PACKAGING: PackagingInfo = { packageType: 'PP Woven Bag', packageWeightKg: 50, labelType: 'BOA Label', moqKg: 0 };

  const [form, setForm] = useState<CreateListingPayload & { centreLga: string; deliveryAvailable: boolean; deliveryZones: DeliveryZone[]; specs: Record<string, string>; packaging: PackagingInfo }>({
    commodity: '', gradeQuality: '', description: '', quantityAvailableKg: 0,
    pricePerKg: 0, images: [], centreState: '', centreLga: '', isReceiptBacked: false,
    deliveryAvailable: false, deliveryZones: [], specs: {}, packaging: { ...DEFAULT_PACKAGING },
  });
  const [newZone, setNewZone] = useState<DeliveryZone>({ state: '', lga: '', charge: 0 });
  const [saleForm, setSaleForm] = useState({ quantityKg: 0, buyerName: '', buyerPhone: '', notes: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const prefill = (location.state as any)?.prefill;
    if (prefill) {
      setEditTarget(null);
      setForm(f => ({
        ...f,
        commodity:           prefill.commodity           ?? '',
        quantityAvailableKg: prefill.quantityAvailableKg ?? 0,
        gradeQuality:        prefill.gradeQuality        ?? '',
        centreState:         prefill.centreState         ?? '',
        centreLga:           prefill.centreLga           ?? '',
      }));
      setPreviewImages([]);
      setError('');
      setShowModal(true);
      window.history.replaceState({}, '');
    }
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ commodity: '', gradeQuality: '', description: '', quantityAvailableKg: 0, pricePerKg: 0, images: [], centreState: '', centreLga: '', isReceiptBacked: false, deliveryAvailable: false, deliveryZones: [], specs: {}, packaging: { ...DEFAULT_PACKAGING } });
    setNewZone({ state: '', lga: '', charge: 0 });
    setPreviewImages([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (l: MarketplaceListing) => {
    setEditTarget(l);
    setForm({
      commodity: l.commodity, gradeQuality: l.gradeQuality ?? '', description: l.description ?? '',
      quantityAvailableKg: l.quantityAvailableKg, pricePerKg: l.pricePerKg, images: l.images,
      centreState: l.centreState, centreLga: l.centreLga ?? '', isReceiptBacked: l.isReceiptBacked,
      deliveryAvailable: (l as any).deliveryAvailable ?? false,
      deliveryZones: (l as any).deliveryZones ?? [],
      specs: (l as any).specs ?? {},
      packaging: (l as any).packaging ?? { ...DEFAULT_PACKAGING },
    });
    setNewZone({ state: '', lga: '', charge: 0 });
    setPreviewImages(l.images);
    setError('');
    setShowModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploadingImg(true);
    const uploaded: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'jpg';
      const { uploadUrl, objectUrl } = await getPresignedUrl({ fileExtension: ext }).unwrap();
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
      uploaded.push(objectUrl);
    }
    const next = [...previewImages, ...uploaded];
    setPreviewImages(next);
    setForm(f => ({ ...f, images: next }));
    setUploadingImg(false);
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (editTarget) {
        await updateListing({ id: editTarget.id, ...form }).unwrap();
      } else {
        await createListing(form).unwrap();
      }
      setShowModal(false);
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to save listing.');
    }
  };

  const handleToggleStatus = async (l: MarketplaceListing) => {
    const next = l.status === 'active' ? 'paused' : 'active';
    await updateListing({ id: l.id, status: next }).unwrap();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteListing(deleteConfirm.id).unwrap();
    setDeleteConfirm(null);
  };

  const handleManualSale = async () => {
    if (!manualSaleTarget) return;
    setError('');
    try {
      await recordManualSale({ listingId: manualSaleTarget.id, ...saleForm }).unwrap();
      setManualSaleTarget(null);
    } catch (e: any) {
      setError(e?.data?.message ?? 'Failed to record sale.');
    }
  };

  const f = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marketplace Listings</h1>
          <p className="text-gray-500 text-sm mt-1">Post and manage your commodity listings for buyers</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-boa-green text-white rounded-xl font-semibold hover:bg-emerald-800 transition"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Post Listing
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading listings…</div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-4">
          <span className="material-symbols-outlined text-5xl text-gray-300">storefront</span>
          <p className="text-gray-500">No listings yet. Post your first commodity to the marketplace.</p>
          <button onClick={openCreate} className="px-4 py-2 bg-boa-green text-white rounded-xl font-semibold">Post Listing</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map(l => (
            <div key={l.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                {l.images[0] ? (
                  <img src={l.images[0]} alt={l.commodity} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="material-symbols-outlined text-4xl text-gray-300">grain</span>
                  </div>
                )}
                <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[l.status]}`}>
                  {l.status.replace('_', ' ').toUpperCase()}
                </span>
                {l.isReceiptBacked && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-800 text-white flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    Receipt Backed
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{l.commodity}</h3>
                    {l.gradeQuality && <p className="text-xs text-gray-500">{l.gradeQuality}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{l.centreState}{l.centreLga ? ` · ${l.centreLga}` : ''}</p>
                  </div>
                  <p className="text-emerald-700 font-bold text-sm">{f(l.pricePerKg)}/kg</p>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Available</span>
                    <span className="font-semibold text-gray-700">{l.quantityAvailableKg.toLocaleString()} kg</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleStatus(l)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 transition"
                  >
                    <span className="material-symbols-outlined text-sm">{l.status === 'active' ? 'pause' : 'play_arrow'}</span>
                    {l.status === 'active' ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { setManualSaleTarget(l); setSaleForm({ quantityKg: 0, buyerName: '', buyerPhone: '', notes: '' }); setError(''); }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                  >
                    <span className="material-symbols-outlined text-sm">sell</span>
                    Record Sale
                  </button>
                  <button onClick={() => openEdit(l)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-sm text-gray-500">edit</span>
                  </button>
                  <button onClick={() => setDeleteConfirm(l)} className="p-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition">
                    <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editTarget ? 'Edit Listing' : 'Post New Listing'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}

              {/* ── Commodity & Grade ───────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Commodity *</label>
                  {ALL_COMMODITIES.includes(form.commodity) || form.commodity === '' ? (
                    <select
                      value={form.commodity}
                      onChange={e => {
                        if (e.target.value === '__other__') {
                          setForm(f => ({ ...f, commodity: '', gradeQuality: '', specs: {} }));
                        } else {
                          setForm(f => ({ ...f, commodity: e.target.value, gradeQuality: '', specs: {} }));
                        }
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select commodity</option>
                      {ALL_COMMODITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__other__">Other / Not Listed…</option>
                    </select>
                  ) : (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={form.commodity}
                        onChange={e => setForm(f => ({ ...f, commodity: e.target.value, gradeQuality: '', specs: {} }))}
                        placeholder="e.g. AZ Fertilizer"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, commodity: '', gradeQuality: '', specs: {} }))}
                        className="px-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg text-xs"
                        title="Back to list"
                      >↩</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Grade {form.commodity && COMMODITY_CONFIG[form.commodity] && <span className="text-emerald-600">(specific to {form.commodity})</span>}
                  </label>
                  {form.commodity && COMMODITY_CONFIG[form.commodity] ? (
                    <select
                      value={form.gradeQuality ?? ''}
                      onChange={e => setForm(f => ({ ...f, gradeQuality: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select grade</option>
                      {COMMODITY_CONFIG[form.commodity].grades.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  ) : (
                    <input
                      type="text" value={form.gradeQuality ?? ''}
                      onChange={e => setForm(f => ({ ...f, gradeQuality: e.target.value }))}
                      placeholder="e.g. Grade A, Premium…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              {/* ── Quality Specs ───────────────────────────────────────── */}
              {form.commodity && COMMODITY_CONFIG[form.commodity]?.specs?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-emerald-600">biotech</span>
                    Quality Analysis (optional)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {COMMODITY_CONFIG[form.commodity].specs.map(sf => (
                      <div key={sf.key}>
                        <label className="block text-xs text-gray-500 mb-1">
                          {sf.label}{sf.unit ? <span className="text-gray-400"> ({sf.unit})</span> : ''}
                        </label>
                        <input
                          type="text"
                          value={form.specs?.[sf.key] ?? ''}
                          onChange={e => setForm(f => ({ ...f, specs: { ...f.specs, [sf.key]: e.target.value } }))}
                          placeholder={sf.unit ? `e.g. 12.5` : 'e.g. Good'}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Quantity & Price ────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity (kg) *</label>
                  <input type="number" value={form.quantityAvailableKg || ''} onChange={e => setForm(f => ({ ...f, quantityAvailableKg: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price per kg (₦) *</label>
                  <input type="number" value={form.pricePerKg || ''} onChange={e => setForm(f => ({ ...f, pricePerKg: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" />
                </div>
              </div>

              {/* ── Location ────────────────────────────────────────────── */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State *</label>
                  <select value={form.centreState} onChange={e => setForm(f => ({ ...f, centreState: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Select</option>
                    {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">LGA</label>
                  <input type="text" value={form.centreLga} onChange={e => setForm(f => ({ ...f, centreLga: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Optional" />
                </div>
              </div>

              {/* ── Delivery Zones ──────────────────────────────────────── */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">local_shipping</span>
                    Delivery Zones
                  </p>
                  <label className="flex items-center gap-2 text-xs text-blue-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.deliveryAvailable}
                      onChange={e => setForm(f => ({ ...f, deliveryAvailable: e.target.checked }))}
                      className="rounded"
                    />
                    Offer delivery
                  </label>
                </div>

                {form.deliveryAvailable && (
                  <>
                    {/* Existing zones */}
                    {(form.deliveryZones ?? []).length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {(form.deliveryZones ?? []).map((z, i) => (
                          <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 text-xs">
                            <span className="text-gray-700">{z.state}{z.lga ? ` · ${z.lga}` : ''}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-blue-700">₦{z.charge.toLocaleString()}</span>
                              <button
                                onClick={() => setForm(f => ({ ...f, deliveryZones: (f.deliveryZones ?? []).filter((_, j) => j !== i) }))}
                                className="text-red-400 hover:text-red-600"
                              >×</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add zone row */}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <label className="block text-xs text-blue-600 mb-1">State</label>
                        <select
                          value={newZone.state}
                          onChange={e => setNewZone(z => ({ ...z, state: e.target.value }))}
                          className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        >
                          <option value="">State</option>
                          {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="col-span-4">
                        <label className="block text-xs text-blue-600 mb-1">City / LGA</label>
                        <input
                          type="text" value={newZone.lga ?? ''}
                          onChange={e => setNewZone(z => ({ ...z, lga: e.target.value }))}
                          placeholder="Optional"
                          className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-xs text-blue-600 mb-1">Charge (₦)</label>
                        <input
                          type="number" value={newZone.charge || ''}
                          onChange={e => setNewZone(z => ({ ...z, charge: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                          className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          onClick={() => {
                            if (!newZone.state || !newZone.charge) return;
                            setForm(f => ({ ...f, deliveryZones: [...(f.deliveryZones ?? []), { ...newZone }] }));
                            setNewZone({ state: '', lga: '', charge: 0 });
                          }}
                          className="w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition"
                        >+</button>
                      </div>
                    </div>
                    <p className="text-xs text-blue-500 mt-2">Add one row per state or city you deliver to.</p>
                  </>
                )}
                {!form.deliveryAvailable && (
                  <p className="text-xs text-blue-500">Enable delivery to configure per-state charges for buyers.</p>
                )}
              </div>

              {/* ── Packaging Information ───────────────────────────────── */}
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">inventory_2</span>
                  Packaging Information
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-amber-700 mb-1">Package Type</label>
                    <select
                      value={form.packaging?.packageType ?? ''}
                      onChange={e => setForm(f => ({ ...f, packaging: { ...f.packaging!, packageType: e.target.value } }))}
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    >
                      {['PP Woven Bag', 'Jute Sack', 'Sisal Bag', 'Nylon Bag', 'Drum', 'Bulk (Loose)'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-amber-700 mb-1">Net Weight per Package (kg)</label>
                    <input
                      type="number" min="1"
                      value={form.packaging?.packageWeightKg || ''}
                      onChange={e => setForm(f => ({ ...f, packaging: { ...f.packaging!, packageWeightKg: parseFloat(e.target.value) || 0 } }))}
                      placeholder="e.g. 50"
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-700 mb-1">Label Type</label>
                    <select
                      value={form.packaging?.labelType ?? ''}
                      onChange={e => setForm(f => ({ ...f, packaging: { ...f.packaging!, labelType: e.target.value } }))}
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    >
                      {['BOA Label', 'Custom Label', 'Unlabeled'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-amber-700 mb-1">Min. Order Qty (kg) <span className="text-amber-500 font-normal">— 0 = no min</span></label>
                    <input
                      type="number" min="0"
                      value={form.packaging?.moqKg || ''}
                      onChange={e => setForm(f => ({ ...f, packaging: { ...f.packaging!, moqKg: parseFloat(e.target.value) || 0 } }))}
                      placeholder="0"
                      className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="block text-xs text-amber-700 mb-1">Packaging Notes <span className="text-amber-500 font-normal">(optional)</span></label>
                  <input
                    type="text"
                    value={form.packaging?.notes ?? ''}
                    onChange={e => setForm(f => ({ ...f, packaging: { ...f.packaging!, notes: e.target.value } }))}
                    placeholder="e.g. Hermetically sealed, moisture-proof lining…"
                    className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                  />
                </div>
              </div>

              {/* ── Description ─────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea rows={3} value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Additional details about the commodity…" />
              </div>

              {/* ── Images ──────────────────────────────────────────────── */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Images</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {previewImages.map((url, i) => (
                    <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                      <img src={url} className="w-full h-full object-cover" />
                      <button onClick={() => { const next = previewImages.filter((_, j) => j !== i); setPreviewImages(next); setForm(f => ({ ...f, images: next })); }} className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploadingImg} className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-emerald-400 hover:text-emerald-500 transition">
                    {uploadingImg ? <span className="text-xs">...</span> : <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>}
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.isReceiptBacked ?? false} onChange={e => setForm(f => ({ ...f, isReceiptBacked: e.target.checked }))} className="rounded" />
                This listing is backed by an AgriHub Backed Receipt
              </label>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={creating || updating} className="px-6 py-2 bg-boa-green text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition disabled:opacity-50">
                {creating || updating ? 'Saving…' : editTarget ? 'Save Changes' : 'Post Listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Sale Modal */}
      {manualSaleTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Record Manual Sale</h2>
              <button onClick={() => setManualSaleTarget(null)}><span className="material-symbols-outlined text-gray-400">close</span></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>}
              <p className="text-sm text-gray-600">
                <strong>{manualSaleTarget.commodity}</strong> — Available: <strong>{manualSaleTarget.quantityAvailableKg.toLocaleString()} kg</strong>
              </p>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity Sold (kg) *</label>
                <input type="number" value={saleForm.quantityKg || ''} onChange={e => setSaleForm(f => ({ ...f, quantityKg: parseFloat(e.target.value) }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Buyer Name</label>
                  <input type="text" value={saleForm.buyerName} onChange={e => setSaleForm(f => ({ ...f, buyerName: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Buyer Phone</label>
                  <input type="text" value={saleForm.buyerPhone} onChange={e => setSaleForm(f => ({ ...f, buyerPhone: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={saleForm.notes} onChange={e => setSaleForm(f => ({ ...f, notes: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              {saleForm.quantityKg > 0 && (
                <div className="bg-emerald-50 rounded-lg p-3 text-sm">
                  <span className="text-gray-600">Total: </span>
                  <strong className="text-emerald-700">₦{(saleForm.quantityKg * manualSaleTarget.pricePerKg).toLocaleString()}</strong>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setManualSaleTarget(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleManualSale} disabled={saling} className="px-6 py-2 bg-boa-green text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition disabled:opacity-50">
                {saling ? 'Saving…' : 'Record Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Listing?</h2>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove the <strong>{deleteConfirm.commodity}</strong> listing. This cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
