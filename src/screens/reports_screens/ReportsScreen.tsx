import { useGetAnalyticsQuery } from './services/analyticsApiSlice';
import { useExport } from '../../hooks/useExport';
import PrintReportHeader from './PrintReportHeader';

const STATUS_COLORS: Record<string, string> = {
  pending:      'bg-amber-400',
  under_review: 'bg-blue-400',
  approved:     'bg-emerald-500',
  rejected:     'bg-red-400',
};

const TYPE_LABELS: Record<string, string> = {
  primary:          'Primary',
  secondary:        'Secondary',
  collection_point: 'Collection Point',
};

export default function ReportsScreen() {
  const { openPdf } = useExport();
  const { data, isLoading } = useGetAnalyticsQuery();
  const d = data?.data;

  if (isLoading || !d) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-96">
        <div className="text-slate-400 text-sm">Loading analytics…</div>
      </div>
    );
  }

  const appTotal    = d.applications.total || 1;
  const monthMax    = Math.max(...d.appsByMonth.map(m => m.total), 1);
  const stateMax    = Math.max(...d.appsByState.map(s => s.total), 1);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PrintReportHeader title="Reports & Analytics" subtitle={`Bank of Agriculture AgriHub — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Overview of applications and aggregation centres</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => openPdf('applications')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-base">table_view</span>
            Applications PDF
          </button>
          <button
            onClick={() => openPdf('centres')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-base">warehouse</span>
            Centres PDF
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            Export Report PDF
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon="assignment"   label="Total Applications" value={d.applications.total}          color="text-slate-700"   bg="bg-slate-50"    border="border-slate-200" />
        <KpiCard icon="warehouse"    label="Active Centres"     value={d.centres.active}               color="text-emerald-700" bg="bg-emerald-50"  border="border-emerald-200" />
        <KpiCard icon="check_circle" label="Approval Rate"      value={`${appTotal > 1 ? Math.round((d.applications.approved / appTotal) * 100) : 0}%`} color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
        <KpiCard icon="scale"        label="Total Capacity"     value={`${(d.centres.totalCapacityMt ?? 0).toLocaleString()} MT`} color="text-amber-700" bg="bg-amber-50" border="border-amber-200" />
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Application status breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Applications by Status</h2>
          <div className="space-y-3">
            {(['pending', 'under_review', 'approved', 'rejected'] as const).map(status => {
              const val = d.applications[status];
              const pct = Math.round((val / appTotal) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 capitalize">{status.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-800">{val} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STATUS_COLORS[status]} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Applications by type */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Applications by Centre Type</h2>
          {d.appsByType.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-3">
              {d.appsByType.map(r => {
                const pct = Math.round((r.total / appTotal) * 100);
                return (
                  <div key={r.type}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{TYPE_LABELS[r.type] ?? r.type}</span>
                      <span className="font-semibold text-slate-800">{r.total}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-boa-green transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Monthly Applications (Last 6 Months)</h2>
          {d.appsByMonth.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet</p>
          ) : (
            <div className="flex items-end gap-2 h-36">
              {d.appsByMonth.map(m => {
                const heightPct = Math.round((m.total / monthMax) * 100);
                const [yr, mo] = m.month.split('-');
                const label = new Date(parseInt(yr), parseInt(mo) - 1).toLocaleString('en', { month: 'short' });
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-semibold text-slate-700">{m.total}</span>
                    <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden" style={{ height: '100px' }}>
                      <div
                        className="w-full bg-boa-green rounded-t-lg transition-all"
                        style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top states */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Applications by State (Top 10)</h2>
          {d.appsByState.length === 0 ? (
            <p className="text-slate-400 text-sm">No data yet</p>
          ) : (
            <div className="space-y-2.5">
              {d.appsByState.map((r, i) => {
                const pct = Math.round((r.total / stateMax) * 100);
                return (
                  <div key={r.state} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-5 text-right shrink-0">{i + 1}</span>
                    <span className="text-sm text-slate-700 w-24 shrink-0 truncate">{r.state}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-harvest-gold transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-800 w-6 text-right shrink-0">{r.total}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Centres summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Aggregation Centres Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CentreStatCard label="Active"          value={d.centres.active}          color="text-emerald-600 bg-emerald-50" />
          <CentreStatCard label="Suspended"       value={d.centres.suspended}       color="text-amber-600 bg-amber-50" />
          <CentreStatCard label="Decommissioned"  value={d.centres.decommissioned}  color="text-slate-500 bg-slate-50" />
          <CentreStatCard label="Total Capacity"  value={`${(d.centres.totalCapacityMt ?? 0).toLocaleString()} MT`} color="text-blue-600 bg-blue-50" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, color, bg, border }: { icon: string; label: string; value: string | number; color: string; bg: string; border: string }) {
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-60 ${color}`}>{label}</p>
          <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined filled text-2xl opacity-70 ${color}`}>{icon}</span>
      </div>
    </div>
  );
}

function CentreStatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-xl p-4 ${color.split(' ')[1]}`}>
      <p className={`text-2xl font-bold ${color.split(' ')[0]}`}>{value}</p>
      <p className={`text-xs mt-1 font-medium ${color.split(' ')[0]} opacity-70`}>{label}</p>
    </div>
  );
}

