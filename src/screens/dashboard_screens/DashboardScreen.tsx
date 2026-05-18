import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { useGetApplicationsQuery } from '../applications_screens/services/applicationsApiSlice';

const statCards = [
  { label: 'Pending Review',    status: 'pending',      icon: 'pending',      color: 'text-amber-600  bg-amber-50  border-amber-200'  },
  { label: 'Under Review',      status: 'under_review', icon: 'rate_review',  color: 'text-blue-600   bg-blue-50   border-blue-200'   },
  { label: 'Approved',          status: 'approved',     icon: 'check_circle', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { label: 'Rejected',          status: 'rejected',     icon: 'cancel',       color: 'text-red-600    bg-red-50    border-red-200'    },
];

export default function DashboardScreen() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: allApps } = useGetApplicationsQuery({});

  const countByStatus = (status: string) =>
    allApps?.data.filter((a: any) => a.status === status).length ?? 0;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Welcome back, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Here's what's happening with BOA AgriHub today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.status} className={`rounded-2xl border p-5 ${card.color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{card.label}</p>
                <p className="text-3xl font-bold mt-1">{countByStatus(card.status)}</p>
              </div>
              <span className="material-symbols-outlined filled text-2xl opacity-80">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Applications</h2>
          <a href="/applications" className="text-boa-green text-sm font-medium hover:underline">View all</a>
        </div>
        <div className="divide-y divide-slate-50">
          {allApps?.data.slice(0, 6).map((app: any) => (
            <div key={app.id} className="px-6 py-3.5 flex items-center gap-4">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-base text-slate-500">warehouse</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{app.centreName}</p>
                <p className="text-xs text-slate-400">{app.refId} · {app.state}</p>
              </div>
              <StatusBadge status={app.status} />
            </div>
          ))}
          {!allApps?.data.length && (
            <div className="px-6 py-12 text-center text-slate-400 text-sm">No applications yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:      'bg-amber-100 text-amber-700',
    under_review: 'bg-blue-100 text-blue-700',
    approved:     'bg-emerald-100 text-emerald-700',
    rejected:     'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
