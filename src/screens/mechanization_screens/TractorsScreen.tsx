import { useState } from 'react';
import {
  useGetAllTractorsQuery,
  useAddTractorMutation,
  useUpdateTractorMutation,
  useAssignTractorToFacMutation,
  type Tractor,
  type AddTractorPayload,
  type UpdateTractorPayload,
} from './services/mechanizationApiSlice';
import { useGetCentresQuery } from '../centres_screens/services/centresApiSlice';

const STATUS_STYLE: Record<string, string> = {
  available:   'bg-emerald-100 text-emerald-700',
  deployed:    'bg-blue-100 text-blue-700',
  maintenance: 'bg-amber-100 text-amber-700',
};
const STATUS_LABEL: Record<string, string> = {
  available: 'Available', deployed: 'Deployed', maintenance: 'Maintenance',
};
const STATUS_OPTIONS = ['available', 'maintenance'] as const;

const BRANDS      = ['Mahindra', 'Massey Ferguson', 'Sonalika', 'Caterpillar', 'New Holland', 'John Deere', 'TAFE', 'Foton Lovol'];
const FUEL_TYPES  = ['diesel', 'petrol'];
const DRIVE_TYPES = ['2WD', '4WD'] as const;
const YEARS       = Array.from({ length: 15 }, (_, i) => 2025 - i);

const EMPTY_FORM: AddTractorPayload = {
  serialNumber: '', model: '', horsepowerHp: 75, driveType: '4WD',
  brand: '', yearManufactured: undefined, fuelType: 'diesel',
  engineCc: undefined, color: '', notes: '',
};

