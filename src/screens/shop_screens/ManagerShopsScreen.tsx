import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import {
  useListShopsQuery, useCreateShopMutation, useUpdateShopStatusMutation,
  type Shop,
} from './services/shopApiSlice';

const BUSINESS_TYPES = ['Grain Trading', 'Commodity Aggregation', 'Input Supply', 'Processing', 'General Trade'];

export default function ManagerShopsScreen() {
  const user = useSelector((s: RootState) => s.auth.user);

  const { data, isLoading }                         = useListShopsQuery();
  const [createShop,      { isLoading: creating }]  = useCreateShopMutation();
  const [updateStatus,    { isLoading: updating }]  = useUpdateShopStatusMutation();

  const [showForm, setShowForm]   = useState(false);
  const [selected, setSelected]   = useState<Shop | null>(null);
  const [formError, setFormError] = useState('');
  const [search, setSearch]       = useState('');
  const [form, setForm] = useState({
    shopName: '', ownerName: '', ownerPhone: '', ownerNin: '',
    businessType: '', spaceNumber: '',
    ownerEmail: '', ownerPassword: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const shops = data?.data ?? [];
  const filtered = shops.filter(s =>
    !search ||
    s.shopName.toLowerCase().includes(search.toLowerCase()) ||
    s.shopRefId.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount    = shops.filter(s => s.status === 'active').length;
  const suspendedCount = shops.filter(s => s.status === 'suspended').length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await createShop({
        shopName:     form.shopName,
        ownerName:    form.ownerName,
        ownerPhone:   form.ownerPhone,
        ownerNin:     form.ownerNin || undefined,
        businessType: form.businessType || undefined,
        spaceNumber:  form.spaceNumber  || undefined,
        ownerEmail:   form.ownerEmail   || undefined,
        ownerPassword: form.ownerPassword || undefined,
      } as any).unwrap();
      setShowForm(false);
      setForm({ shopName: '', ownerName: '', ownerPhone: '', ownerNin: '', businessType: '', spaceNumber: '', ownerEmail: '', ownerPassword: '' });
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to create shop.');
    }
  };

  const handleToggleStatus = async (shop: Shop) => {
    const next = shop.status === 'active' ? 'suspended' : 'active';
    await updateStatus({ id: shop.id, status: next });
    setSelected(prev => prev?.id === shop.id ? { ...prev, status: next } : prev);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Container Shops</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage business owners operating within this centre</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
          <span className="material-symbols-outlined text-base">add_business</span>
          Onboard Shop
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Shops"  value={shops.length}   icon="storefront"   color="bg-slate-50 text-slate-700 border-slate-200" />
        <StatCard label="Active"       value={activeCount}    icon="check_circle" color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard label="Suspended"    value={suspendedCount} icon="block"        color="bg-red-50 text-red-700 border-red-200" />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by shop name, ID, or owner…"
          className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
      </div>

      {/* Shops table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">storefront</span>
            <p className="text-slate-400 text-sm mt-2">{search ? 'No shops match your search' : 'No shops registered yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Shop ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Shop Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Business Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Space</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(shop => (
                  <tr key={shop.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{shop.shopRefId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{shop.shopName}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-slate-700">{shop.ownerName}</p>
                      <p className="text-xs text-slate-400">{shop.ownerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{shop.businessType ?? '—'}</td>
                    <td className="px-5 py-3.5 text-slate-500">{shop.spaceNumber ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        shop.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {shop.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(shop)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Onboard Shop Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Onboard Container Shop</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shop Information</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shop Name <span className="text-red-400">*</span></label>
                <input value={form.shopName} onChange={e => set('shopName', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="e.g. Bello Grains Store" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Business Type</label>
                  <select value={form.businessType} onChange={e => set('businessType', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 bg-white">
                    <option value="">Not specified</option>
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Space / Container No.</label>
                  <input value={form.spaceNumber} onChange={e => set('spaceNumber', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="e.g. A-12" />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Business Owner</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Owner Full Name <span className="text-red-400">*</span></label>
                <input value={form.ownerName} onChange={e => set('ownerName', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Full name" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone <span className="text-red-400">*</span></label>
                  <input value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="08012345678" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">NIN</label>
                  <input value={form.ownerNin} onChange={e => set('ownerNin', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    placeholder="12345678901" />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Portal Access (optional)</p>
              <p className="text-xs text-slate-400">Create a login for the shop owner to access the Shop Portal.</p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input type="email" value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="owner@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
                <input type="password" value={form.ownerPassword} onChange={e => set('ownerPassword', e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Min 6 characters" minLength={6} />
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {creating ? 'Creating…' : 'Register Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shop detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-sm bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">{selected.shopName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.shopRefId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-4 text-sm">
              <Section label="Shop Details">
                <Row label="Business Type" value={selected.businessType ?? '—'} />
                <Row label="Space No."     value={selected.spaceNumber  ?? '—'} />
                <Row label="Status"        value={selected.status} />
                <Row label="Registered"    value={selected.createdAt.slice(0, 10)} />
              </Section>
              <Section label="Owner">
                <Row label="Name"  value={selected.ownerName} />
                <Row label="Phone" value={selected.ownerPhone} />
                <Row label="NIN"   value={selected.ownerNin ?? '—'} />
              </Section>
              {selected.staff && selected.staff.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Staff ({selected.staff.length})</p>
                  <div className="space-y-2">
                    {selected.staff.map(s => (
                      <div key={s.id} className="bg-slate-50 rounded-xl px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{s.name}</p>
                          <p className="text-xs text-slate-400">{s.email}</p>
                        </div>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">Sales Rep</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white flex gap-3">
              <button onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                Close
              </button>
              <button onClick={() => handleToggleStatus(selected)} disabled={updating}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 ${
                  selected.status === 'active'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}>
                {updating ? '…' : selected.status === 'active' ? 'Suspend' : 'Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  const [bg, text, border] = color.split(' ');
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${text}`}>{label}</p>
          <p className={`text-2xl font-bold mt-1 ${text}`}>{value}</p>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right capitalize">{value}</span>
    </div>
  );
}
