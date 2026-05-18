import { useState } from 'react';
import { useGetMyDeploymentsQuery, useMarkTractorReturnedMutation } from '../../mechanization_screens/services/mechanizationApiSlice';

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-blue-100 text-blue-700',
  overdue:  'bg-red-100 text-red-700',
  returned: 'bg-slate-100 text-slate-600',
};

const STATUS_LABEL: Record<string, string> = {
  active:   'Active',
  overdue:  'Overdue',
  returned: 'Returned',
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MechDeploymentsScreen() {
  const { data: deployments = [], isLoading } = useGetMyDeploymentsQuery();
  const [markReturned] = useMarkTractorReturnedMutation();
  const [returningId, setReturningId]   = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');

  const counts = {
    active:   deployments.filter(d => d.status === 'active').length,
    overdue:  deployments.filter(d => d.status === 'overdue').length,
    returned: deployments.filter(d => d.status === 'returned').length,
  };

  const filtered = statusFilter === 'all'
    ? deployments
    : deployments.filter(d => d.status === statusFilter);

  const handleReturn = async (id: number) => {
    setReturningId(id);
    try {
      await markReturned(id).unwrap();
    } finally {
      setReturningId(null);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Active Deployments
        </h1>
        <p className="text-slate-500 text-sm mt-1">Tractors currently out with farmers and their return status</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Active"   value={counts.active}   icon="near_me"  color="text-blue-700 bg-blue-50 border-blue-200" />
        <StatCard label="Overdue"  value={counts.overdue}  icon="warning"  color="text-red-700 bg-red-50 border-red-200" />
        <StatCard label="Returned" value={counts.returned} icon="task_alt" color="text-slate-700 bg-slate-50 border-slate-200" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'active', 'overdue', 'returned'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize
              ${statusFilter === s ? 'bg-boa-green text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-boa-green'}`}
          >
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
            {s !== 'all' && counts[s as keyof typeof counts] > 0 && (
              <span className="ml-1.5 text-[10px] bg-white/20 px-1.5 rounded-full">
                {counts[s as keyof typeof counts]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Deployment cards */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">near_me</span>
          <p className="text-slate-400 text-sm mt-2">No deployments in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(dep => (
            <div
              key={dep.id}
              className={`bg-white rounded-2xl border p-5 ${dep.status === 'overdue' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <p className="font-bold text-slate-800">{dep.tractorModel}</p>
                    <span className="text-xs text-slate-400 font-mono">{dep.tractorSerial}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[dep.status]}`}>
                      {STATUS_LABEL[dep.status]}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <InfoChip icon="person"         label="Farmer"          value={dep.farmerName} />
                    <InfoChip icon="phone"          label="Phone"           value={dep.farmerPhone} />
                    <InfoChip icon="calendar_today" label="Deployed"        value={fmt(dep.deployedAt)} />
                    <InfoChip
                      icon="event"
                      label="Expected Return"
                      value={fmt(dep.expectedReturnAt)}
                      highlight={dep.status === 'overdue'}
                    />
                  </div>

                  {/* Implements */}
                  {dep.implementsAttached.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {dep.implementsAttached.map(impl => (
                        <span key={impl} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full capitalize">
                          {impl.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Last known location */}
                  {dep.lastKnownLat !== null && dep.lastKnownLng !== null && (
                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      Last location: {dep.lastKnownLat.toFixed(4)}, {dep.lastKnownLng.toFixed(4)}
                      {dep.lastLocationAt && ` · ${fmt(dep.lastLocationAt)}`}
                    </p>
                  )}
                </div>

                {/* Action */}
                {dep.status !== 'returned' && (
                  <div className="shrink-0">
                    <button
                      onClick={() => handleReturn(dep.id)}
                      disabled={returningId === dep.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-base">assignment_return</span>
                      {returningId === dep.id ? 'Updating...' : 'Mark Returned'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
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

function InfoChip({ icon, label, value, highlight }: { icon: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-0.5">
        <span className="material-symbols-outlined text-xs">{icon}</span>
        {label}
      </p>
      <p className={`text-sm font-medium mt-0.5 ${highlight ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>{value}</p>
    </div>
  );
}
