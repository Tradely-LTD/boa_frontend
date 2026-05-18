import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useGetCentresQuery, type Centre } from './services/centresApiSlice';
import { useExport } from '../../hooks/useExport';
import Pagination from '../../components/Pagination/Pagination';

const statusStyle: Record<string, string> = {
  active:          'bg-emerald-100 text-emerald-700',
  suspended:       'bg-amber-100 text-amber-700',
  decommissioned:  'bg-slate-100 text-slate-500',
};

// ── Vanilla Leaflet map (no react-leaflet) ──────────────────────────────────
function CentreMap({
  centres,
  onSelect,
  selectedId,
}: {
  centres: Centre[];
  onSelect: (c: Centre) => void;
  selectedId: number | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<L.Map | null>(null);
  const markersRef   = useRef<Record<number, L.Marker>>({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView([9.082, 8.6753], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  // Add / update markers when centres change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    centres
      .filter(c => c.gpsLat && c.gpsLng)
      .forEach(c => {
        const marker = L.marker([parseFloat(c.gpsLat!), parseFloat(c.gpsLng!)])
          .addTo(map)
          .bindPopup(`
            <div style="min-width:160px;font-family:sans-serif">
              <p style="font-weight:700;margin:0 0 2px">${c.centreName}</p>
              <p style="color:#64748b;font-size:12px;margin:0">${c.state}${c.lga ? ` · ${c.lga}` : ''}</p>
              ${c.capacityMt ? `<p style="font-size:12px;margin:4px 0 0">Capacity: ${c.capacityMt} MT</p>` : ''}
              ${c.managerName ? `<p style="font-size:12px;margin:2px 0 0">Manager: ${c.managerName}</p>` : ''}
            </div>
          `);
        marker.on('click', () => onSelect(c));
        markersRef.current[c.id] = marker;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centres]);

  // Fly to selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const centre = centres.find(c => c.id === selectedId);
    if (centre?.gpsLat && centre?.gpsLng) {
      map.flyTo([parseFloat(centre.gpsLat), parseFloat(centre.gpsLng)], 13, { duration: 1 });
      markersRef.current[selectedId]?.openPopup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      style={{ height: 520, width: '100%', borderRadius: 16, overflow: 'hidden', isolation: 'isolate' }}
    />
  );
}

// ── Mini map in drawer ───────────────────────────────────────────────────────
function MiniMap({ lat, lng }: { lat: number; lng: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      zoomControl: false, dragging: false, scrollWheelZoom: false,
      doubleClickZoom: false, attributionControl: false,
    }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
    L.marker([lat, lng]).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      style={{ height: 180, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0' }}
    />
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function CentresScreen() {
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [search,      setSearch]      = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading }       = useGetCentresQuery({ page, limit, search: search || undefined });
  const [selected, setSelected]   = useState<Centre | null>(null);
  const [viewMode, setViewMode]   = useState<'table' | 'map'>('table');
  const { downloadCsv, openPdf }  = useExport();

  const centres  = data?.data ?? [];
  const mappable = centres.filter(c => c.gpsLat && c.gpsLng);
  const bool = (v: boolean | null) => v == null ? null : v ? 'Yes' : 'No';

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Aggregation Centres
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">All approved and active centres across Nigeria</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="material-symbols-outlined text-base">table_rows</span>Table
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition ${viewMode === 'map' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <span className="material-symbols-outlined text-base">map</span>Map
              {mappable.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-1.5 py-0.5 rounded-full ml-0.5">
                  {mappable.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {viewMode === 'table' && (
          <div className="flex gap-2 mt-3 flex-wrap">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">search</span>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name…"
                className="pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 outline-none focus:ring-2 focus:ring-emerald-200 focus:border-boa-green w-48"
              />
            </div>
            <button onClick={() => downloadCsv('centres', 'boa-aggregation-centres.csv')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
              <span className="material-symbols-outlined text-base">download</span>Export CSV
            </button>
            <button onClick={() => openPdf('centres')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
              <span className="material-symbols-outlined text-base">picture_as_pdf</span>Export PDF
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
          ) : !centres.length ? (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">warehouse</span>
              <p className="text-slate-400 text-sm mt-2">No centres yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reference</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Centre Name</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">State / LGA</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Capacity</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Manager</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {centres.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{c.refId}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {c.centreName}
                      {c.gpsLat && c.gpsLng && (
                        <span className="material-symbols-outlined text-emerald-500 ml-1" style={{ fontSize: 13, verticalAlign: 'middle' }}>location_on</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs">
                      <span className="font-medium text-slate-700">{c.state}</span>
                      {c.lga && <span className="text-slate-400"> / {c.lga}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 capitalize">{c.centreType.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 text-slate-600">{c.capacityMt ? `${c.capacityMt} MT` : '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">{c.managerName ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[c.status]}`}>{c.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setSelected(c)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          {data && data.totalPages > 0 && viewMode === 'table' && (
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
      )}

      {/* Map */}
      {viewMode === 'map' && (
        <div className="flex gap-4 items-start">
          {/* Sidebar list */}
          <div className="w-64 shrink-0 bg-white rounded-2xl border border-slate-200 overflow-hidden" style={{ height: 520 }}>
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {mappable.length} of {centres.length} plotted
              </p>
              {mappable.length < centres.length && (
                <p className="text-xs text-amber-600 mt-0.5">{centres.length - mappable.length} missing GPS</p>
              )}
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(520px - 53px)' }}>
              {centres.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${selected?.id === c.id ? 'bg-emerald-50' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{c.centreName}</p>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{c.state}{c.lga ? ` · ${c.lga}` : ''}</p>
                    </div>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0 mt-0.5 ${statusStyle[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Map canvas */}
          <div className="flex-1">
            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 flex items-center justify-center" style={{ height: 520 }}>
                <p className="text-slate-400 text-sm">Loading centres…</p>
              </div>
            ) : mappable.length === 0 ? (
              <div className="bg-slate-100 rounded-2xl flex flex-col items-center justify-center" style={{ height: 520 }}>
                <span className="material-symbols-outlined text-5xl text-slate-300">location_off</span>
                <p className="text-slate-400 text-sm mt-2">No centres have GPS coordinates yet</p>
              </div>
            ) : (
              <CentreMap
                centres={centres}
                onSelect={setSelected}
                selectedId={selected?.id ?? null}
              />
            )}
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-[9999] flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800">{selected.centreName}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[selected.status]}`}>{selected.status}</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{selected.refId}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 mt-0.5 shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              {selected.gpsLat && selected.gpsLng && (
                <MiniMap lat={parseFloat(selected.gpsLat)} lng={parseFloat(selected.gpsLng)} />
              )}
              <Section label="Identity">
                <Field label="Centre Type"   value={selected.centreType.replace('_', ' ')} />
                <Field label="CAC Reg No."   value={selected.regNumber} />
                <Field label="TIN"           value={selected.tinNumber} />
                <Field label="Year Est."     value={selected.yearEstablished} />
              </Section>
              <Section label="Ownership">
                <Field label="Owner Name"    value={selected.ownerName} />
                <Field label="Owner Phone"   value={selected.ownerPhone} />
                <Field label="Owner NIN"     value={selected.ownerNin} />
              </Section>
              <Section label="Infrastructure">
                <Field label="Warehouse Type"    value={selected.warehouseType?.replace('_', ' ')} />
                <Field label="Storage Capacity"  value={selected.capacityMt ? `${selected.capacityMt} MT` : null} />
                <Field label="Cold Storage"      value={selected.coldStorageCapacityMt ? `${selected.coldStorageCapacityMt} MT` : null} />
                <Field label="No. of Bays"       value={selected.numBays} />
                <Field label="Floor Area"        value={selected.floorAreaSqm ? `${selected.floorAreaSqm} sqm` : null} />
                <Field label="Power Source"      value={selected.powerSource} />
                <Field label="Water Source"      value={selected.waterSource} />
                <Field label="Access Road"       value={bool(selected.hasAccessRoad)} />
                <Field label="WR Capable"        value={bool(selected.warehouseReceiptCapable)} />
                <Field label="Commodities"       value={selected.commodities ? JSON.parse(selected.commodities).join(', ') : null} />
                <Field label="Facilities"        value={selected.facilities ? JSON.parse(selected.facilities).join(', ') : null} />
              </Section>
              <Section label="Location">
                <Field label="Address"  value={selected.address} />
                <Field label="State"    value={selected.state} />
                <Field label="LGA"      value={selected.lga} />
                <Field label="GPS"      value={selected.gpsLat && selected.gpsLng ? `${selected.gpsLat}, ${selected.gpsLng}` : null} />
              </Section>
              <Section label="Manager">
                <Field label="Name"    value={selected.managerName} />
                <Field label="Phone"   value={selected.managerPhone} />
                <Field label="Email"   value={selected.managerEmail} />
                <Field label="NIN"     value={selected.managerNin} />
              </Section>
              <Section label="Banking">
                <Field label="Bank Name"       value={selected.bankName} />
                <Field label="Account Number"  value={selected.accountNumber} />
                <Field label="BVN"             value={selected.bvn} />
              </Section>
              <Section label="Approval">
                <Field label="Approved At"  value={selected.approvedAt?.slice(0, 10)} />
                <Field label="Registered"   value={selected.createdAt.slice(0, 10)} />
              </Section>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white flex gap-3">
              {selected.gpsLat && selected.gpsLng && (
                <a
                  href={`https://www.google.com/maps?q=${selected.gpsLat},${selected.gpsLng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                  Open in Google Maps
                </a>
              )}
              <button
                onClick={() => setSelected(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
              >
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
