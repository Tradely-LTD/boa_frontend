import { useState } from 'react';
import {
  useGetCentreOrdersQuery,
  useGetManualSalesQuery,
  useUpdateOrderStatusMutation,
  useConfirmPosPaymentMutation,
  useConfirmBankTransferMutation,
} from './services/marketplaceApiSlice';

const STATUS_COLORS: Record<string, string> = {
  pending_payment: 'bg-gray-100 text-gray-600',
  paid:            'bg-blue-100 text-blue-700',
  processing:      'bg-yellow-100 text-yellow-700',
  completed:       'bg-green-100 text-green-700',
  cancelled:       'bg-red-100 text-red-600',
};

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  paid:            'Paid',
  processing:      'Processing',
  completed:       'Completed',
  cancelled:       'Cancelled',
};

const NEXT_STATUSES: Record<string, { label: string; value: 'processing' | 'completed' | 'cancelled' }[]> = {
  paid:       [{ label: 'Mark Processing', value: 'processing' }, { label: 'Cancel', value: 'cancelled' }],
  processing: [{ label: 'Mark Completed',  value: 'completed'  }, { label: 'Cancel', value: 'cancelled' }],
};

const GW_LABEL: Record<string, string> = {
  paystack:      'Paystack',
  bank_transfer: 'Bank Transfer',
  pos_terminal:  'POS Terminal',
};

const GW_COLOR: Record<string, string> = {
  paystack:      'bg-blue-50 text-blue-600',
  bank_transfer: 'bg-green-50 text-green-700',
  pos_terminal:  'bg-purple-50 text-purple-700',
};

