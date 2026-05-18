import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useGetReceiptsQuery } from '../receipts/services/receiptsApiSlice';
import { useGetIntakesQuery } from '../intake/services/intakeApiSlice';

export default function ManagerDashboardScreen() {
  const user = useSelector((s: RootState) => s.auth.user);

  const { data: receiptsData } = useGetReceiptsQuery({ limit: 100 });
  const { data: intakeData }   = useGetIntakesQuery({ limit: 100 });

  const receipts   = receiptsData?.data ?? [];
  const intakes    = intakeData?.data   ?? [];
  const centreName = receipts[0]?.centreName ?? intakes[0]?.centreName ?? null;

  const active   = receipts.filter(r => r.status === 'active').length;
  const pledged  = receipts.filter(r => r.status === 'pledged').length;
  const redeemed = receipts.filter(r => r.status === 'redeemed').length;
  const totalKg  = intakes.reduce((sum, i) => sum + i.quantityKg, 0);

  const recent = [...receipts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const statusStyle: Record<string, string> = {
    active:   'bg-emerald-100 text-emerald-700',
    pledged:  'bg-amber-100 text-amber-700',
    redeemed: 'bg-slate-100 text-slate-600',
    expired:  'bg-red-100 text-red-600',
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {centreName ?? 'Your centre'} — AgriHub Receipt overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Receipts"  value={active}   icon="receipt_long"    color="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <StatCard label="Pledged"          value={pledged}  icon="account_balance" color="text-amber-700 bg-amber-50 border-amber-200" />
        <StatCard label="Redeemed"         value={redeemed} icon="task_alt"        color="text-slate-700 bg-slate-50 border-slate-200" />
        <StatCard
          label="Total Intake"
          value={`${(totalKg / 1000).toFixed(1)} MT`}
          icon="scale"
          color="text-blue-700 bg-blue-50 border-blue-200"
        />
      </div>

      {/* Recent receipts */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent AgriHub Receipts</h2>
          <a href="/manager/receipts" className="text-boa-green text-sm font-medium hover:underline">View all</a>
        </div>

        {recent.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">receipt_long</span>
            <p className="text-slate-400 text-sm mt-2">No receipts issued yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {recent.map(r => (
              <li key={r.id} className="flex items-center gap-4 px-6 py-3.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base text-slate-500">receipt_long</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.farmerName}</p>
                  <p className="text-xs text-slate-400 font-mono">{r.receiptNumber} · {r.commodity} · {(r.quantityKg / 1000).toFixed(2)} MT</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusStyle[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const [text, bg, border] = color.split(' ');
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${text}`}>{label}</p>
          <p className={`text-3xl font-bold mt-1 ${text}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined filled text-2xl opacity-80 ${text}`}>{icon}</span>
      </div>
    </div>
  );
}
