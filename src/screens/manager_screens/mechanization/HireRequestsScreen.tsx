import { useState } from 'react';
import {
  useGetHireRequestsQuery,
  useSendQuoteMutation,
  useConfirmPaymentAndAssignMutation,
  useGetMyTractorsQuery,
  type HireRequest,
} from '../../mechanization_screens/services/mechanizationApiSlice';

const TABS = [
  { key: 'pending',           label: 'Pending Quote' },
  { key: 'quoted',            label: 'Quoted' },
  { key: 'payment_confirmed', label: 'Payment Confirmed' },
  { key: 'deployed',          label: 'Deployed' },
  { key: 'completed',         label: 'Completed' },
];

const STATUS_STYLE: Record<string, string> = {
  pending:           'bg-slate-100 text-slate-600',
  quoted:            'bg-amber-100 text-amber-700',
  payment_confirmed: 'bg-blue-100 text-blue-700',
  deployed:          'bg-emerald-100 text-emerald-700',
  completed:         'bg-green-100 text-green-800',
  cancelled:         'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  pending:           'Pending Quote',
  quoted:            'Quoted',
  payment_confirmed: 'Payment Confirmed',
  deployed:          'Deployed',
  completed:         'Completed',
  cancelled:         'Cancelled',
};

function fmt(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HireRequestsScreen() {
  const { data: requests = [], isLoading } = useGetHireRequestsQuery();
  const { data: myTractors = [] }          = useGetMyTractorsQuery();
  const availableTractors                  = myTractors.filter(t => t.status === 'available');

  const [sendQuote]              = useSendQuoteMutation();
  const [confirmPaymentAndAssign] = useConfirmPaymentAndAssignMutation();

  const [activeTab, setActiveTab] = useState('pending');
  const [quoteTarget, setQuoteTarget]       = useState<HireRequest | null>(null);
  const [assignTarget, setAssignTarget]     = useState<HireRequest | null>(null);
  const [quoteForm, setQuoteForm]           = useState({ quotedAmount: '', quoteNotes: '' });
  const [assignForm, setAssignForm]         = useState({ tractorId: '', expectedReturnAt: '', notes: '' });
  const [quoteLoading, setQuoteLoading]     = useState(false);
  const [assignLoading, setAssignLoading]   = useState(false);
  const [quoteError, setQuoteError]         = useState('');
  const [assignError, setAssignError]       = useState('');

  const filtered = requests.filter(r => r.status === activeTab);
  const countFor = (key: string) => requests.filter(r => r.status === key).length;

  const handleSendQuote = async () => {
    if (!quoteTarget || !quoteForm.quotedAmount) { setQuoteError('Enter the quoted amount.'); return; }
    setQuoteLoading(true);
    setQuoteError('');
    try {
      await sendQuote({
        id:           quoteTarget.id,
        quotedAmount: Number(quoteForm.quotedAmount),
        quoteNotes:   quoteForm.quoteNotes || undefined,
      }).unwrap();
      setQuoteTarget(null);
      setQuoteForm({ quotedAmount: '', quoteNotes: '' });
    } catch {
      setQuoteError('Failed to send quote. Please try again.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignTarget || !assignForm.tractorId || !assignForm.expectedReturnAt) {
      setAssignError('Select a tractor and set the expected return date.');
      return;
    }
    setAssignLoading(true);
    setAssignError('');
    try {
      await confirmPaymentAndAssign({
        id:               assignTarget.id,
        tractorId:        Number(assignForm.tractorId),
        expectedReturnAt: assignForm.expectedReturnAt,
        notes:            assignForm.notes || undefined,
      }).unwrap();
      setAssignTarget(null);
      setAssignForm({ tractorId: '', expectedReturnAt: '', notes: '' });
    } catch {
      setAssignError('Failed to confirm. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Hire Requests
        </h1>
        <p className="text-slate-500 text-sm mt-1">Farmer tractor hire requests submitted to your centre</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 flex-wrap mb-6 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => {
          const count = countFor(tab.key);
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5
                ${activeTab === tab.key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? 'bg-boa-green text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Request list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
            <p className="text-slate-400 text-sm mt-2">No requests in this category</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map(req => (
              <li key={req.id} className="px-6 py-5">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Left: farmer + location info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{req.farmerName}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>
                        {STATUS_LABEL[req.status]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{req.farmerPhone} · Ref: {req.refId}</p>

                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <InfoChip icon="location_on" label="Location"  value={`${req.state}${req.lga ? `, ${req.lga}` : ''}`} />
                      <InfoChip icon="straighten"  label="Hectares"  value={`${req.hectares} ha`} />
                      <InfoChip icon="event"       label="Pref. Date" value={fmt(req.preferredDate)} />
                      <InfoChip icon="agriculture" label="Tractor"   value={req.tractorModel ?? '—'} />
                    </div>

                    {req.locationDescription && (
                      <p className="text-xs text-slate-500 mt-2 italic">"{req.locationDescription}"</p>
                    )}

                    {req.implements.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {req.implements.map(impl => (
                          <span key={impl} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full capitalize">
                            {impl.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}

                    {req.quotedAmount !== null && (
                      <p className="mt-2 text-sm font-semibold text-boa-green">
                        Quoted: ₦{req.quotedAmount.toLocaleString()}
                        {req.quoteNotes && <span className="text-slate-400 font-normal ml-1">· {req.quoteNotes}</span>}
                      </p>
                    )}
                  </div>

                  {/* Right: action */}
                  <div className="shrink-0">
                    {req.status === 'pending' && (
                      <button
                        onClick={() => { setQuoteTarget(req); setQuoteError(''); }}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Send Quote
                      </button>
                    )}
                    {req.status === 'payment_confirmed' && (
                      <button
                        onClick={() => { setAssignTarget(req); setAssignError(''); }}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Assign & Deploy
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Send Quote Modal */}
      {quoteTarget && (
        <Modal title={`Send Quote — ${quoteTarget.farmerName}`} onClose={() => setQuoteTarget(null)}>
          <p className="text-sm text-slate-500 mb-4">
            {quoteTarget.hectares} ha · {quoteTarget.implements.join(', ') || 'No implements specified'} · {quoteTarget.state}
          </p>
          <div className="space-y-4">
            <Field label="Quoted Amount (₦)">
              <input
                type="number"
                className="input"
                placeholder="e.g. 150000"
                value={quoteForm.quotedAmount}
                onChange={e => setQuoteForm(f => ({ ...f, quotedAmount: e.target.value }))}
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Any conditions, inclusions, or remarks..."
                value={quoteForm.quoteNotes}
                onChange={e => setQuoteForm(f => ({ ...f, quoteNotes: e.target.value }))}
              />
            </Field>
            {quoteError && <p className="text-red-500 text-sm">{quoteError}</p>}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setQuoteTarget(null)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleSendQuote} disabled={quoteLoading} className="flex-1 btn-primary">
              {quoteLoading ? 'Sending...' : 'Send Quote'}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign & Deploy Modal */}
      {assignTarget && (
        <Modal title={`Assign Tractor — ${assignTarget.farmerName}`} onClose={() => setAssignTarget(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Payment confirmed · ₦{assignTarget.quotedAmount?.toLocaleString()} · {assignTarget.hectares} ha
          </p>
          <div className="space-y-4">
            <Field label="Assign Tractor">
              {availableTractors.length === 0 ? (
                <p className="text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  No tractors currently available. Mark a tractor as available first.
                </p>
              ) : (
                <select className="input" value={assignForm.tractorId} onChange={e => setAssignForm(f => ({ ...f, tractorId: e.target.value }))}>
                  <option value="">— Select a tractor —</option>
                  {availableTractors.map(t => (
                    <option key={t.id} value={t.id}>{t.model} — {t.serialNumber} ({t.horsepowerHp}hp {t.driveType})</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Expected Return Date">
              <input
                type="date"
                className="input"
                value={assignForm.expectedReturnAt}
                onChange={e => setAssignForm(f => ({ ...f, expectedReturnAt: e.target.value }))}
              />
            </Field>
            <Field label="Notes (optional)">
              <textarea
                className="input resize-none"
                rows={2}
                value={assignForm.notes}
                onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
              />
            </Field>
            {assignError && <p className="text-red-500 text-sm">{assignError}</p>}
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setAssignTarget(null)} className="flex-1 btn-outline">Cancel</button>
            <button
              onClick={handleConfirmAssign}
              disabled={assignLoading || availableTractors.length === 0}
              className="flex-1 btn-primary"
            >
              {assignLoading ? 'Deploying...' : 'Confirm & Deploy'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-0.5">
        <span className="material-symbols-outlined text-xs">{icon}</span>
        {label}
      </p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value}</p>
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
