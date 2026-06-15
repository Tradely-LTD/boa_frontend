import { useState, useMemo } from 'react';
import {
  useGetLoansQuery,
  useCreateLoanMutation,
  useUpdateLoanStatusMutation,
  useGetCommodityPricesQuery,
  type LoanApplication,
  type PledgedReceipt,
} from './services/loanApiSlice';
import { useGetReceiptsQuery, type WarehouseReceipt } from '../manager_screens/receipts/services/receiptsApiSlice';
import Pagination from '../../components/Pagination/Pagination';

const statusStyle: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  approved:  'bg-blue-100 text-blue-700',
  disbursed: 'bg-emerald-100 text-emerald-700',
  repaid:    'bg-slate-100 text-slate-500',
  defaulted: 'bg-red-100 text-red-600',
  rejected:  'bg-slate-100 text-slate-500',
};

const statusFlow: Record<string, { label: string; next: string[] }> = {
  pending:   { label: 'Pending Review', next: ['approved', 'rejected'] },
  approved:  { label: 'Approved',       next: ['disbursed', 'rejected'] },
  disbursed: { label: 'Disbursed',      next: ['repaid', 'defaulted'] },
  repaid:    { label: 'Repaid',         next: [] },
  defaulted: { label: 'Defaulted',      next: [] },
  rejected:  { label: 'Rejected',       next: [] },
};

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export default function LoanApplicationsScreen() {
  const [page,  setPage]  = useState(1);
  const [limit, setLimit] = useState(20);
  const [filterStatus, setFilterStatus] = useState('');
  const { data: loansData, isLoading }               = useGetLoansQuery({ page, limit, status: filterStatus || undefined });
  const { data: receiptsData }                       = useGetReceiptsQuery({});
  const { data: pricesData }                         = useGetCommodityPricesQuery();
  const [createLoan, { isLoading: creating }]        = useCreateLoanMutation();
  const [updateStatus, { isLoading: updating }]      = useUpdateLoanStatusMutation();

  const [selected, setSelected]   = useState<LoanApplication | null>(null);
  const [showForm, setShowForm]   = useState(false);
  const [error, setError]         = useState('');

  // Multi-receipt form state
  const [selectedReceiptNumbers, setSelectedReceiptNumbers] = useState<string[]>([]);
  const [loanAmountRequested, setLoanAmountRequested]       = useState('');
  const [interestRate, setInterestRate]                     = useState('');
  const [repaymentMonths, setRepaymentMonths]               = useState('');
  const [reviewNotes, setReviewNotes]                       = useState('');

  const [actionModal, setActionModal] = useState<{ loan: LoanApplication; status: string } | null>(null);
  const [actionForm, setActionForm]   = useState({
    loanAmountApproved: '', interestRate: '', repaymentPeriodMonths: '', reviewNotes: '',
  });

  const loans   = loansData?.data ?? [];
  const receipts = receiptsData?.data ?? [];
  const prices   = pricesData?.data ?? [];
  const activeReceipts: WarehouseReceipt[] = receipts.filter((r: WarehouseReceipt) => r.status === 'active');

  // Compute collateral value from selected receipts
  const selectedReceipts = useMemo(
    () => activeReceipts.filter(r => selectedReceiptNumbers.includes(r.receiptNumber)),
    [activeReceipts, selectedReceiptNumbers]
  );

  const totalCollateralKg = selectedReceipts.reduce((s, r) => s + r.quantityKg, 0);

  // Best price per receipt commodity (centre-specific > global)
  const getPriceForCommodity = (commodity: string, centreId: number) => {
    const centrePrice = prices.find(p => p.commodity === commodity && p.centreId === centreId);
    const globalPrice = prices.find(p => p.commodity === commodity && p.centreId === null);
    return centrePrice ?? globalPrice ?? null;
  };

  const totalCollateralValue = useMemo(() => {
    return selectedReceipts.reduce((sum, r) => {
      const price = getPriceForCommodity(r.commodity, r.centreId);
      return sum + (price ? r.quantityKg * price.pricePerKg : 0);
    }, 0);
  }, [selectedReceipts, prices]);

  const maxLoan = totalCollateralValue > 0 ? totalCollateralValue * 0.70 : null;
  const requestedAmt = parseFloat(loanAmountRequested) || 0;
  const capExceeded  = maxLoan !== null && requestedAmt > maxLoan;

  const toggleReceipt = (receiptNumber: string) => {
    setSelectedReceiptNumbers(prev =>
      prev.includes(receiptNumber) ? prev.filter(n => n !== receiptNumber) : [...prev, receiptNumber]
    );
  };

  const resetForm = () => {
    setSelectedReceiptNumbers([]);
    setLoanAmountRequested('');
    setInterestRate('');
    setRepaymentMonths('');
    setReviewNotes('');
    setError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!selectedReceiptNumbers.length) { setError('Select at least one receipt.'); return; }
    if (capExceeded) { setError(`Loan amount cannot exceed 70% of total collateral value (${fmt(maxLoan!)})`); return; }
    try {
      await createLoan({
        receiptNumbers:        selectedReceiptNumbers,
        loanAmountRequested:   parseFloat(loanAmountRequested),
        interestRate:          interestRate     ? parseFloat(interestRate)     : undefined,
        repaymentPeriodMonths: repaymentMonths  ? parseInt(repaymentMonths)    : undefined,
        reviewNotes:           reviewNotes || undefined,
      }).unwrap();
      setShowForm(false);
      resetForm();
    } catch (err: any) {
      setError(err?.data?.message ?? 'Failed to create loan application.');
    }
  };

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    try {
      await updateStatus({
        id:                   actionModal.loan.id,
        status:               actionModal.status,
        loanAmountApproved:   actionForm.loanAmountApproved   ? parseFloat(actionForm.loanAmountApproved)   : undefined,
        interestRate:         actionForm.interestRate         ? parseFloat(actionForm.interestRate)         : undefined,
        repaymentPeriodMonths: actionForm.repaymentPeriodMonths ? parseInt(actionForm.repaymentPeriodMonths) : undefined,
        reviewNotes:          actionForm.reviewNotes || undefined,
      }).unwrap();
      setActionModal(null);
      setActionForm({ loanAmountApproved: '', interestRate: '', repaymentPeriodMonths: '', reviewNotes: '' });
      setSelected(null);
    } catch {}
  };

  const openAction = (loan: LoanApplication, status: string) => {
    setActionModal({ loan, status });
    setActionForm({
      loanAmountApproved:    loan.loanAmountApproved    ? String(loan.loanAmountApproved)    : String(loan.loanAmountRequested),
      interestRate:          loan.interestRate          ? String(loan.interestRate)          : '',
      repaymentPeriodMonths: loan.repaymentPeriodMonths ? String(loan.repaymentPeriodMonths) : '',
      reviewNotes:           loan.reviewNotes ?? '',
    });
  };

  const pending        = loans.filter(l => l.status === 'pending').length;
  const disbursed      = loans.filter(l => l.status === 'disbursed').length;
  const totalDisbursed = loans
    .filter(l => ['disbursed', 'repaid'].includes(l.status))
    .reduce((sum, l) => sum + (l.loanAmountApproved ?? l.loanAmountRequested), 0);

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-start justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            AgriHub Receipt Financing
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Loan applications backed by AgriHub Receipts (AHRs) as collateral</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
        >
          <span className="material-symbols-outlined text-base">add</span>
          New Loan Application
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Applications" value={loans.length}        icon="description"     color="bg-slate-50 text-slate-700 border-slate-200" />
        <StatCard label="Pending Review"      value={pending}             icon="pending"         color="bg-amber-50 text-amber-700 border-amber-200" />
        <StatCard label="Active Loans"        value={disbursed}           icon="account_balance" color="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <StatCard label="Total Disbursed"     value={fmt(totalDisbursed)} icon="payments"        color="bg-blue-50 text-blue-700 border-blue-200" />
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['', 'pending', 'approved', 'disbursed', 'repaid', 'defaulted', 'rejected'].map(s => (
          <button key={s} onClick={() => { setFilterStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
              filterStatus === s ? 'bg-boa-green text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {s === '' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading…</div>
        ) : loans.length === 0 ? (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-slate-300">account_balance</span>
            <p className="text-slate-400 text-sm mt-2">No loan applications yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ref ID</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Receipts</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Farmer</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Collateral</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Requested</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Approved</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{loan.refId}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-slate-600">{loan.receiptCount} AHR{loan.receiptCount !== 1 ? 's' : ''}</span>
                    {loan.receiptNumber && <span className="block font-mono text-xs text-slate-400">{loan.receiptNumber}{loan.receiptCount > 1 ? ' +more' : ''}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-800 font-medium">
                    {loan.farmerName}
                    {loan.farmerPhone && <span className="block text-xs text-slate-400">{loan.farmerPhone}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {loan.commodity}
                    <span className="block text-xs text-slate-400">{loan.quantityKg.toLocaleString()} kg total</span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-700 font-medium">{fmt(loan.loanAmountRequested)}</td>
                  <td className="px-5 py-3.5 text-slate-700">
                    {loan.loanAmountApproved ? fmt(loan.loanAmountApproved) : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[loan.status]}`}>
                      {statusFlow[loan.status]?.label ?? loan.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setSelected(loan)} className="text-boa-green text-xs font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
        {loansData && loansData.totalPages > 0 && (
          <Pagination page={page} totalPages={loansData.totalPages} total={loansData.total} limit={limit}
            onPageChange={setPage} onLimitChange={(l) => { setLimit(l); setPage(1); }} />
        )}
      </div>

      {/* Create Loan Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowForm(false); resetForm(); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">New Loan Application</h2>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">

              {/* Receipt selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Select Receipts as Collateral <span className="text-red-400">*</span>
                </label>
                <p className="text-xs text-slate-400 mb-2">Select one or more active (un-pledged) AHRs.</p>
                {activeReceipts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No active receipts available.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                    {activeReceipts.map(r => {
                      const price  = getPriceForCommodity(r.commodity, r.centreId);
                      const value  = price ? r.quantityKg * price.pricePerKg : null;
                      const picked = selectedReceiptNumbers.includes(r.receiptNumber);
                      return (
                        <label key={r.id}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition border-b border-slate-100 last:border-0
                            ${picked ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}
                        >
                          <input type="checkbox" className="mt-0.5" checked={picked}
                            onChange={() => toggleReceipt(r.receiptNumber)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-slate-500">{r.receiptNumber}</span>
                              {value !== null && (
                                <span className="text-xs text-emerald-700 font-semibold">{fmt(value)}</span>
                              )}
                            </div>
                            <p className="text-sm font-medium text-slate-800 truncate">{r.commodity} · {r.quantityKg.toLocaleString()} kg</p>
                            <p className="text-xs text-slate-400">{r.farmerName}{price ? ` · ₦${price.pricePerKg}/kg` : ' · no market price set'}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Collateral summary */}
              {selectedReceipts.length > 0 && (
                <div className={`rounded-xl px-4 py-3 text-sm border ${capExceeded ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Total Collateral</span>
                    <span className="font-semibold">{totalCollateralKg.toLocaleString()} kg ({selectedReceipts.length} AHR)</span>
                  </div>
                  {totalCollateralValue > 0 ? (
                    <>
                      <div className="flex justify-between text-slate-700 mb-1">
                        <span>Market Value</span>
                        <span className="font-semibold">{fmt(totalCollateralValue)}</span>
                      </div>
                      <div className={`flex justify-between font-semibold ${capExceeded ? 'text-red-700' : 'text-emerald-700'}`}>
                        <span>Max Loan (70%)</span>
                        <span>{fmt(maxLoan!)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-xs text-amber-600">No market price set for selected commodities — 70% cap cannot be calculated.</p>
                  )}
                </div>
              )}

              {/* Loan amount */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Loan Amount Requested (₦) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min="1" step="0.01"
                  value={loanAmountRequested}
                  onChange={e => setLoanAmountRequested(e.target.value)}
                  required
                  max={maxLoan ?? undefined}
                  placeholder={maxLoan ? `Max ₦${maxLoan.toLocaleString()}` : 'e.g. 500000'}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 ${
                    capExceeded ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-emerald-200'
                  }`}
                />
                {capExceeded && maxLoan && (
                  <p className="text-xs text-red-600 mt-1">Cannot exceed 70% of total collateral value ({fmt(maxLoan)})</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (% p.a.)</label>
                  <input type="number" min="0" step="0.01" value={interestRate}
                    onChange={e => setInterestRate(e.target.value)} placeholder="e.g. 9"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Repayment (months)</label>
                  <input type="number" min="1" value={repaymentMonths}
                    onChange={e => setRepaymentMonths(e.target.value)} placeholder="e.g. 6"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea rows={2} value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                  placeholder="Additional notes…" />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-base">error</span>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={creating || capExceeded || !selectedReceiptNumbers.length}
                  className="flex-1 py-2.5 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                  {creating ? 'Submitting…' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSelected(null)} />
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 sticky top-0 bg-white z-10">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-slate-800">{selected.refId}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[selected.status]}`}>
                    {statusFlow[selected.status]?.label}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selected.receiptCount} AHR(s) pledged · {selected.quantityKg.toLocaleString()} kg total</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 px-6 py-5 space-y-5 text-sm">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">
                    {selected.receiptCount} Receipt{selected.receiptCount !== 1 ? 's' : ''} Pledged as Collateral
                  </p>
                  <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
                    All pledged receipts are locked against this loan and will be released when the loan is repaid or rejected.
                  </p>
                </div>
              </div>

              {/* Pledged receipts */}
              {selected.pledgedReceipts?.length > 0 && (
                <Section label="Pledged Receipts">
                  {selected.pledgedReceipts.map((p: PledgedReceipt) => (
                    <div key={p.id} className="flex justify-between items-center py-1">
                      <span className="font-mono text-xs text-slate-500">{p.receiptNumber}</span>
                      <span className="text-slate-700 text-xs">{p.commodity} · {p.quantityKg.toLocaleString()} kg</span>
                    </div>
                  ))}
                </Section>
              )}

              <Section label="Farmer">
                <Field label="Name"   value={selected.farmerName} />
                <Field label="Phone"  value={selected.farmerPhone} />
                <Field label="NIN"    value={selected.farmerNin} />
              </Section>

              <Section label="Collateral Summary">
                <Field label="Total Quantity"  value={`${selected.quantityKg.toLocaleString()} kg`} />
                <Field label="Storage Centre"  value={selected.centreName} />
                <Field label="Primary Commodity" value={selected.commodity} />
              </Section>

              <Section label="Loan Terms">
                <Field label="Amount Requested" value={fmt(selected.loanAmountRequested)} />
                <Field label="Amount Approved"  value={selected.loanAmountApproved ? fmt(selected.loanAmountApproved) : null} />
                <Field label="Interest Rate"    value={selected.interestRate ? `${selected.interestRate}% p.a.` : null} />
                <Field label="Repayment Period" value={selected.repaymentPeriodMonths ? `${selected.repaymentPeriodMonths} months` : null} />
              </Section>

              <Section label="Timeline">
                <Field label="Applied"   value={fmtDate(selected.createdAt)} />
                <Field label="Disbursed" value={selected.disbursedAt ? fmtDate(selected.disbursedAt) : null} />
                <Field label="Repaid"    value={selected.repaidAt    ? fmtDate(selected.repaidAt)    : null} />
              </Section>

              {selected.reviewNotes && (
                <Section label="Notes">
                  <p className="text-slate-600 text-sm leading-relaxed">{selected.reviewNotes}</p>
                </Section>
              )}
            </div>

            {statusFlow[selected.status]?.next.length > 0 && (
              <div className="px-6 py-4 border-t border-slate-100 sticky bottom-0 bg-white flex gap-3 flex-wrap">
                {statusFlow[selected.status].next.map(next => (
                  <button key={next} onClick={() => openAction(selected, next)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${
                      next === 'rejected' || next === 'defaulted'
                        ? 'border border-red-200 text-red-600 hover:bg-red-50'
                        : 'bg-boa-green text-white hover:bg-emerald-700'
                    }`}>
                    {next === 'approved'  && 'Approve Loan'}
                    {next === 'disbursed' && 'Mark Disbursed'}
                    {next === 'repaid'    && 'Mark Repaid'}
                    {next === 'rejected'  && 'Reject'}
                    {next === 'defaulted' && 'Mark Defaulted'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setActionModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-800 capitalize">
                {actionModal.status === 'approved'  && 'Approve Loan'}
                {actionModal.status === 'disbursed' && 'Confirm Disbursement'}
                {actionModal.status === 'repaid'    && 'Confirm Repayment'}
                {actionModal.status === 'rejected'  && 'Reject Application'}
                {actionModal.status === 'defaulted' && 'Mark as Defaulted'}
              </h2>
            </div>
            <form onSubmit={handleAction} className="px-6 py-5 space-y-4">
              {actionModal.status === 'approved' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Approved Amount (₦)</label>
                    <input type="number" min="1" step="0.01"
                      value={actionForm.loanAmountApproved}
                      onChange={e => setActionForm(f => ({ ...f, loanAmountApproved: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)</label>
                      <input type="number" min="0" step="0.01"
                        value={actionForm.interestRate}
                        onChange={e => setActionForm(f => ({ ...f, interestRate: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Months</label>
                      <input type="number" min="1"
                        value={actionForm.repaymentPeriodMonths}
                        onChange={e => setActionForm(f => ({ ...f, repaymentPeriodMonths: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                </>
              )}
              {['rejected', 'defaulted', 'repaid', 'disbursed'].includes(actionModal.status) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea rows={3} value={actionForm.reviewNotes}
                    onChange={e => setActionForm(f => ({ ...f, reviewNotes: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-200 resize-none"
                    placeholder="Optional notes…" />
                </div>
              )}
              {(actionModal.status === 'rejected' || actionModal.status === 'repaid') && (
                <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-emerald-600 text-base shrink-0 mt-0.5">lock_open</span>
                  <p className="text-emerald-700 text-xs leading-relaxed">
                    All pledged receipts will automatically be released back to <strong>Active</strong> status.
                  </p>
                </div>
              )}
              {actionModal.status === 'defaulted' && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <span className="material-symbols-outlined text-red-600 text-base shrink-0 mt-0.5">warning</span>
                  <p className="text-red-700 text-xs leading-relaxed">
                    Receipts will remain pledged. BOA may take possession of the stored commodities.
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setActionModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" disabled={updating}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-60 ${
                    actionModal.status === 'rejected' || actionModal.status === 'defaulted'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-boa-green text-white hover:bg-emerald-700'
                  }`}>
                  {updating ? 'Saving…' : 'Confirm'}
                </button>
              </div>
            </form>
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
