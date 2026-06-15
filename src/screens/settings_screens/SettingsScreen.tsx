import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { setCredentials } from '../../store/authSlice';
import {
  useGetMyProfileQuery,
  useUpdateMyProfileMutation,
  useChangeMyPasswordMutation,
} from './services/settingsApiSlice';

export default function SettingsScreen() {
  const dispatch    = useDispatch();
  const currentUser = useSelector((s: RootState) => s.auth.user);
  const token       = useSelector((s: RootState) => s.auth.token);
  const { data, isLoading } = useGetMyProfileQuery();
  const [updateProfile, { isLoading: saving }]      = useUpdateMyProfileMutation();
  const [changePassword, { isLoading: changingPw }] = useChangeMyPasswordMutation();

  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg,      setPwMsg]      = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (data?.data) {
      setName(data.data.name ?? '');
      setEmail(data.data.email ?? '');
    }
  }, [data]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    try {
      const result = await updateProfile({ name, email }).unwrap();
      if (token && result.data) {
        dispatch(setCredentials({ token, user: { id: result.data.id, userId: result.data.id, email: result.data.email, name: result.data.name, role: result.data.role, centreId: currentUser?.centreId, shopId: currentUser?.shopId } }));
      }
      setProfileMsg({ ok: true, text: 'Profile updated successfully.' });
    } catch (err: any) {
      setProfileMsg({ ok: false, text: err?.data?.message ?? 'Failed to update profile.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ ok: false, text: 'New passwords do not match.' });
      return;
    }
    if (newPw.length < 8) {
      setPwMsg({ ok: false, text: 'New password must be at least 8 characters.' });
      return;
    }
    if (!currentUser?.id) return;
    try {
      await changePassword({ userId: currentUser.id, currentPassword: currentPw, newPassword: newPw }).unwrap();
      setPwMsg({ ok: true, text: 'Password changed successfully.' });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err: any) {
      setPwMsg({ ok: false, text: err?.data?.message ?? 'Failed to change password.' });
    }
  };

  if (isLoading) {
    return <div className="p-4 md:p-8 text-center text-slate-400 text-sm">Loading…</div>;
  }

  const profile = data?.data;

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account profile and security</p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-5">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-3xl text-boa-green">person</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800">{profile?.name}</p>
            <p className="text-sm text-slate-500">{profile?.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              {profile?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Edit Profile</p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
            />
          </div>

          {profileMsg && (
            <p className={`text-sm font-medium ${profileMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {profileMsg.ok
                ? <><span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>{profileMsg.text}</>
                : profileMsg.text
              }
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Change password card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Change Password</p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
            />
          </div>

          {pwMsg && (
            <p className={`text-sm font-medium ${pwMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
              {pwMsg.ok
                ? <><span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>{pwMsg.text}</>
                : pwMsg.text
              }
            </p>
          )}

          <button
            type="submit"
            disabled={changingPw}
            className="px-5 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
          >
            {changingPw ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