export default function MarketplaceOrdersScreen() {
  const { data: orders = [],       isLoading }        = useGetCentreOrdersQuery();
  const { data: manualSales = [],  isLoading: loadingManual } = useGetManualSalesQuery();
  const [updateStatus,  { isLoading: updatingStatus }] = useUpdateOrderStatusMutation();
  const [confirmPos,    { isLoading: confirmingPos }]  = useConfirmPosPaymentMutation();
  const [confirmBank,   { isLoading: confirmingBank }] = useConfirmBankTransferMutation();

  const [tab,        setTab]        = useState<'orders' | 'manual'>('orders');
  const [filter,     setFilter]     = useState<string>('all');
  const [posTarget,  setPosTarget]  = useState<number | null>(null);
  const [posForm,    setPosForm]    = useState({ stan: '', rrn: '' });
  const [posError,   setPosError]   = useState('');

  const filtered = tab === 'manual'
    ? manualSales
    : (filter === 'all' ? orders : orders.filter(o => o.status === filter));

  const handleStatus = async (orderId: number, status: 'processing' | 'completed' | 'cancelled') => {
    await updateStatus({ id: orderId, status }).unwrap();
  };

  const handleConfirmPos = async () => {
    if (!posTarget) return;
    setPosError('');
    if (!posForm.stan || !posForm.rrn) { setPosError('Both STAN and RRN are required.'); return; }
    try {
      await confirmPos({ id: posTarget, stan: posForm.stan, rrn: posForm.rrn }).unwrap();
      setPosTarget(null);
      setPosForm({ stan: '', rrn: '' });
    } catch (e: any) {
      setPosError(e?.data?.message ?? 'Failed to confirm payment.');
    }
  };

  const handleConfirmBank = async (orderId: number) => {
    await confirmBank(orderId).unwrap();
  };

  const f = (n: number) => `₦${n.toLocaleString()}`;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Orders placed by buyers and manual sales recorded at the FAC</p>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit mb-5">
        <button
          onClick={() => setTab('orders')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === 'orders' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Buyer Orders <span className="ml-1 text-xs text-gray-400">({orders.length})</span>
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${tab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Manual Sales <span className="ml-1 text-xs text-gray-400">({manualSales.length})</span>
        </button>
      </div>

      {/* Status filter tabs — only for buyer orders */}
      {tab === 'orders' && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'pending_payment', 'paid', 'processing', 'completed', 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${filter === s ? 'bg-boa-green text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
              {s === 'all' ? ` (${orders.length})` : ` (${orders.filter(o => o.status === s).length})`}
            </button>
          ))}
        </div>
      )}

      {(isLoading || loadingManual) ? (
        <div className="flex items-center justify-center h-48 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
          <span className="material-symbols-outlined text-5xl text-gray-300">{tab === 'manual' ? 'sell' : 'shopping_bag'}</span>
          <p className="text-gray-500">{tab === 'manual' ? 'No manual sales recorded yet.' : `No ${filter !== 'all' ? STATUS_LABEL[filter].toLowerCase() : ''} orders yet.`}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {(tab === 'manual'
                    ? ['Ref', 'Commodity', 'Buyer', 'Phone', 'Qty (kg)', 'Amount', 'Date', 'Notes']
                    : ['Order Ref', 'Commodity', 'Buyer', 'Qty (kg)', 'Amount', 'Gateway', 'Status', 'Date', 'Actions']
                  ).map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => {
                  if (tab === 'manual') {
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{order.refId}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{order.commodity}</td>
                        <td className="px-4 py-3 text-gray-700">{order.buyerName}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{order.buyerPhone || '—'}</td>
                        <td className="px-4 py-3 font-semibold">{order.quantityKg.toLocaleString()}</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">{f(order.totalAmount)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 max-w-[160px] truncate">{order.notes || '—'}</td>
                      </tr>
                    );
                  }

                  const gw = order.paymentGateway ?? 'paystack';
                  const isPending = order.status === 'pending_payment';
                  const isPOS     = isPending && gw === 'pos_terminal';
                  const isBank    = isPending && gw === 'bank_transfer';

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.refId}</td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{order.commodity}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{order.buyerName}</div>
                        <div className="text-xs text-gray-400">{order.buyerPhone}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{order.quantityKg.toLocaleString()}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">{f(order.totalAmount)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${GW_COLOR[gw] ?? 'bg-gray-100 text-gray-600'}`}>
                          {GW_LABEL[gw] ?? gw}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        {isPOS && (
                          <button
                            onClick={() => { setPosTarget(order.id); setPosForm({ stan: '', rrn: '' }); setPosError(''); }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 transition whitespace-nowrap"
                          >
                            Confirm POS
                          </button>
                        )}
                        {isBank && (
                          <button
                            onClick={() => handleConfirmBank(order.id)}
                            disabled={confirmingBank}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition whitespace-nowrap disabled:opacity-50"
                          >
                            Confirm Transfer
                          </button>
                        )}
                        {!isPOS && !isBank && NEXT_STATUSES[order.status] && (
                          <div className="flex gap-1">
                            {NEXT_STATUSES[order.status].map(a => (
                              <button
                                key={a.value}
                                onClick={() => handleStatus(order.id, a.value)}
                                disabled={updatingStatus}
                                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${a.value === 'cancelled' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                              >
                                {a.label}
                              </button>
                            ))}
                          </div>
                        )}
                        {!isPOS && !isBank && !NEXT_STATUSES[order.status] && (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {(tab === 'manual' ? [
          { label: 'Total Manual Sales', value: manualSales.length,                                                                         icon: 'sell',            color: 'bg-blue-50 text-blue-600' },
          { label: 'Total Volume (kg)',  value: `${manualSales.reduce((s, o) => s + o.quantityKg, 0).toLocaleString()} kg`,                 icon: 'scale',           color: 'bg-amber-50 text-amber-600' },
          { label: 'Today',             value: manualSales.filter(o => o.createdAt.slice(0,10) === new Date().toISOString().slice(0,10)).length, icon: 'today',       color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Revenue',     value: `₦${manualSales.reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`,                  icon: 'account_balance', color: 'bg-purple-50 text-purple-600' },
        ] : [
          { label: 'Total Orders',    value: orders.length,                                                                  icon: 'shopping_bag',    color: 'bg-blue-50 text-blue-600' },
          { label: 'Awaiting Payment',value: orders.filter(o => o.status === 'pending_payment').length,                      icon: 'hourglass_top',   color: 'bg-gray-50 text-gray-600' },
          { label: 'Processing',      value: orders.filter(o => o.status === 'processing').length,                           icon: 'local_shipping',  color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Revenue',         value: `₦${orders.filter(o => ['paid','processing','completed'].includes(o.status)).reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`, icon: 'account_balance', color: 'bg-purple-50 text-purple-600' },
        ]).map(card => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <span className="material-symbols-outlined text-xl">{card.icon}</span>
            </div>
            <div>
              <div className="font-bold text-gray-900">{card.value}</div>
              <div className="text-xs text-gray-500">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* POS Confirmation Modal */}
      {posTarget !== null && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Confirm POS Payment</h2>
                <p className="text-xs text-gray-500 mt-0.5">Enter the terminal receipt details</p>
              </div>
              <button onClick={() => setPosTarget(null)}>
                <span className="material-symbols-outlined text-gray-400">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {posError && <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{posError}</div>}

              <div className="bg-purple-50 rounded-xl p-3 text-sm text-purple-700">
                <p className="font-semibold mb-1">Order #{posTarget}</p>
                <p className="text-xs">Amount: <strong>{f(orders.find(o => o.id === posTarget)?.totalAmount ?? 0)}</strong></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">STAN <span className="text-gray-400 font-normal">— System Trace Audit Number</span></label>
                <input
                  type="text"
                  value={posForm.stan}
                  onChange={e => setPosForm(f => ({ ...f, stan: e.target.value }))}
                  placeholder="6-digit STAN from receipt"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">RRN <span className="text-gray-400 font-normal">— Retrieval Reference Number</span></label>
                <input
                  type="text"
                  value={posForm.rrn}
                  onChange={e => setPosForm(f => ({ ...f, rrn: e.target.value }))}
                  placeholder="12-digit RRN from receipt"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button onClick={() => setPosTarget(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleConfirmPos}
                disabled={confirmingPos}
                className="px-6 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition disabled:opacity-50"
              >
                {confirmingPos ? 'Confirming…' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
