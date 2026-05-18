import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useGetAllDeploymentsQuery } from './services/mechanizationApiSlice';

// ── Leaflet pins ──────────────────────────────────────────────────────────────
const makePin = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      box-shadow:0 3px 8px rgba(0,0,0,.4);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [22, 22], iconAnchor: [11, 22], popupAnchor: [0, -26],
  });

const PIN_ACTIVE  = makePin('#3b82f6');
const PIN_OVERDUE = makePin('#ef4444');

const NIGERIA_CENTER: [number, number] = [9.08, 8.68];

const STATUS_STYLE: Record<string, string> = {
  active:   'bg-blue-100 text-blue-700',
  overdue:  'bg-red-100 text-red-700',
  returned: 'bg-slate-100 text-slate-600',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Active', overdue: 'Overdue', returned: 'Returned',
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function AdminMechDeploymentsScreen() {
  const { data: deployments = [], isLoading } = useGetAllDeploymentsQuery();
  const [activeView, setActiveView]   = useState<'list' | 'map'>('list');
  const [statusFilter, setStatusFilter] = useState('all');

  const counts = {
    active:   deployments.filter(d => d.status === 'active').length,
    overdue:  deployments.filter(d => d.status === 'overdue').length,
    returned: deployments.filter(d => d.status === 'returned').length,
  };

  const filtered = statusFilter === 'all'
    ? deployments
    : deployments.filter(d => d.status === statusFilter);

  // Map: only non-returned deployments with real GPS
  const livePins    = deployments.filter(d => d.status !== 'returned' && d.lastKnownLat !== null && d.lastKnownLng !== null);
  const awaitingGps = deployments.filter(d => d.status !== 'returned' && (d.lastKnownLat === null || d.lastKnownLng === null));

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Tractor Deployments
        </h1>
        <p className="text-slate-500 text-sm mt-1">National overview of all active and historical deployments</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard label="Active"   value={counts.active}   icon="near_me"  color="text-blue-700 bg-blue-50 border-blue-200" />
        <StatCard label="Overdue"  value={counts.overdue}  icon="warning"  color="text-red-700 bg-red-50 border-red-200" />
        <StatCard label="Returned" value={counts.returned} icon="task_alt" color="text-slate-700 bg-slate-50 border-slate-200" />
      </div>

      {/* View tabs */}
      <div className="flex gap-1.5 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {(['list', 'map'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveView(tab)}
            className={`flex items-center gap-1.5 px-5 py-1.5 rounded-lg text-sm font-medium transition
              ${activeView === tab ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span className="material-symbols-outlined text-base">{tab === 'list' ? 'list' : 'map'}</span>
            {tab === 'list' ? 'List' : 'Live Tracker'}
          </button>
        ))}
      </div>

      {/* ── LIST VIEW ──────────────────────────────────────────────────────────── */}
      {activeView === 'list' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'active', 'overdue', 'returned'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize
                  ${statusFilter === s ? 'bg-boa-green text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-boa-green'}`}
              >
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center text-slate-400">
                <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300">near_me</span>
                <p className="text-slate-400 text-sm mt-2">No deployments found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                      <th className="text-left px-6 py-3 font-semibold">Ref</th>
                      <th className="text-left px-6 py-3 font-semibold">Tractor</th>
                      <th className="text-left px-6 py-3 font-semibold">Farmer</th>
                      <th className="text-left px-6 py-3 font-semibold">FAC</th>
                      <th className="text-left px-6 py-3 font-semibold">Implements</th>
                      <th className="text-left px-6 py-3 font-semibold">Deployed</th>
                      <th className="text-left px-6 py-3 font-semibold">Due Back</th>
                      <th className="text-left px-6 py-3 font-semibold">GPS</th>
                      <th className="text-left px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map(d => (
                      <tr key={d.id} className={`hover:bg-slate-50/60 transition-colors ${d.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{d.refId}</td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{d.tractorModel}</p>
                          <p className="text-xs text-slate-400 font-mono">{d.tractorSerial}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-800">{d.farmerName}</p>
                          <p className="text-xs text-slate-400">{d.farmerPhone}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-600 text-sm">{d.facName}</td>
                        <td className="px-6 py-4">
                          {d.implementsAttached.length > 0
                            ? <div className="flex flex-wrap gap-1">
                                {d.implementsAttached.map(i => (
                                  <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{i}</span>
                                ))}
                              </div>
                            : <span className="text-slate-300 text-xs italic">None</span>
                          }
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">{fmt(d.deployedAt)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={d.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-slate-600'}>
                            {fmt(d.expectedReturnAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {d.lastKnownLat ? (
                            <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                              <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>gps_fixed</span>
                              Live
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-slate-400 text-xs">
                              <span className="material-symbols-outlined text-xs">gps_not_fixed</span>
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[d.status]}`}>
                            {STATUS_LABEL[d.status]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── MAP / LIVE TRACKER ─────────────────────────────────────────────────── */}
      {activeView === 'map' && (
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-4 py-2.5">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Overdue
            </span>
            <span className="ml-auto font-medium text-slate-600">
              {livePins.length} live · {awaitingGps.length} awaiting GPS
            </span>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" style={{ height: 520 }}>
            <MapContainer center={NIGERIA_CENTER} zoom={6} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {livePins.map(d => (
                <Marker
                  key={d.id}
                  position={[d.lastKnownLat!, d.lastKnownLng!]}
                  icon={d.status === 'overdue' ? PIN_OVERDUE : PIN_ACTIVE}
                >
                  <Popup minWidth={230}>
                    <div className="space-y-1 text-xs">
                      {/* Status badge + ref */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_STYLE[d.status]}`}>
                          {d.status.toUpperCase()}
                        </span>
                        <span className="font-mono text-slate-400 text-[10px]">{d.refId}</span>
                      </div>

                      {/* Tractor */}
                      <p className="font-bold text-slate-800 text-sm">{d.tractorModel}</p>
                      <p className="font-mono text-slate-400 text-[10px]">{d.tractorSerial}</p>

                      <hr className="my-2 border-slate-100" />

                      {/* FAC */}
                      <PopupRow icon="warehouse" label="FAC"    value={d.facName} />
                      <PopupRow icon="person"    label="Farmer" value={d.farmerName} />
                      <PopupRow icon="call"      label="Phone"  value={d.farmerPhone} />

                      <hr className="my-2 border-slate-100" />

                      <PopupRow icon="calendar_today" label="Deployed"  value={fmt(d.deployedAt)} />
                      <PopupRow icon="event"          label="Due back"  value={fmt(d.expectedReturnAt)} />

                      {/* Implements */}
                      {d.implementsAttached.length > 0 && (
                        <div className="pt-1">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Implements</p>
                          <div className="flex flex-wrap gap-1">
                            {d.implementsAttached.map(i => (
                              <span key={i} className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px]">{i}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* GPS info */}
                      <hr className="my-2 border-slate-100" />
                      <p className="text-[10px] text-slate-400">
                        <span className="font-medium text-emerald-600">GPS:</span>{' '}
                        {d.lastKnownLat?.toFixed(5)}, {d.lastKnownLng?.toFixed(5)}
                      </p>
                      {d.lastLocationAt && (
                        <p className="text-[10px] text-slate-400">Updated: {fmtTime(d.lastLocationAt)}</p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Awaiting GPS */}
          {awaitingGps.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-500">gps_not_fixed</span>
                Deployed — awaiting GPS signal ({awaitingGps.length})
              </p>
              <div className="divide-y divide-slate-50">
                {awaitingGps.map(d => (
                  <div key={d.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <span className="font-semibold text-slate-800">{d.tractorModel}</span>
                      <span className="text-slate-400 font-mono text-xs ml-2">{d.tractorSerial}</span>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{d.facName}</p>
                      <p className="text-slate-400">
                        {d.farmerName} · Due {fmt(d.expectedReturnAt)}
                        {d.status === 'overdue' && <span className="text-red-600 font-semibold"> · OVERDUE</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {livePins.length === 0 && awaitingGps.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-4xl text-slate-300">near_me</span>
              <p className="text-slate-400 text-sm mt-2">No active deployments to track</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PopupRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="material-symbols-outlined text-slate-400" style={{ fontSize: 12 }}>{icon}</span>
      <span className="text-slate-400">{label}:</span>
      <span className="font-medium text-slate-700">{value}</span>
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
