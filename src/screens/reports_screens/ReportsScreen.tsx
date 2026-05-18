import { useNavigate } from 'react-router-dom';
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

const fmt = (n: number) => n.toLocaleString('en-NG');
const fmtAmt = (n: number) =>
  n >= 1_000_000
    ? `₦${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
    ? `₦${(n / 1_000).toFixed(1)}K`
    : `₦${fmt(n)}`;

export default function ReportsScreen() {
  const navigate = useNavigate();
  const { openPdf } = useExport();
  const { data, isLoading, isError } = useGetAnalyticsQuery();
  const d = data?.data;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-96">
        <div className="text-slate-400 text-sm">Loading analytics…</div>
      </div>
    );
  }

  if (isError || !d) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-96">
        <div className="text-center space-y-2">
          <span className="material-symbols-outlined text-4xl text-slate-300">bar_chart</span>
          <p className="text-slate-500 text-sm font-medium">Failed to load analytics</p>
          <p className="text-slate-400 text-xs">Please refresh the page or try again later.</p>
        </div>
      </div>
    );
  }

  const appTotal  = d.applications.total || 1;
  const monthMax  = Math.max(...d.appsByMonth.map(m => m.total), 1);
  const stateMax  = Math.max(...d.appsByState.map(s => s.total), 1);
  const loanTotal = d.loans.total || 1;
  const colTotal  = d.collections.total || 1;

  return (
    <div className="p-4 md:p-8 space-y-8">
      <PrintReportHeader title="Reports & Analytics" subtitle={`Bank of Agriculture AgriHub — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`} />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform-wide overview across all modules</p>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <button
            onClick={() => navigate('/reports/centre')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-boa-green bg-white text-boa-green text-sm font-semibold hover:bg-emerald-50 transition"
          >
            <span className="material-symbols-outlined text-base">warehouse</span>
            Report by FAC
          </button>
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

      {/* ── Top KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon="assignment"   label="Total Applications" value={fmt(d.applications.total)} color="text-slate-700"   bg="bg-slate-50"    border="border-slate-200" />
        <KpiCard icon="warehouse"    label="Active Centres"     value={fmt(d.centres.active)}      color="text-emerald-700" bg="bg-emerald-50"  border="border-emerald-200" />
        <KpiCard icon="check_circle" label="Approval Rate"      value={`${appTotal > 1 ? Math.round((d.applications.approved / appTotal) * 100) : 0}%`} color="text-blue-700" bg="bg-blue-50" border="border-blue-200" />
        <KpiCard icon="scale"        label="Total Capacity"     value={`${fmt(d.centres.totalCapacityMt ?? 0)} MT`} color="text-amber-700" bg="bg-amber-50" border="border-amber-200" />
      </div>

      {/* ── Second row KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon="inventory_2"   label="Total Intakes"       value={fmt(d.intakes.total)}          color="text-teal-700"    bg="bg-teal-50"    border="border-teal-200" />
        <KpiCard icon="receipt_long"  label="Warehouse Receipts"  value={fmt(d.receipts.total)}          color="text-indigo-700"  bg="bg-indigo-50"  border="border-indigo-200" />
        <KpiCard icon="account_balance" label="Loan Applications" value={fmt(d.loans.total)}             color="text-violet-700"  bg="bg-violet-50"  border="border-violet-200" />
        <KpiCard icon="storefront"    label="Marketplace Orders"  value={fmt(d.marketplace.totalOrders)} color="text-rose-700"    bg="bg-rose-50"    border="border-rose-200" />
      </div>

      {/* ── Applications ────────────────────────────────────────────────────── */}
      <SectionHeading title="Applications" icon="assignment" />
      <div className="grid xl:grid-cols-2 gap-6">
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

      {/* ── Aggregation Centres ──────────────────────────────────────────────── */}
      <SectionHeading title="Aggregation Centres" icon="warehouse" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-5">Centres Summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CentreStatCard label="Active"          value={fmt(d.centres.active)}          color="text-emerald-600 bg-emerald-50" />
          <CentreStatCard label="Suspended"       value={fmt(d.centres.suspended)}       color="text-amber-600 bg-amber-50" />
          <CentreStatCard label="Decommissioned"  value={fmt(d.centres.decommissioned)}  color="text-slate-500 bg-slate-50" />
          <CentreStatCard label="Total Capacity"  value={`${fmt(d.centres.totalCapacityMt ?? 0)} MT`} color="text-blue-600 bg-blue-50" />
        </div>
      </div>

      {/* ── Commodity Intake ─────────────────────────────────────────────────── */}
      <SectionHeading title="Commodity Intake" icon="inventory_2" />
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-1">Intake Overview</h2>
          <p className="text-slate-400 text-xs mb-5">Total commodities received across all centres</p>
          <div className="grid grid-cols-2 gap-4">
            <CentreStatCard label="Total Records"   value={fmt(d.intakes.total)}              color="text-teal-600 bg-teal-50" />
            <CentreStatCard label="Total Quantity"  value={`${fmt(Math.round(d.intakes.totalQtyKg))} kg`} color="text-teal-700 bg-teal-50" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Top Commodities Received</h2>
          {d.intakes.byCommodity.length === 0 ? (
            <p className="text-slate-400 text-sm">No intake records yet</p>
          ) : (
            <div className="space-y-2.5">
              {d.intakes.byCommodity.map((r, i) => {
                const max = d.intakes.byCommodity[0].totalQtyKg || 1;
                const pct = Math.round((r.totalQtyKg / max) * 100);
                return (
                  <div key={r.commodity} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-5 text-right shrink-0">{i + 1}</span>
                    <span className="text-sm text-slate-700 w-24 shrink-0 truncate capitalize">{r.commodity}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-20 text-right shrink-0">{fmt(Math.round(r.totalQtyKg))} kg</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Warehouse Receipts ───────────────────────────────────────────────── */}
      <SectionHeading title="Warehouse Receipts" icon="receipt_long" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <CentreStatCard label="Total"      value={fmt(d.receipts.total)}                            color="text-indigo-700 bg-indigo-50" />
          <CentreStatCard label="Active"     value={fmt(d.receipts.active)}                           color="text-emerald-600 bg-emerald-50" />
          <CentreStatCard label="Pledged"    value={fmt(d.receipts.pledged)}                          color="text-blue-600 bg-blue-50" />
          <CentreStatCard label="Redeemed"   value={fmt(d.receipts.redeemed)}                         color="text-slate-600 bg-slate-50" />
          <CentreStatCard label="Expired"    value={fmt(d.receipts.expired)}                          color="text-red-500 bg-red-50" />
          <CentreStatCard label="Total Qty"  value={`${fmt(Math.round(d.receipts.totalQtyKg))} kg`}  color="text-indigo-600 bg-indigo-50" />
        </div>
      </div>

      {/* ── WR Financing (Loans) ─────────────────────────────────────────────── */}
      <SectionHeading title="WR Financing (Loans)" icon="account_balance" />
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Loan Applications by Status</h2>
          <div className="space-y-3">
            {(
              [
                ['pending',   'Pending',   'bg-amber-400'],
                ['approved',  'Approved',  'bg-blue-400'],
                ['disbursed', 'Disbursed', 'bg-emerald-500'],
                ['repaid',    'Repaid',    'bg-slate-400'],
                ['defaulted', 'Defaulted', 'bg-red-500'],
                ['rejected',  'Rejected',  'bg-red-400'],
              ] as [keyof typeof d.loans, string, string][]
            ).map(([key, label, color]) => {
              const val = d.loans[key] as number;
              const pct = Math.round((val / loanTotal) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-800">{val} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Loan Amounts</h2>
          <div className="grid grid-cols-2 gap-4">
            <CentreStatCard label="Total Requested" value={fmtAmt(d.loans.totalAmountRequested)} color="text-violet-700 bg-violet-50" />
            <CentreStatCard label="Total Approved"  value={fmtAmt(d.loans.totalAmountApproved)}  color="text-emerald-700 bg-emerald-50" />
            <CentreStatCard label="Total Records"   value={fmt(d.loans.total)}                   color="text-slate-700 bg-slate-50" />
            <CentreStatCard label="Active (Disbursed)" value={fmt(d.loans.disbursed)}            color="text-blue-700 bg-blue-50" />
          </div>
        </div>
      </div>

      {/* ── Collection Requests ──────────────────────────────────────────────── */}
      <SectionHeading title="Collection Requests" icon="local_shipping" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <CentreStatCard label="Total"      value={fmt(d.collections.total)}      color="text-slate-700 bg-slate-50" />
          <CentreStatCard label="Pending"    value={fmt(d.collections.pending)}    color="text-amber-600 bg-amber-50" />
          <CentreStatCard label="Assigned"   value={fmt(d.collections.assigned)}   color="text-blue-600 bg-blue-50" />
          <CentreStatCard label="In Transit" value={fmt(d.collections.in_transit)} color="text-indigo-600 bg-indigo-50" />
          <CentreStatCard label="Collected"  value={fmt(d.collections.collected)}  color="text-emerald-600 bg-emerald-50" />
          <CentreStatCard label="Cancelled"  value={fmt(d.collections.cancelled)}  color="text-red-500 bg-red-50" />
        </div>

        {d.collections.total > 0 && (
          <div className="mt-6 space-y-3">
            {(
              [
                ['pending',    'Pending',    'bg-amber-400'],
                ['assigned',   'Assigned',   'bg-blue-400'],
                ['in_transit', 'In Transit', 'bg-indigo-500'],
                ['collected',  'Collected',  'bg-emerald-500'],
                ['cancelled',  'Cancelled',  'bg-red-400'],
              ] as [keyof typeof d.collections, string, string][]
            ).map(([key, label, color]) => {
              const val = d.collections[key] as number;
              const pct = Math.round((val / colTotal) * 100);
              return (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">{label}</span>
                    <span className="font-semibold text-slate-800">{val} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Marketplace ──────────────────────────────────────────────────────── */}
      <SectionHeading title="Commodity Marketplace" icon="storefront" />
      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Listings</h2>
          <div className="grid grid-cols-2 gap-4">
            <CentreStatCard label="Total Listings"   value={fmt(d.marketplace.totalListings)}   color="text-rose-700 bg-rose-50" />
            <CentreStatCard label="Active"           value={fmt(d.marketplace.activeListings)}  color="text-emerald-700 bg-emerald-50" />
            <CentreStatCard label="Paused"           value={fmt(d.marketplace.pausedListings)}  color="text-amber-600 bg-amber-50" />
            <CentreStatCard label="Sold Out"         value={fmt(d.marketplace.soldOutListings)} color="text-slate-600 bg-slate-50" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-800 mb-5">Orders & Revenue</h2>
          <div className="grid grid-cols-2 gap-4">
            <CentreStatCard label="Total Orders"     value={fmt(d.marketplace.totalOrders)}     color="text-rose-700 bg-rose-50" />
            <CentreStatCard label="Completed"        value={fmt(d.marketplace.completedOrders)} color="text-emerald-700 bg-emerald-50" />
            <CentreStatCard label="Paid"             value={fmt(d.marketplace.paidOrders)}      color="text-blue-700 bg-blue-50" />
            <CentreStatCard label="Total Revenue"    value={fmtAmt(d.marketplace.totalRevenue)} color="text-amber-700 bg-amber-50" />
          </div>
        </div>
      </div>

      {/* ── Revenue Summary ──────────────────────────────────────────────────── */}
      <SectionHeading title="Revenue Summary" icon="payments" />
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CentreStatCard label="Marketplace Revenue"    value={fmtAmt(d.marketplace.totalRevenue)}   color="text-rose-700 bg-rose-50" />
          <CentreStatCard label="Inventory Sales"        value={fmtAmt(d.revenue.inventorySales)}     color="text-emerald-700 bg-emerald-50" />
          <CentreStatCard label="Farm Input Sales"       value={fmtAmt(d.revenue.farmInputSales)}     color="text-amber-700 bg-amber-50" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Combined Platform Revenue</span>
            <span className="text-xl font-bold text-boa-green">
              {fmtAmt(d.marketplace.totalRevenue + d.revenue.inventorySales + d.revenue.farmInputSales)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
      <span className="material-symbols-outlined text-xl text-boa-green">{icon}</span>
      <h2 className="text-base font-bold text-slate-700">{title}</h2>
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
  const [textColor, bgColor] = color.split(' ');
  return (
    <div className={`rounded-xl p-4 ${bgColor}`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-xs mt-1 font-medium ${textColor} opacity-70`}>{label}</p>
    </div>
  );
}