export default function TractorsScreen() {
  const { data: tractors = [], isLoading } = useGetAllTractorsQuery();
  const { data: centresResp }              = useGetCentresQuery({ limit: 200, status: 'active' });
  const centres                            = centresResp?.data ?? [];

  const [addTractor]    = useAddTractorMutation();
  const [updateTractor] = useUpdateTractorMutation();
  const [assignToFac]   = useAssignTractorToFacMutation();

  const [statusFilter, setStatusFilter]   = useState('all');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editTarget, setEditTarget]       = useState<Tractor | null>(null);
  const [assignTarget, setAssignTarget]   = useState<Tractor | null>(null);
  const [assignFacId, setAssignFacId]     = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const [form, setForm]         = useState<AddTractorPayload>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<UpdateTractorPayload>({} as UpdateTractorPayload);
  const [addLoading, setAddLoading]   = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [formError, setFormError]     = useState('');
  const [editError, setEditError]     = useState('');

  const filtered = statusFilter === 'all' ? tractors : tractors.filter(t => t.status === statusFilter);
  const counts   = {
    total:       tractors.length,
    available:   tractors.filter(t => t.status === 'available').length,
    deployed:    tractors.filter(t => t.status === 'deployed').length,
    maintenance: tractors.filter(t => t.status === 'maintenance').length,
  };

  const handleAdd = async () => {
    if (!form.serialNumber.trim() || !form.model.trim()) {
      setFormError('Serial number and model are required.');
      return;
    }
    setAddLoading(true); setFormError('');
    try {
      await addTractor(cleanPayload(form)).unwrap();
      setShowAddModal(false);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setFormError(err?.data?.message ?? 'Failed to add tractor. Please try again.');
    } finally { setAddLoading(false); }
  };

  const openEdit = (t: Tractor) => {
    setEditTarget(t);
    setEditForm({
      model:            t.model,
      brand:            t.brand            ?? '',
      horsepowerHp:     t.horsepowerHp,
      driveType:        t.driveType,
      yearManufactured: t.yearManufactured ?? undefined,
      fuelType:         t.fuelType         ?? 'diesel',
      engineCc:         t.engineCc         ?? undefined,
      color:            t.color            ?? '',
      notes:            t.notes            ?? '',
      // Only allow admin to change status while tractor is still in BOA inventory (not deployed)
      status: t.status !== 'deployed' ? t.status : undefined,
    });
    setEditError('');
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditLoading(true); setEditError('');
    try {
      await updateTractor({ id: editTarget.id, ...cleanPayload(editForm) }).unwrap();
      setEditTarget(null);
    } catch (err: any) {
      setEditError(err?.data?.message ?? 'Failed to update. Please try again.');
    } finally { setEditLoading(false); }
  };

  const handleAssign = async () => {
    if (!assignTarget || !assignFacId) return;
    setAssignLoading(true);
    try {
      await assignToFac({ id: assignTarget.id, facId: Number(assignFacId) }).unwrap();
      setAssignTarget(null); setAssignFacId('');
    } finally { setAssignLoading(false); }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Tractor Inventory
          </h1>
          <p className="text-slate-500 text-sm mt-1">Manage BOA tractors and FAC assignments</p>
        </div>
        <button
          onClick={() => { setShowAddModal(true); setFormError(''); setForm(EMPTY_FORM); }}
          className="flex items-center gap-2 bg-boa-green text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add Tractor
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total"       value={counts.total}       icon="agriculture"  color="text-slate-700 bg-slate-50 border-slate-200" />
        <StatCard label="Available"   value={counts.available}   icon="check_circle" color="text-emerald-700 bg-emerald-50 border-emerald-200" />
        <StatCard label="Deployed"    value={counts.deployed}    icon="near_me"      color="text-blue-700 bg-blue-50 border-blue-200" />
        <StatCard label="Maintenance" value={counts.maintenance} icon="build"        color="text-amber-700 bg-amber-50 border-amber-200" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'available', 'deployed', 'maintenance'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition capitalize
              ${statusFilter === s ? 'bg-boa-green text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-boa-green'}`}
          >
            {s === 'all' ? 'All' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">agriculture</span>
            <p className="text-slate-400 text-sm mt-2">No tractors found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Serial No.</th>
                  <th className="text-left px-5 py-3 font-semibold">Brand / Model</th>
                  <th className="text-left px-4 py-3 font-semibold">Specs</th>
                  <th className="text-left px-4 py-3 font-semibold">Year</th>
                  <th className="text-left px-5 py-3 font-semibold">Assigned FAC</th>
                  <th className="text-left px-5 py-3 font-semibold">Implements</th>
                  <th className="text-left px-5 py-3 font-semibold">Status</th>
                  <th className="text-left px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">{t.serialNumber}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{t.model}</p>
                      {t.brand && <p className="text-xs text-slate-400">{t.brand}</p>}
                    </td>
                    <td className="px-4 py-4 text-slate-600 text-xs">
                      <span className="font-medium">{t.horsepowerHp}hp</span>
                      <span className="mx-1 text-slate-300">·</span>{t.driveType}
                      {t.engineCc ? <><span className="mx-1 text-slate-300">·</span>{t.engineCc}cc</> : null}
                    </td>
                    <td className="px-4 py-4 text-slate-500 text-xs">{t.yearManufactured ?? '—'}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">
                      {t.facName ?? <span className="text-slate-300 italic text-xs">Unassigned</span>}
                    </td>
                    <td className="px-5 py-4">
                      {t.currentImplements.length > 0
                        ? <div className="flex flex-wrap gap-1">
                            {t.currentImplements.map(i => (
                              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">{i}</span>
                            ))}
                          </div>
                        : <span className="text-slate-300 text-xs italic">None</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button onClick={() => openEdit(t)} className="text-xs text-slate-500 hover:text-slate-800 font-medium hover:underline">
                          Edit
                        </button>
                        <button
                          onClick={() => { setAssignTarget(t); setAssignFacId(t.facId ? String(t.facId) : ''); }}
                          className="text-xs text-boa-green font-semibold hover:underline"
                        >
                          {t.facId ? 'Reassign FAC' : 'Assign FAC'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add Tractor Modal ─────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal title="Add New Tractor" onClose={() => setShowAddModal(false)}>
          <TractorForm form={form} onChange={setForm} />
          {formError && <p className="text-red-500 text-sm mt-3">{formError}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={() => setShowAddModal(false)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleAdd} disabled={addLoading} className="flex-1 btn-primary">
              {addLoading ? 'Adding…' : 'Add Tractor'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Tractor Modal ────────────────────────────────────────────────── */}
      {editTarget && (
        <Modal title={`Edit — ${editTarget.serialNumber}`} onClose={() => setEditTarget(null)}>
          {editTarget.status === 'deployed' && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-4 text-xs text-blue-700">
              <span className="material-symbols-outlined text-sm">info</span>
              Status is managed by the assigned FAC while this tractor is deployed.
            </div>
          )}
          <TractorForm
            form={editForm as AddTractorPayload}
            onChange={f => setEditForm(f)}
            hideSerial
            showStatus={editTarget.status !== 'deployed'}
          />
          {editError && <p className="text-red-500 text-sm mt-3">{editError}</p>}
          <div className="flex gap-3 mt-6">
            <button onClick={() => setEditTarget(null)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleEdit} disabled={editLoading} className="flex-1 btn-primary">
              {editLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Assign FAC Modal ──────────────────────────────────────────────────── */}
      {assignTarget && (
        <Modal
          title={`${assignTarget.facId ? 'Reassign' : 'Assign'} FAC — ${assignTarget.serialNumber}`}
          onClose={() => setAssignTarget(null)}
        >
          <p className="text-xs text-slate-500 mb-4">
            {assignTarget.model} · {assignTarget.horsepowerHp}hp {assignTarget.driveType}
          </p>
          <Field label="Select Aggregation Centre (FAC)">
            {centres.length === 0 ? (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                No active centres found.
              </p>
            ) : (
              <select className="input" value={assignFacId} onChange={e => setAssignFacId(e.target.value)}>
                <option value="">— Choose a centre —</option>
                {centres.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.centreName} — {c.state}{c.lga ? `, ${c.lga}` : ''}
                  </option>
                ))}
              </select>
            )}
          </Field>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setAssignTarget(null)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleAssign} disabled={assignLoading || !assignFacId} className="flex-1 btn-primary">
              {assignLoading ? 'Assigning…' : 'Confirm Assignment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Tractor form ──────────────────────────────────────────────────────────────
function TractorForm({
  form, onChange, hideSerial = false, showStatus = false,
}: {
  form: AddTractorPayload & { status?: string };
  onChange: (f: any) => void;
  hideSerial?: boolean;
  showStatus?: boolean;
}) {
  const set = (k: string, v: any) => onChange({ ...form, [k]: v });
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      {!hideSerial && (
        <Field label="Serial Number *">
          <input className="input" placeholder="e.g. TRC-MH-2025-006"
            value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} />
        </Field>
      )}

      {showStatus && (
        <Field label="Status">
          <select className="input" value={form.status ?? 'available'} onChange={e => set('status', e.target.value)}>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand">
          <select className="input" value={form.brand ?? ''} onChange={e => set('brand', e.target.value)}>
            <option value="">— Select brand —</option>
            {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Year Manufactured">
          <select className="input" value={form.yearManufactured ?? ''} onChange={e => set('yearManufactured', e.target.value ? Number(e.target.value) : undefined)}>
            <option value="">— Year —</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Model / Name *">
        <input className="input" placeholder="e.g. Mahindra 575 DI XP Plus"
          value={form.model} onChange={e => set('model', e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Horsepower (HP) *">
          <input type="number" className="input" placeholder="75"
            value={form.horsepowerHp ?? ''} onChange={e => set('horsepowerHp', Number(e.target.value))} />
        </Field>
        <Field label="Drive Type *">
          <select className="input" value={form.driveType} onChange={e => set('driveType', e.target.value)}>
            {DRIVE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Fuel Type">
          <select className="input" value={form.fuelType ?? 'diesel'} onChange={e => set('fuelType', e.target.value)}>
            {FUEL_TYPES.map(f => <option key={f} value={f} className="capitalize">{f}</option>)}
          </select>
        </Field>
        <Field label="Engine (cc)">
          <input type="number" className="input" placeholder="e.g. 2730"
            value={form.engineCc ?? ''} onChange={e => set('engineCc', e.target.value ? Number(e.target.value) : undefined)} />
        </Field>
      </div>

      <Field label="Colour">
        <input className="input" placeholder="e.g. Red"
          value={form.color ?? ''} onChange={e => set('color', e.target.value)} />
      </Field>

      <Field label="Notes / Remarks">
        <textarea className="input resize-none" rows={2} placeholder="Any additional notes…"
          value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />
      </Field>
    </div>
  );
}

// ── Shared UI ─────────────────────────────────────────────────────────────────
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-800 text-lg" style={{ fontFamily: 'Plus Jakarta Sans' }}>{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function cleanPayload(form: Partial<AddTractorPayload>): any {
  const out: any = { ...form };
  if (!out.brand)            delete out.brand;
  if (!out.color)            delete out.color;
  if (!out.notes)            delete out.notes;
  if (!out.yearManufactured) delete out.yearManufactured;
  if (!out.engineCc)         delete out.engineCc;
  return out;
}
