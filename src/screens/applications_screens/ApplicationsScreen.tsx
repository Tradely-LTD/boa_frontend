import { useState, useEffect } from 'react';
import { useGetApplicationsQuery, useUpdateStatusMutation, type Application } from './services/applicationsApiSlice';
import { useExport } from '../../hooks/useExport';
import Pagination from '../../components/Pagination/Pagination';

function printApplicationForm(app: Application) {
  const bool = (v: boolean | null) => v == null ? '—' : v ? 'Yes' : 'No';
  const val  = (v: string | number | null | undefined): string => v == null ? '—' : String(v);
  const commodities = app.commodities ? JSON.parse(app.commodities).join(', ') : '—';
  const facilities  = app.facilities  ? JSON.parse(app.facilities).join(', ')  : '—';
  const statusLabel: Record<string, string> = { pending: 'Pending', under_review: 'Under Review', approved: 'Approved', rejected: 'Rejected' };

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>BOA Application Form — ${app.refId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 8pt; color: #1a1a1a; background: #fff; padding: 20px; }
    .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #166534; padding-bottom: 10px; margin-bottom: 12px; }
    .header-left h1 { font-size: 11pt; font-weight: bold; color: #166534; }
    .header-left p  { font-size: 7.5pt; color: #555; margin-top: 1px; }
    .ref-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 6px 12px; text-align: right; }
    .ref-box .ref { font-size: 10pt; font-weight: bold; font-family: monospace; color: #166534; }
    .ref-box .date { font-size: 7pt; color: #555; margin-top: 1px; }
    .status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 7.5pt; font-weight: bold; margin-top: 4px;
      background: ${app.status === 'approved' ? '#dcfce7' : app.status === 'rejected' ? '#fee2e2' : '#fef9c3'};
      color: ${app.status === 'approved' ? '#166534' : app.status === 'rejected' ? '#991b1b' : '#854d0e'}; }
    .section { margin-bottom: 10px; }
    .section-title { font-size: 7.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.07em;
      color: #fff; background: #166534; padding: 4px 8px; border-radius: 3px; margin-bottom: 5px;
      -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; border: 1px solid #e5e7eb; border-radius: 4px; overflow: hidden; }
    .grid.cols3 { grid-template-columns: 1fr 1fr 1fr; }
    .cell { padding: 4px 8px; border-bottom: 1px solid #f3f4f6; }
    .cell:nth-child(odd) { border-right: 1px solid #f3f4f6; background: #fafafa; }
    .cell .label { font-size: 6.5pt; color: #6b7280; margin-bottom: 1px; }
    .cell .value { font-size: 8pt; font-weight: 600; color: #111827; }
    .cell.full { grid-column: 1 / -1; background: #fff; }
    .cell.full:nth-child(odd) { background: #fff; border-right: none; }
    .footer { margin-top: 16px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 7pt; color: #9ca3af; text-align: center; }
    .sig-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-top: 20px; }
    .sig-box { border-top: 1px solid #374151; padding-top: 4px; font-size: 7pt; color: #374151; }
    @media print {
      body { padding: 0; }
      @page { margin: 1cm; size: A4; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Bank of Agriculture — AgriHub</h1>
      <p>Aggregation Centre Registration Application Form</p>
      <span class="status-badge">${statusLabel[app.status] ?? app.status}</span>
    </div>
    <div class="ref-box">
      <div class="label" style="font-size:8pt;color:#555">Application Reference</div>
      <div class="ref">${app.refId}</div>
      <div class="date">Submitted: ${new Date(app.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Section A — Centre Identity</div>
    <div class="grid">
      <div class="cell"><div class="label">Centre Name</div><div class="value">${val(app.centreName)}</div></div>
      <div class="cell"><div class="label">Centre Type</div><div class="value">${val(app.centreType).replace('_', ' ')}</div></div>
      <div class="cell"><div class="label">CAC Registration No.</div><div class="value">${val(app.regNumber)}</div></div>
      <div class="cell"><div class="label">Tax Identification No. (TIN)</div><div class="value">${val(app.tinNumber)}</div></div>
      <div class="cell"><div class="label">Year Established</div><div class="value">${val(app.yearEstablished)}</div></div>
      <div class="cell"><div class="label">Commodities Handled</div><div class="value">${commodities}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Section B — Ownership</div>
    <div class="grid">
      <div class="cell"><div class="label">Owner / Proprietor Name</div><div class="value">${val(app.ownerName)}</div></div>
      <div class="cell"><div class="label">Owner Phone</div><div class="value">${val(app.ownerPhone)}</div></div>
      <div class="cell full"><div class="label">Owner NIN</div><div class="value">${val(app.ownerNin)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Section C — Infrastructure</div>
    <div class="grid cols3">
      <div class="cell"><div class="label">Warehouse Type</div><div class="value">${val(app.warehouseType)?.replace('_',' ')}</div></div>
      <div class="cell"><div class="label">Storage Capacity</div><div class="value">${app.capacityMt ? app.capacityMt + ' MT' : '—'}</div></div>
      <div class="cell"><div class="label">Cold Storage Capacity</div><div class="value">${app.coldStorageCapacityMt ? app.coldStorageCapacityMt + ' MT' : '—'}</div></div>
      <div class="cell"><div class="label">Number of Bays</div><div class="value">${val(app.numBays)}</div></div>
      <div class="cell"><div class="label">Floor Area</div><div class="value">${app.floorAreaSqm ? app.floorAreaSqm + ' sqm' : '—'}</div></div>
      <div class="cell"><div class="label">Facilities</div><div class="value">${facilities}</div></div>
      <div class="cell"><div class="label">Power Source</div><div class="value">${val(app.powerSource)}</div></div>
      <div class="cell"><div class="label">Water Source</div><div class="value">${val(app.waterSource)}</div></div>
      <div class="cell"><div class="label">Access Road</div><div class="value">${bool(app.hasAccessRoad)}</div></div>
      <div class="cell full"><div class="label">AgriHub Receipt Capable</div><div class="value">${bool(app.warehouseReceiptCapable)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Section D — Location</div>
    <div class="grid">
      <div class="cell"><div class="label">State</div><div class="value">${val(app.state)}</div></div>
      <div class="cell"><div class="label">LGA</div><div class="value">${val(app.lga)}</div></div>
      <div class="cell full"><div class="label">Full Address</div><div class="value">${val(app.address)}</div></div>
      <div class="cell"><div class="label">GPS Latitude</div><div class="value">${val(app.gpsLat)}</div></div>
      <div class="cell"><div class="label">GPS Longitude</div><div class="value">${val(app.gpsLng)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Section E — Centre Manager</div>
    <div class="grid">
      <div class="cell"><div class="label">Manager Name</div><div class="value">${val(app.managerName)}</div></div>
      <div class="cell"><div class="label">Phone</div><div class="value">${val(app.managerPhone)}</div></div>
      <div class="cell"><div class="label">Email</div><div class="value">${val(app.managerEmail)}</div></div>
      <div class="cell"><div class="label">NIN</div><div class="value">${val(app.managerNin)}</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Section F — Banking Details</div>
    <div class="grid">
      <div class="cell"><div class="label">Bank Name</div><div class="value">${val(app.bankName)}</div></div>
      <div class="cell"><div class="label">Account Number</div><div class="value">${val(app.accountNumber)}</div></div>
      <div class="cell full"><div class="label">BVN</div><div class="value">${val(app.bvn)}</div></div>
    </div>
  </div>

  ${app.reviewNotes ? `
  <div class="section">
    <div class="section-title">BOA Review Notes</div>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;font-size:10pt;color:#374151;">${app.reviewNotes}</div>
  </div>` : ''}

  <div class="sig-row">
    <div class="sig-box">Applicant Signature &amp; Date</div>
    <div class="sig-box">Centre Manager Signature &amp; Date</div>
    <div class="sig-box">BOA Officer Signature &amp; Stamp</div>
  </div>

  <div class="footer">
    Bank of Agriculture — AgriHub Platform &nbsp;|&nbsp; Printed: ${new Date().toLocaleString('en-NG')} &nbsp;|&nbsp; ${app.refId}
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}

const STATUS_OPTIONS = ['', 'pending', 'under_review', 'approved', 'rejected'];

const statusStyle: Record<string, string> = {
  pending:      'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved:     'bg-emerald-100 text-emerald-700',
  rejected:     'bg-red-100 text-red-700',
};

export default function ApplicationsScreen() {
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected]         = useState<Application | null>(null);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useGetApplicationsQuery({ status: statusFilter || undefined, search: search || undefined, page, limit });
  const [updateStatus, { isLoading: updating }] = useUpdateStatusMutation();
  const [reviewNotes, setReviewNotes]   = useState('');
  const [newStatus,   setNewStatus]     = useState('');
  const { downloadCsv, openPdf } = useExport();

  const openDetail = (app: Application) => {
    setSelected(app);
    setNewStatus(app.status);
    setReviewNotes(app.reviewNotes ?? '');
  };

  const handleSave = async () => {
    if (!selected) return;
    await updateStatus({ id: selected.id, status: newStatus, reviewNotes });
    setSelected(null);
  };

  const bool = (v: boolean | null) => v == null ? null : v ? 'Yes' : 'No';

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and manage centre registration applications</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">search</span>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name or ref ID…"
              className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
            ))}
          </select>
          <button
            onClick={() => downloadCsv('applications', 'boa-applications.csv')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-base">download</span>
            Export CSV
          </button>
          <button
            onClick={() => openPdf('applications')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading || isFetching ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : !data?.data.length ? (
          <div className="py-20 text-center text-slate-400 text-sm">No applications found</div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[540px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Centre Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">State / LGA</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.data.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{app.refId}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-800">{app.centreName}</td>
                  <td className="px-5 py-3.5 text-slate-600 text-xs">
                    <span className="font-medium">{app.state ?? '—'}</span>
                    {app.lga && <span className="text-slate-400"> / {app.lga}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 capitalize">{app.centreType.replace('_', ' ')}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[app.status]}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{app.createdAt.slice(0, 10)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => openDetail(app)} className="text-boa-green text-xs font-medium hover:underline">
                      Review
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

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">{selected.centreName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.refId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 mt-0.5 shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              <Section label="Identity">
                <Field label="Centre Type"    value={selected.centreType.replace('_', ' ')} />
                <Field label="CAC Reg No."    value={selected.regNumber} />
                <Field label="TIN"            value={selected.tinNumber} />
                <Field label="Year Est."      value={selected.yearEstablished} />
              </Section>

              <Section label="Ownership">
                <Field label="Owner Name"     value={selected.ownerName} />
                <Field label="Owner Phone"    value={selected.ownerPhone} />
                <Field label="Owner NIN"      value={selected.ownerNin} />
              </Section>

              <Section label="Infrastructure">
                <Field label="Warehouse Type"         value={selected.warehouseType?.replace('_', ' ')} />
                <Field label="Storage Capacity"       value={selected.capacityMt ? `${selected.capacityMt} MT` : null} />
                <Field label="Cold Storage Capacity"  value={selected.coldStorageCapacityMt ? `${selected.coldStorageCapacityMt} MT` : null} />
                <Field label="No. of Bays"            value={selected.numBays} />
                <Field label="Floor Area"             value={selected.floorAreaSqm ? `${selected.floorAreaSqm} sqm` : null} />
                <Field label="Power Source"           value={selected.powerSource} />
                <Field label="Water Source"           value={selected.waterSource} />
                <Field label="Access Road"            value={bool(selected.hasAccessRoad)} />
                <Field label="AgriHub Receipt"        value={bool(selected.warehouseReceiptCapable)} />
                <Field label="Commodities"            value={selected.commodities ? JSON.parse(selected.commodities).join(', ') : null} />
                <Field label="Facilities"             value={selected.facilities ? JSON.parse(selected.facilities).join(', ') : null} />
              </Section>

              <Section label="Location">
                <Field label="Address"  value={selected.address} />
                <Field label="State"    value={selected.state} />
                <Field label="LGA"      value={selected.lga} />
                <Field label="GPS"      value={selected.gpsLat && selected.gpsLng ? `${selected.gpsLat}, ${selected.gpsLng}` : null} />
              </Section>

              <Section label="Manager">
                <Field label="Name"   value={selected.managerName} />
                <Field label="Phone"  value={selected.managerPhone} />
                <Field label="Email"  value={selected.managerEmail} />
                <Field label="NIN"    value={selected.managerNin} />
              </Section>

              <Section label="Banking">
                <Field label="Bank Name"       value={selected.bankName} />
                <Field label="Account Number"  value={selected.accountNumber} />
                <Field label="BVN"             value={selected.bvn} />
              </Section>

              <Section label="Review Decision">
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add review notes…"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  />
                </div>
              </Section>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white space-y-2">
              <button
                onClick={() => printApplicationForm(selected)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
              >
                <span className="material-symbols-outlined text-base">print</span>
                Print / Export Application Form
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={updating}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {updating ? 'Saving…' : 'Save Decision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className="text-slate-800 font-medium text-right">{String(value)}</span>
    </div>
  );
}
