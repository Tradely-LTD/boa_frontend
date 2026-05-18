import { useState } from 'react';
import { useGetUsersQuery, useUpdateUserMutation, useCreateUserMutation } from './services/usersApiSlice';
import { useGetCentresQuery } from '../centres_screens/services/centresApiSlice';
import Pagination from '../../components/Pagination/Pagination';

export default function UsersScreen() {
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const { data, isLoading } = useGetUsersQuery({ page, limit });
  const [updateUser]        = useUpdateUserMutation();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();

  const { data: centresData } = useGetCentresQuery({});
  const centres = centresData?.data ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'admin', centreId: '' });
  const [createError, setCreateError] = useState('');

  const toggleActive = (id: number, current: boolean) =>
    updateUser({ id, isActive: !current });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    try {
      await createUser({ ...form, centreId: form.centreId ? parseInt(form.centreId) : undefined } as any).unwrap();
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'admin', centreId: '' });
    } catch (err: any) {
      setCreateError(err?.data?.message ?? 'Failed to create user.');
    }
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage admin portal users</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">person_add</span>
          Create User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5"/>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.data.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-emerald-600">person</span>
                      </div>
                      <span className="font-medium text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                      ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : user.role === 'centre_manager' ? 'bg-emerald-100 text-emerald-700' : user.role === 'collector' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role === 'super_admin' ? 'Super Admin' : user.role === 'centre_manager' ? 'Centre Manager' : user.role === 'collector' ? 'Collector' : 'Admin'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{user.createdAt.slice(0, 10)}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                      ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleActive(user.id, user.isActive)}
                      className="text-xs font-medium text-slate-500 hover:text-boa-green transition"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        {data && data.totalPages > 0 && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            limit={limit}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        )}
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-800">Create New User</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
                  placeholder="e.g. Ibrahim Musa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
                  placeholder="admin@boa.gov.ng"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
                  placeholder="Min 8 characters"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm(f => ({ ...f, role: e.target.value, centreId: '' }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green bg-white"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="centre_manager">Centre Manager</option>
                  <option value="collector">Collector</option>
                </select>
              </div>

              {(form.role === 'centre_manager' || form.role === 'collector') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Assign to Centre <span className="text-red-400">*</span></label>
                  <select
                    value={form.centreId}
                    onChange={(e) => setForm(f => ({ ...f, centreId: e.target.value }))}
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green bg-white"
                  >
                    <option value="">Select centre…</option>
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>{c.centreName} — {c.state}</option>
                    ))}
                  </select>
                </div>
              )}

              {createError && (
                <p className="text-sm text-red-500">{createError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {creating ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
