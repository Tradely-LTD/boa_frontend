import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useGetAllDeploymentsQuery } from './services/mechanizationApiSlice';

// ── Vanilla Leaflet map (same pattern as CentresScreen) ───────────────────────
function makePin(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:22px;height:22px;border-radius:50% 50% 50% 0;
      background:${color};border:3px solid white;
      box-shadow:0 3px 8px rgba(0,0,0,.4);
      transform:rotate(-45deg);
    "></div>`,
    iconSize: [22, 22] as [number, number],
    iconAnchor: [11, 22] as [number, number],
    popupAnchor: [0, -26] as [number, number],
  });
}

type LiveDep = {
  id: number; refId: string; status: string;
  tractorModel: string; tractorSerial: string;
  facName: string; farmerName: string; farmerPhone: string;
  deployedAt: string; expectedReturnAt: string;
  implementsAttached: string[];
  lastKnownLat: number; lastKnownLng: number; lastLocationAt: string | null;
};

function TractorMap({ pins }: { pins: LiveDep[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView([9.08, 8.68], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; markersRef.current = []; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    pins.forEach(d => {
      const color = d.status === 'overdue' ? '#ef4444' : '#3b82f6';
      const marker = L.marker([d.lastKnownLat, d.lastKnownLng], { icon: makePin(color) })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:220px;font-family:sans-serif;font-size:12px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
              <span style="
                background:${d.status === 'overdue' ? '#fee2e2' : '#dbeafe'};
                color:${d.status === 'overdue' ? '#dc2626' : '#1d4ed8'};
                font-weight:700;font-size:10px;padding:2px 8px;border-radius:99px;
              ">${d.status.toUpperCase()}</span>
              <span style="color:#94a3b8;font-size:10px;font-family:monospace">${d.refId}</span>
            </div>
            <p style="font-weight:700;font-size:14px;margin:0">${d.tractorModel}</p>
            <p style="color:#94a3b8;font-size:10px;font-family:monospace;margin:0 0 6px">${d.tractorSerial}</p>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:6px 0"/>
            <p style="margin:2px 0"><span style="color:#94a3b8">FAC: </span>${d.facName}</p>
            <p style="margin:2px 0"><span style="color:#94a3b8">Farmer: </span>${d.farmerName}</p>
            <p style="margin:2px 0"><span style="color:#94a3b8">Phone: </span>${d.farmerPhone}</p>
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:6px 0"/>
            <p style="margin:2px 0"><span style="color:#94a3b8">Deployed: </span>${new Date(d.deployedAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</p>
            <p style="margin:2px 0"><span style="color:#94a3b8">Due back: </span><span style="${d.status === 'overdue' ? 'color:#dc2626;font-weight:700' : ''}">${new Date(d.expectedReturnAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span></p>
            ${d.implementsAttached.length > 0 ? `
              <hr style="border:none;border-top:1px solid #f1f5f9;margin:6px 0"/>
              <p style="color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.05em;margin:0 0 3px">Implements</p>
              <div style="display:flex;flex-wrap:wrap;gap:3px">
                ${d.implementsAttached.map(i => `<span style="background:#f1f5f9;color:#475569;padding:1px 6px;border-radius:99px;font-size:10px">${i}</span>`).join('')}
              </div>
            ` : ''}
            <hr style="border:none;border-top:1px solid #f1f5f9;margin:6px 0"/>
            <p style="color:#94a3b8;font-size:10px;margin:0">
              <span style="color:#059669;font-weight:600">GPS:</span>
              ${d.lastKnownLat.toFixed(5)}, ${d.lastKnownLng.toFixed(5)}
            </p>
            ${d.lastLocationAt ? `<p style="color:#94a3b8;font-size:10px;margin:2px 0 0">Updated: ${new Date(d.lastLocationAt).toLocaleString('en-GB',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</p>` : ''}
          </div>
        `);
      markersRef.current.push(marker);
    });
  }, [pins]);

  return (
    <div
      ref={containerRef}
      style={{ height: 520, width: '100%', borderRadius: 16, overflow: 'hidden', isolation: 'isolate' }}
    />
  );
}

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

  const livePins    = deployments.filter(d => d.status !== 'returned' && d.lastKnownLat !== null && d.lastKnownLng !== null) as LiveDep[];
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
          <TractorMap pins={livePins} />

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
