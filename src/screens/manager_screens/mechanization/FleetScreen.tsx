import { useState } from 'react';
import {
  useGetMyTractorsQuery,
  useUpdateTractorStatusMutation,
  useAttachImplementsMutation,
  type Tractor,
} from '../../mechanization_screens/services/mechanizationApiSlice';

const STATUS_STYLE: Record<string, string> = {
  available:   'bg-emerald-100 text-emerald-700',
  deployed:    'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL: Record<string, string> = {
  available: 'Available', deployed: 'Deployed', maintenance: 'Maintenance',
};
const STATUS_ICON: Record<string, string> = {
  available: 'check_circle', deployed: 'near_me', maintenance: 'build',
};

const ALL_IMPLEMENTS = [
  'Ridger', 'Disc Plough', 'Disc Harrow', 'Planter', 'Rotavator',
  'Sprayer', 'Trailer', 'Subsoiler', 'Cultivator', 'Boom Sprayer',
];

export default function FleetScreen() {
  const { data: tractors = [], isLoading } = useGetMyTractorsQuery();
  const [updateStatus]    = useUpdateTractorStatusMutation();
  const [attachImplements] = useAttachImplementsMutation();

  const [updatingId, setUpdatingId]           = useState<number | null>(null);
  const [implTarget, setImplTarget]           = useState<Tractor | null>(null);
  const [selectedImpls, setSelectedImpls]     = useState<string[]>([]);
  const [implLoading, setImplLoading]         = useState(false);

  const available   = tractors.filter(t => t.status === 'available').length;
  const deployed    = tractors.filter(t => t.status === 'deployed').length;
  const maintenance = tractors.filter(t => t.status === 'maintenance').length;

  const handleStatusToggle = async (id: number, current: string) => {
    const next = current === 'available' ? 'maintenance' : 'available';
    setUpdatingId(id);
    try { await updateStatus({ id, status: next }).unwrap(); }
    finally { setUpdatingId(null); }
  };

  const openImplModal = (t: Tractor) => {
    setImplTarget(t);
    setSelectedImpls([...t.currentImplements]);
  };

  const toggleImpl = (impl: string) => {
    setSelectedImpls(prev =>
      prev.includes(impl) ? prev.filter(i => i !== impl) : [...prev, impl]
    );
  };

  const handleSaveImpls = async () => {
    if (!implTarget) return;
    setImplLoading(true);
    try {
      await attachImplements({ id: implTarget.id, implements: selectedImpls }).unwrap();
      setImplTarget(null);
    } finally { setImplLoading(false); }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          My Tractor Fleet
        </h1>
        <p className="text-slate-500 text-sm mt-1">Tractors assigned to your centre by BOA</p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-8">
        <SummaryChip label="Available"   value={available}   color="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <SummaryChip label="Deployed"    value={deployed}    color="text-blue-700 bg-blue-50 border-blue-200" />
        <SummaryChip label="Maintenance" value={maintenance} color="text-amber-700 bg-amber-50 border-amber-200" />
      </div>

      {/* Tractor cards */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">
          <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
        </div>
      ) : tractors.length === 0 ? (
        <div className="py-16 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300">agriculture</span>
          <p className="text-slate-500 font-medium mt-3">No tractors assigned yet</p>
          <p className="text-slate-400 text-sm mt-1">Contact BOA to have tractors assigned to your centre</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tractors.map(t => (
            <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4">
              {/* Top row */}
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <span className={`material-symbols-outlined text-2xl ${
                    t.status === 'available' ? 'text-emerald-600'
                    : t.status === 'deployed' ? 'text-blue-600'
                    : 'text-amber-600'
                  }`}>agriculture</span>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${STATUS_STYLE[t.status]}`}>
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {STATUS_ICON[t.status]}
                  </span>
                  {STATUS_LABEL[t.status]}
                </span>
              </div>

              {/* Info */}
              <div>
                <p className="font-bold text-slate-800 text-base">{t.model}</p>
                {t.brand && <p className="text-xs text-slate-400">{t.brand}</p>}
                <p className="text-xs text-slate-400 font-mono mt-0.5">{t.serialNumber}</p>
              </div>

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <SpecItem label="Horsepower"   value={`${t.horsepowerHp} hp`} />
                <SpecItem label="Drive Type"   value={t.driveType} />
                {t.yearManufactured && <SpecItem label="Year"  value={String(t.yearManufactured)} />}
                {t.fuelType && <SpecItem label="Fuel"          value={t.fuelType} />}
                {t.engineCc && <SpecItem label="Engine"        value={`${t.engineCc} cc`} />}
                {t.color    && <SpecItem label="Colour"        value={t.color} />}
              </div>

              {/* Implements */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Implements Attached</p>
                  {t.status !== 'deployed' && (
                    <button
                      onClick={() => openImplModal(t)}
                      className="text-[10px] font-semibold text-boa-green hover:underline flex items-center gap-0.5"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      Manage
                    </button>
                  )}
                </div>
                {t.currentImplements.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {t.currentImplements.map(impl => (
                      <span key={impl} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full">
                        {impl}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 italic">No implements attached</p>
                )}
              </div>

              {/* Notes */}
              {t.notes && (
                <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3">"{t.notes}"</p>
              )}

              {/* Action */}
              {t.status !== 'deployed' ? (
                <button
                  onClick={() => handleStatusToggle(t.id, t.status)}
                  disabled={updatingId === t.id}
                  className={`w-full py-2 rounded-xl text-sm font-semibold transition
                    ${t.status === 'available'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                >
                  {updatingId === t.id
                    ? 'Updating…'
                    : t.status === 'available' ? 'Mark as Maintenance' : 'Mark as Available'}
                </button>
              ) : (
                <p className="text-center text-xs text-blue-500 font-medium py-1">
                  Currently out on deployment
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Manage Implements Modal ─────────────────────────────────────────── */}
      {implTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setImplTarget(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                Manage Implements
              </h3>
              <button onClick={() => setImplTarget(null)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-5">{implTarget.model} — {implTarget.serialNumber}</p>

            <div className="grid grid-cols-2 gap-2 mb-6">
              {ALL_IMPLEMENTS.map(impl => {
                const active = selectedImpls.includes(impl);
                return (
                  <button
                    key={impl}
                    onClick={() => toggleImpl(impl)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition text-left
                      ${active
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                  >
                    <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center
                      ${active ? 'bg-boa-green border-boa-green' : 'border-slate-300'}`}>
                      {active && <span className="material-symbols-outlined text-white text-xs" style={{ fontSize: 12 }}>check</span>}
                    </span>
                    {impl}
                  </button>
                );
              })}
            </div>

            {selectedImpls.length > 0 && (
              <p className="text-xs text-slate-500 mb-4">
                <span className="font-semibold">{selectedImpls.length}</span> implement{selectedImpls.length > 1 ? 's' : ''} selected:{' '}
                {selectedImpls.join(', ')}
              </p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setImplTarget(null)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={handleSaveImpls} disabled={implLoading} className="flex-1 btn-primary">
                {implLoading ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-700 capitalize">{value}</p>
    </div>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  const [text, bg, border] = color.split(' ');
  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${bg} ${border}`}>
      <span className={`text-xl font-bold ${text}`}>{value}</span>
      <span className={`text-sm font-medium ${text}`}>{label}</span>
    </div>
  );
}
