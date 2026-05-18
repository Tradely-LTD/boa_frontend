import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../../store/store';
import {
  useGetCollectionRequestsQuery, useGetCollectorsQuery,
  useAssignCollectorMutation, useMarkInTransitMutation,
  useMarkCollectedMutation, useCancelRequestMutation,
  type CollectionRequest,
} from './services/collectionRequestsApiSlice';
import Pagination from '../../../components/Pagination/Pagination';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  assigned:   'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  collected:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-slate-100 text-slate-500',
};

export default function CollectionRequestsScreen() {
  const user     = useSelector((s: RootState) => s.auth.user);
  const navigate = useNavigate();
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useGetCollectionRequestsQuery({ page, limit, status: statusFilter || undefined });
  const { data: collectorsData } = useGetCollectorsQuery();
  const [assignCollector, { isLoading: assigning }] = useAssignCollectorMutation();
  const [markInTransit,   { isLoading: dispatching }] = useMarkInTransitMutation();
  const [markCollected,   { isLoading: collecting }]  = useMarkCollectedMutation();
  const [cancelRequest,   { isLoading: cancelling }]  = useCancelRequestMutation();

  const [selected, setSelected]         = useState<CollectionRequest | null>(null);
  const [showAssign, setShowAssign]      = useState(false);
  const [showCollect, setShowCollect]    = useState(false);
  const [actionError, setActionError]   = useState('');

  const [assignForm, setAssignForm]  = useState({ collectorId: '' });
  const [collectForm, setCollectForm] = useState({ actualQuantityKg: '', collectionNotes: '' });

  const requests = data?.data ?? [];
  const collectors = collectorsData?.data ?? [];

  const pending    = requests.filter(r => r.status === 'pending').length;
  const assigned   = requests.filter(r => r.status === 'assigned').length;
  const inTransit  = requests.filter(r => r.status === 'in_transit').length;
  const today = new Date().toISOString().slice(0, 10);
  const collectedToday = requests.filter(r => r.status === 'collected' && r.collectedAt?.slice(0, 10) === today).length;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionError('');
    try {
      await assignCollector({
        id: selected.id,
        collectorId: parseInt(assignForm.collectorId),
        centreId:   user?.centreId ?? undefined,
        centreName: undefined,
      }).unwrap();
      setShowAssign(false);
      setSelected(null);
      setAssignForm({ collectorId: '' });
    } catch (err: any) {
      setActionError(err?.data?.message ?? 'Failed to assign collector.');
    }
  };

  const handleMarkInTransit = async (req: CollectionRequest) => {
    setActionError('');
    try {
      await markInTransit(req.id).unwrap();
    } catch (err: any) {
      setActionError(err?.data?.message ?? 'Failed to update status.');
    }
  };

  const handleMarkCollected = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setActionError('');
    try {
      await markCollected({
        id: selected.id,
        actualQuantityKg: collectForm.actualQuantityKg ? parseFloat(collectForm.actualQuantityKg) : undefined,
        collectionNotes:  collectForm.collectionNotes || undefined,
      }).unwrap();
      setShowCollect(false);
      setSelected(null);
      setCollectForm({ actualQuantityKg: '', collectionNotes: '' });
    } catch (err: any) {
      setActionError(err?.data?.message ?? 'Failed to confirm collection.');
    }
  };

  const handleCancel = async (req: CollectionRequest) => {
    if (!confirm('Cancel this collection request?')) return;
    setActionError('');
    try {
      await cancelRequest(req.id).unwrap();
    } catch (err: any) {
      setActionError(err?.data?.message ?? 'Failed to cancel.');
    }
  };

  const handleLogIntake = (req: CollectionRequest) => {
    navigate('/manager/intake', {
      state: {
        prefillFromCollection: {
          commodity:    req.commodity,
          quantityKg:   req.actualQuantityKg ?? req.estimatedQuantityKg,
          farmerName:   req.farmerName,
          farmerPhone:  req.farmerPhone,
          farmerNin:    req.farmerNin,
          sourceState:  req.state,
          sourceLga:    req.lga,
          collectionRef: req.refId,
        },
      },
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Collection Requests</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage harvest collection requests from farmers</p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending"         value={pending}       icon="pending"           color="bg-amber-50 text-amber-700 border-amber-200" />
        <StatCard label="Assigned"        value={assigned}      icon="assignment_ind"    color="bg-blue-50 text-blue-700 border-blue-200" />
        <StatCard label="In Transit"      value={inTransit}     icon="local_shipping"    color="bg-purple-50 text-purple-700 border-purple-200" />
        <StatCard label="Collected Today" value={collectedToday} icon="check_circle"     color="bg-emerald-50 text-emerald-700 border-emerald-200" />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'assigned', 'in_transit', 'collected', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {actionError && <p className="text-sm text-red-500 mb-4">{actionError}</p>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">local_shipping</span>
            <p className="text-slate-400 text-sm mt-2">No collection requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Farmer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Qty</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Collector</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{req.refId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {req.farmerName}
                      <span className="block text-xs text-slate-400">{req.farmerPhone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{req.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.estimatedQuantityKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5">
                      <VehicleBadge type={req.collectionType} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{req.collectorName ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{req.createdAt.slice(0, 10)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setSelected(req)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                        {req.status === 'pending' && (
                          <button onClick={() => { setSelected(req); setShowAssign(true); setActionError(''); }}
                            className="text-blue-600 text-xs font-medium hover:underline">Assign</button>
                        )}
                        {req.status === 'assigned' && (
                          <button onClick={() => handleMarkInTransit(req)} disabled={dispatching}
                            className="text-purple-600 text-xs font-medium hover:underline disabled:opacity-50">Dispatch</button>
                        )}
                        {req.status === 'in_transit' && (
                          <button onClick={() => { setSelected(req); setShowCollect(true); setActionError(''); }}
                            className="text-emerald-600 text-xs font-medium hover:underline">Confirm</button>
                        )}
                        {['pending', 'assigned'].includes(req.status) && (
                          <button onClick={() => handleCancel(req)} disabled={cancelling}
                            className="text-red-500 text-xs font-medium hover:underline disabled:opacity-50">Cancel</button>
                        )}
                        {req.status === 'collected' && (
                          <button onClick={() => handleLogIntake(req)}
                            className="text-boa-green text-xs font-semibold hover:underline">Log Intake</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && data.totalPages > 0 && (
          <Pagination page={page} totalPages={data.totalPages} total={data.total} limit={limit}
            onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
        )}
      </div>

      {/* Assign Collector Modal */}
      {showAssign && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAssign(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Assign Collector</h2>
              <button onClick={() => setShowAssign(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAssign} className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
                <p className="font-medium text-slate-800">{selected.farmerName} — {selected.commodity}</p>
                <p className="text-slate-500 text-xs mt-0.5">{selected.address}, {selected.state} · {selected.preferredDate}</p>
              </div>
              <div>
                <label className="label">Select Collector <span className="text-red-400">*</span></label>
                <select value={assignForm.collectorId} onChange={e => setAssignForm({ collectorId: e.target.value })} required className="input">
                  <option value="">Select collector…</option>
                  {collectors.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {collectors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No collectors registered yet. Ask an admin to add collector accounts.</p>
                )}
              </div>
              {actionError && <p className="text-sm text-red-500">{actionError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAssign(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={assigning}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {assigning ? 'Assigning…' : 'Assign Collector'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Collected Modal */}
      {showCollect && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCollect(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Confirm Collection</h2>
              <button onClick={() => setShowCollect(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleMarkCollected} className="px-6 py-5 space-y-4">
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm">
                <p className="font-medium text-slate-800">{selected.farmerName} — {selected.commodity}</p>
                <p className="text-slate-500 text-xs mt-0.5">Estimated: {selected.estimatedQuantityKg.toLocaleString()} kg · Collector: {selected.collectorName}</p>
              </div>
              <div>
                <label className="label">Actual Quantity Collected (kg)</label>
                <input type="number" min="0.01" step="0.01" value={collectForm.actualQuantityKg}
                  onChange={e => setCollectForm(f => ({ ...f, actualQuantityKg: e.target.value }))}
                  className="input" placeholder={`Estimated: ${selected.estimatedQuantityKg} kg`} />
              </div>
              <div>
                <label className="label">Collection Notes</label>
                <textarea rows={2} value={collectForm.collectionNotes}
                  onChange={e => setCollectForm(f => ({ ...f, collectionNotes: e.target.value }))}
                  className="input resize-none" placeholder="Any notes from the collector…" />
              </div>
              {actionError && <p className="text-sm text-red-500">{actionError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCollect(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={collecting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {collecting ? 'Confirming…' : 'Confirm Collected'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && !showAssign && !showCollect && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">{selected.farmerName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.refId}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selected.status} />
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              <Section label="Farmer">
                <Field label="Name"  value={selected.farmerName} />
                <Field label="Phone" value={selected.farmerPhone} />
                <Field label="NIN"   value={selected.farmerNin} />
              </Section>
              <Section label="Location">
                <Field label="Address" value={selected.address} />
                <Field label="State"   value={selected.state} />
                <Field label="LGA"     value={selected.lga} />
                {selected.gpsLat && selected.gpsLng && (
                  <div className="flex justify-between items-center gap-4 text-sm pt-0.5">
                    <span className="text-slate-500 shrink-0">GPS</span>
                    <span className="text-slate-800 font-medium text-right font-mono text-xs">
                      {parseFloat(selected.gpsLat).toFixed(5)}, {parseFloat(selected.gpsLng).toFixed(5)}
                    </span>
                  </div>
                )}
                {selected.gpsLat && selected.gpsLng && (
                  <a
                    href={`https://www.google.com/maps?q=${selected.gpsLat},${selected.gpsLng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">
                    <span className="material-symbols-outlined text-sm">map</span>
                    Open in Google Maps
                  </a>
                )}
              </Section>
              <Section label="Collection Details">
                <Field label="Commodity"         value={selected.commodity} />
                <Field label="Est. Quantity"      value={`${selected.estimatedQuantityKg.toLocaleString()} kg`} />
                <Field label="Vehicle"            value={selected.collectionType} />
                <Field label="Preferred Date"     value={selected.preferredDate} />
                <Field label="Preferred Time"     value={selected.preferredTime} />
                {selected.actualQuantityKg && (
                  <Field label="Actual Quantity" value={`${selected.actualQuantityKg.toLocaleString()} kg`} />
                )}
              </Section>
              {selected.collectorName && (
                <Section label="Collector">
                  <Field label="Collector"    value={selected.collectorName} />
                  <Field label="Assigned At"  value={selected.assignedAt?.slice(0, 16).replace('T', ' ')} />
                  <Field label="In Transit"   value={selected.inTransitAt?.slice(0, 16).replace('T', ' ')} />
                  <Field label="Collected At" value={selected.collectedAt?.slice(0, 16).replace('T', ' ')} />
                </Section>
              )}
              {selected.collectionNotes && (
                <Section label="Collection Notes">
                  <p className="text-slate-700">{selected.collectionNotes}</p>
                </Section>
              )}
              {selected.notes && (
                <Section label="Farmer Notes">
                  <p className="text-slate-700">{selected.notes}</p>
                </Section>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white space-y-2">
              {selected.status === 'collected' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-1">
                  <p className="text-xs font-semibold text-emerald-800 mb-0.5">Ready to log intake?</p>
                  <p className="text-xs text-emerald-600 mb-2">
                    This commodity has been collected and is awaiting confirmation at the FAC.
                  </p>
                  <button
                    onClick={() => handleLogIntake(selected)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    <span className="material-symbols-outlined text-base">inventory_2</span>
                    Log Commodity Intake
                  </button>
                </div>
              )}
              <button onClick={() => setSelected(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  const [bg, text, border] = color.split(' ');
  return (
    <div className={`rounded-2xl border p-5 ${bg} ${border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${text}`}>{label}</p>
          <p className={`text-2xl font-bold mt-1 ${text}`}>{value}</p>
        </div>
        <span className={`material-symbols-outlined text-2xl opacity-70 ${text}`}>{icon}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function VehicleBadge({ type }: { type: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600 capitalize">
      <span className="material-symbols-outlined text-sm">{type === 'tricycle' ? 'electric_rickshaw' : 'two_wheeler'}</span>
      {type}
    </span>
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
