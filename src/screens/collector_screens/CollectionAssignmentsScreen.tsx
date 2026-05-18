import { useState } from 'react';
import {
  useGetMyAssignmentsQuery, useMarkAssignmentInTransitMutation, useMarkAssignmentCollectedMutation,
} from './services/collectionAssignmentsApiSlice';
import type { CollectionRequest } from '../manager_screens/collections/services/collectionRequestsApiSlice';
import Pagination from '../../components/Pagination/Pagination';

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700',
  assigned:   'bg-blue-100 text-blue-700',
  in_transit: 'bg-purple-100 text-purple-700',
  collected:  'bg-emerald-100 text-emerald-700',
  cancelled:  'bg-slate-100 text-slate-500',
};

export default function CollectionAssignmentsScreen() {
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useGetMyAssignmentsQuery({ page, limit, status: statusFilter || undefined });
  const [markInTransit, { isLoading: dispatching }] = useMarkAssignmentInTransitMutation();
  const [markCollected, { isLoading: collecting }]  = useMarkAssignmentCollectedMutation();

  const [selected, setSelected]       = useState<CollectionRequest | null>(null);
  const [showCollect, setShowCollect] = useState(false);
  const [actionError, setActionError] = useState('');
  const [collectForm, setCollectForm] = useState({ actualQuantityKg: '', collectionNotes: '' });

  const assignments = data?.data ?? [];

  const handleMarkInTransit = async (req: CollectionRequest) => {
    setActionError('');
    try {
      await markInTransit(req.id).unwrap();
      // Immediately reflect the new status in the panel so the button switches
      // to "Confirm Pickup" without the user having to close and reopen the drawer.
      if (selected?.id === req.id) {
        setSelected(s => s ? { ...s, status: 'in_transit' } : s);
      }
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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>My Assignments</h1>
        <p className="text-slate-500 text-sm mt-0.5">Collection requests assigned to you</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'assigned', 'in_transit', 'collected'].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      {actionError && <p className="text-sm text-red-500 mb-4">{actionError}</p>}

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : assignments.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">assignment_ind</span>
            <p className="text-slate-400 text-sm mt-2">No assignments yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Farmer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Commodity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Qty</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vehicle</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignments.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{req.refId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {req.farmerName}
                      <span className="block text-xs text-slate-400">{req.farmerPhone}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {req.lga}, {req.state}
                      <span className="block text-xs text-slate-400 truncate max-w-[140px]">{req.address}</span>
                      {req.gpsLat && req.gpsLng && (
                        <a href={`https://www.google.com/maps?q=${req.gpsLat},${req.gpsLng}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
                          <span className="material-symbols-outlined text-xs">map</span>Maps
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">{req.commodity}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.estimatedQuantityKg.toLocaleString()} kg</td>
                    <td className="px-5 py-3.5 text-slate-600 capitalize">{req.collectionType}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[req.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{req.preferredDate}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2 items-center">
                        <button onClick={() => setSelected(req)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                        {req.status === 'assigned' && (
                          <button onClick={() => handleMarkInTransit(req)} disabled={dispatching}
                            className="text-purple-600 text-xs font-medium hover:underline disabled:opacity-50">
                            Start Trip
                          </button>
                        )}
                        {req.status === 'in_transit' && (
                          <button onClick={() => { setSelected(req); setShowCollect(true); setActionError(''); }}
                            className="text-emerald-600 text-xs font-medium hover:underline">
                            Confirm Pickup
                          </button>
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

      {/* Confirm Collection Modal */}
      {showCollect && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCollect(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Confirm Pickup</h2>
              <button onClick={() => setShowCollect(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleMarkCollected} className="px-6 py-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm">
                <p className="font-medium text-emerald-800">{selected.farmerName} — {selected.commodity}</p>
                <p className="text-emerald-600 text-xs mt-0.5">{selected.address}, {selected.lga}, {selected.state}</p>
                <p className="text-emerald-600 text-xs mt-0.5">Estimated: {selected.estimatedQuantityKg.toLocaleString()} kg</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actual Quantity Collected (kg)</label>
                <input type="number" min="0.01" step="0.01" value={collectForm.actualQuantityKg}
                  onChange={e => setCollectForm(f => ({ ...f, actualQuantityKg: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                  placeholder={`Estimated: ${selected.estimatedQuantityKg} kg`} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={3} value={collectForm.collectionNotes}
                  onChange={e => setCollectForm(f => ({ ...f, collectionNotes: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Condition of produce, any issues encountered…" />
              </div>
              {actionError && <p className="text-sm text-red-500">{actionError}</p>}
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                After confirming, the centre manager will log the official commodity intake and issue an AgriHub Receipt (AHR) for the farmer.
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowCollect(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={collecting}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {collecting ? 'Confirming…' : 'Confirm Pickup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && !showCollect && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between sticky top-0 bg-white z-10">
              <div>
                <p className="font-semibold text-slate-800">{selected.farmerName}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selected.refId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              <Section label="Farmer">
                <Field label="Name"  value={selected.farmerName} />
                <Field label="Phone" value={selected.farmerPhone} />
                <Field label="NIN"   value={selected.farmerNin} />
              </Section>
              <Section label="Location">
                <Field label="Address" value={selected.address} />
                <Field label="LGA"     value={selected.lga} />
                <Field label="State"   value={selected.state} />
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
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition">
                    <span className="material-symbols-outlined text-sm">map</span>
                    Open in Google Maps
                  </a>
                )}
              </Section>
              <Section label="Collection">
                <Field label="Commodity"   value={selected.commodity} />
                <Field label="Est. Qty"    value={`${selected.estimatedQuantityKg.toLocaleString()} kg`} />
                <Field label="Vehicle"     value={selected.collectionType} />
                <Field label="Pref. Date"  value={selected.preferredDate} />
                <Field label="Pref. Time"  value={selected.preferredTime} />
              </Section>
              {selected.notes && <Section label="Farmer Notes"><p className="text-slate-700">{selected.notes}</p></Section>}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white space-y-2">
              {selected.status === 'assigned' && (
                <button onClick={() => handleMarkInTransit(selected)} disabled={dispatching}
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition">
                  {dispatching ? 'Starting…' : 'Start Trip'}
                </button>
              )}
              {selected.status === 'in_transit' && (
                <button onClick={() => { setShowCollect(true); setActionError(''); }}
                  className="w-full py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition">
                  Confirm Pickup
                </button>
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
