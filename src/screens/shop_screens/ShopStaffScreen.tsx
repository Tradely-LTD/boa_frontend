import { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useGetShopQuery, useAddStaffMutation, type StaffMember } from './services/shopApiSlice';

export default function ShopStaffScreen() {
  const user   = useSelector((s: RootState) => s.auth.user);
  const shopId = (user as any)?.shopId as number;

  const { data, isLoading, refetch } = useGetShopQuery(shopId, { skip: !shopId });
  const [addStaff, { isLoading: submitting }] = useAddStaffMutation();

  const [showForm, setShowForm]   = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const shop  = data?.data;
  const staff = shop?.staff ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    try {
      await addStaff({ shopId, name: form.name, email: form.email, password: form.password }).unwrap();
      setShowForm(false);
      setForm({ name: '', email: '', password: '' });
      refetch();
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to add staff.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>My Staff</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage sales representatives for your shop</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
          <span className="material-symbols-outlined text-base">person_add</span>
          Add Sales Rep
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : staff.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">group</span>
            <p className="text-slate-400 text-sm mt-2">No staff added yet</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-boa-green text-sm font-medium hover:underline">
              Add your first sales rep
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {staff.map((member: StaffMember) => (
              <div key={member.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-blue-600 text-xl">person</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800">{member.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{member.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    member.role === 'shop_owner' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {member.role === 'shop_owner' ? 'Shop Owner' : 'Sales Rep'}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-red-400'}`} title={member.isActive ? 'Active' : 'Inactive'} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note about rep access */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-blue-700">
        <span className="material-symbols-outlined text-base align-middle mr-1">info</span>
        Sales reps can log sales and expenses. They see only their own daily figures on their dashboard.
      </div>

      {/* Add Staff Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Add Sales Rep</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="e.g. Amina Bello" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-red-400">*</span></label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="amina@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password <span className="text-red-400">*</span></label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder="Min 6 characters" />
              </div>

              <p className="text-xs text-slate-400">The rep will log in with this email and password. They can change their password after first login.</p>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {submitting ? 'Creating…' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
