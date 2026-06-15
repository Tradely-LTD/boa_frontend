import { useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import { useGetCentreReportQuery } from '../../reports_screens/services/analyticsApiSlice';
import PrintReportHeader from '../../reports_screens/PrintReportHeader';

const fmt    = (n: number) => n.toLocaleString('en-NG');
const fmtKg  = (n: number) => `${fmt(Math.round(n))} kg`;
const fmtAmt = (n: number) =>
  n >= 1_000_000 ? `₦${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `₦${(n / 1_000).toFixed(1)}K`
  : `₦${fmt(n)}`;

export default function ManagerReportsScreen() {
  const user     = useSelector((s: RootState) => s.auth.user);
  const centreId = user?.centreId ?? null;

  const { data, isLoading, isError, refetch } =
    useGetCentreReportQuery(centreId!, { skip: centreId === null });

  const d = data?.data;
  const loanTotal = d ? (d.loans.total || 1) : 1;
  const colTotal  = d ? (d.collections.total || 1) : 1;

  if (centreId === null) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">warehouse</span>
        <p className="text-slate-500 font-medium">No centre is linked to your account.</p>
        <p className="text-slate-400 text-sm mt-1">Contact your system administrator to assign a centre.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <PrintReportHeader
        title="Centre Report"
        subtitle={`${d?.centre.centreName ?? 'FAC'} — Bank of Agriculture AgriHub — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {d ? d.centre.centreName : 'Loading your centre…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Refresh
          </button>
          {d && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>
              Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin h-6 w-6 text-boa-green mr-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-slate-400 text-sm">Loading your centre report…</p>
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-4xl text-red-300 mb-3">error</span>
          <p className="text-slate-600 font-medium">Failed to load report</p>
          <p className="text-slate-400 text-sm mt-1">Check your connection and try refreshing.</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Report Body ─────────────────────────────────────────────────────── */}
      {d && !isLoading && (
        <div className="space-y-8">

          {/* Centre Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{d.centre.centreName}</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  {d.centre.state}{d.centre.lga ? `, ${d.centre.lga}` : ''}
                </p>
              </div>
              <StatusBadge status={d.centre.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 text-sm">
              <InfoCell label="Type"           value={d.centre.centreType?.replace('_', ' ') ?? '—'} />
              <InfoCell label="Capacity"       value={d.centre.capacityMt ? `${fmt(d.centre.capacityMt)} MT` : '—'} />
              <InfoCell label="Manager"        value={d.centre.managerName ?? '—'} />
              <InfoCell label="Manager Phone"  value={d.centre.managerPhone ?? '—'} />
              <InfoCell label="Reg No."        value={d.centre.regNumber ?? '—'} />
              <InfoCell label="Owner"          value={d.centre.ownerName ?? '—'} />
              <InfoCell label="WR Capable"     value={d.centre.warehouseReceiptCapable ? 'Yes' : 'No'} />
              <InfoCell label="Established"    value={d.centre.yearEstablished ? String(d.centre.yearEstablished) : '—'} />
              <InfoCell label="Address"        value={d.centre.address ?? '—'} />
            </div>
          </div>

          {/* KPI Overview */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard icon="inventory_2"     label="Total Intakes"     value={fmt(d.intakes.total)}        color="text-teal-700"   bg="bg-teal-50"   border="border-teal-200" />
            <KpiCard icon="receipt_long"    label="WH Receipts"       value={fmt(d.receipts.total)}        color="text-indigo-700" bg="bg-indigo-50" border="border-indigo-200" />
            <KpiCard icon="account_balance" label="Loan Applications"  value={fmt(d.loans.total)}           color="text-violet-700" bg="bg-violet-50" border="border-violet-200" />
            <KpiCard icon="scale"           label="Intake Volume"     value={fmtKg(d.intakes.totalQtyKg)} color="text-amber-700"  bg="bg-amber-50"  border="border-amber-200" />
          </div>

          {/* Commodity Intakes */}
          <SectionHeading title="Commodity Intake" icon="inventory_2" />
          <div className="grid xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-5">Top Commodities (by volume)</h3>
              {d.intakes.byCommodity.length === 0 ? (
                <p className="text-slate-400 text-sm">No intake records yet</p>
              ) : (
                <div className="space-y-3">
                  {d.intakes.byCommodity.map((r, i) => {
                    const max = d.intakes.byCommodity[0].totalQtyKg || 1;
                    const pct = Math.round((r.totalQtyKg / max) * 100);
                    return (
                      <div key={r.commodity} className="flex items-center gap-3">
                        <span className="text-xs text-slate-400 w-5 text-right shrink-0">{i + 1}</span>
                        <span className="text-sm text-slate-700 w-28 shrink-0 truncate capitalize">{r.commodity}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-24 text-right shrink-0">{fmtKg(r.totalQtyKg)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-5">Monthly Intake Trend</h3>
              {d.intakes.byMonth.length === 0 ? (
                <p className="text-slate-400 text-sm">No data yet</p>
              ) : (
                <div className="flex items-end gap-2 h-36">
                  {(() => {
                    const maxKg = Math.max(...d.intakes.byMonth.map(m => m.totalQtyKg), 1);
                    return d.intakes.byMonth.map(m => {
                      const heightPct = Math.round((m.totalQtyKg / maxKg) * 100);
                      const [yr, mo] = m.month.split('-');
                      const label = new Date(parseInt(yr), parseInt(mo) - 1)
                        .toLocaleString('en', { month: 'short' });
                      return (
                        <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-semibold text-slate-700">{m.total}</span>
                          <div className="w-full bg-slate-100 rounded-t-lg" style={{ height: '100px' }}>
                            <div
                              className="w-full bg-teal-400 rounded-t-lg transition-all"
                              style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">{label}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Warehouse Receipts */}
          <SectionHeading title="Warehouse Receipts" icon="receipt_long" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard label="Total"     value={fmt(d.receipts.total)}         color="text-indigo-700 bg-indigo-50" />
              <StatCard label="Active"    value={fmt(d.receipts.active)}        color="text-emerald-600 bg-emerald-50" />
              <StatCard label="Pledged"   value={fmt(d.receipts.pledged)}       color="text-blue-600 bg-blue-50" />
              <StatCard label="Redeemed"  value={fmt(d.receipts.redeemed)}      color="text-slate-600 bg-slate-50" />
              <StatCard label="Expired"   value={fmt(d.receipts.expired)}       color="text-red-500 bg-red-50" />
              <StatCard label="Total Vol" value={fmtKg(d.receipts.totalQtyKg)} color="text-indigo-600 bg-indigo-50" />
            </div>
          </div>

          {/* Loans */}
          <SectionHeading title="WR Financing (Loans)" icon="account_balance" />
          <div className="grid xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-5">Loan Applications by Status</h3>
              {d.loans.total === 0 ? (
                <p className="text-slate-400 text-sm">No loan applications yet</p>
              ) : (
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
                          <span className="font-semibold text-slate-800">
                            {val} <span className="text-slate-400 font-normal">({pct}%)</span>
                          </span>
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-5">Loan Amounts</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Requested" value={fmtAmt(d.loans.totalAmountRequested)} color="text-violet-700 bg-violet-50" />
                <StatCard label="Total Approved"  value={fmtAmt(d.loans.totalAmountApproved)}  color="text-emerald-700 bg-emerald-50" />
                <StatCard label="Total Records"   value={fmt(d.loans.total)}                   color="text-slate-700 bg-slate-50" />
                <StatCard label="Disbursed"       value={fmt(d.loans.disbursed)}               color="text-blue-700 bg-blue-50" />
              </div>
            </div>
          </div>

          {/* Collections */}
          <SectionHeading title="Collection Requests" icon="local_shipping" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
              <StatCard label="Total"      value={fmt(d.collections.total)}      color="text-slate-700 bg-slate-50" />
              <StatCard label="Pending"    value={fmt(d.collections.pending)}    color="text-amber-600 bg-amber-50" />
              <StatCard label="Assigned"   value={fmt(d.collections.assigned)}   color="text-blue-600 bg-blue-50" />
              <StatCard label="In Transit" value={fmt(d.collections.in_transit)} color="text-indigo-600 bg-indigo-50" />
              <StatCard label="Collected"  value={fmt(d.collections.collected)}  color="text-emerald-600 bg-emerald-50" />
              <StatCard label="Cancelled"  value={fmt(d.collections.cancelled)}  color="text-red-500 bg-red-50" />
            </div>
            {d.collections.total > 0 && (
              <div className="space-y-3">
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
                        <span className="font-semibold text-slate-800">
                          {val} <span className="text-slate-400 font-normal">({pct}%)</span>
                        </span>
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

          {/* Marketplace */}
          <SectionHeading title="Commodity Marketplace" icon="storefront" />
          <div className="grid xl:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-5">Listings</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total"    value={fmt(d.marketplace.totalListings)}   color="text-rose-700 bg-rose-50" />
                <StatCard label="Active"   value={fmt(d.marketplace.activeListings)}  color="text-emerald-700 bg-emerald-50" />
                <StatCard label="Paused"   value={fmt(d.marketplace.pausedListings)}  color="text-amber-600 bg-amber-50" />
                <StatCard label="Sold Out" value={fmt(d.marketplace.soldOutListings)} color="text-slate-600 bg-slate-50" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-5">Orders & Revenue</h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Total Orders" value={fmt(d.marketplace.totalOrders)}     color="text-rose-700 bg-rose-50" />
                <StatCard label="Completed"    value={fmt(d.marketplace.completedOrders)} color="text-emerald-700 bg-emerald-50" />
                <StatCard label="Paid"         value={fmt(d.marketplace.paidOrders)}      color="text-blue-700 bg-blue-50" />
                <StatCard label="Revenue"      value={fmtAmt(d.marketplace.totalRevenue)} color="text-amber-700 bg-amber-50" />
              </div>
            </div>
          </div>

          {/* Revenue Summary */}
          <SectionHeading title="Revenue Summary" icon="payments" />
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Marketplace Revenue" value={fmtAmt(d.marketplace.totalRevenue)} color="text-rose-700 bg-rose-50" />
              <StatCard label="Inventory Sales"     value={fmtAmt(d.revenue.inventorySales)}   color="text-emerald-700 bg-emerald-50" />
              <StatCard label="Farm Input Sales"    value={fmtAmt(d.revenue.farmInputSales)}   color="text-amber-700 bg-amber-50" />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Combined Centre Revenue</span>
              <span className="text-xl font-bold text-boa-green">
                {fmtAmt(d.marketplace.totalRevenue + d.revenue.inventorySales + d.revenue.farmInputSales)}
              </span>
            </div>
          </div>

        </div>
      )}
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

function KpiCard({ icon, label, value, color, bg, border }: {
  icon: string; label: string; value: string | number;
  color: string; bg: string; border: string;
}) {
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

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const [textColor, bgColor] = color.split(' ');
  return (
    <div className={`rounded-xl p-4 ${bgColor}`}>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
      <p className={`text-xs mt-1 font-medium ${textColor} opacity-70`}>{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active:         'bg-emerald-100 text-emerald-700',
    suspended:      'bg-amber-100 text-amber-700',
    decommissioned: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm text-slate-700 font-semibold mt-0.5 capitalize">{value}</p>
    </div>
  );
}
