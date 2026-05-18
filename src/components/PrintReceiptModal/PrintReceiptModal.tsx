import QRCode from 'react-qr-code';
import type { WarehouseReceipt } from '../../screens/manager_screens/receipts/services/receiptsApiSlice';

interface Props {
  receipt: WarehouseReceipt;
  managerName: string;
  onClose: () => void;
}

const LANDING_URL = (import.meta as any).env?.VITE_LANDING_URL ?? 'http://localhost:5173';

export default function PrintReceiptModal({ receipt, managerName, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 print:hidden" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 print:shadow-none print:rounded-none print:max-w-full print:m-0">

        {/* Controls — hidden on print */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-800">AgriHub Receipt</p>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-boa-green text-white text-sm font-semibold hover:bg-emerald-700 transition"
            >
              <span className="material-symbols-outlined text-base">print</span>
              Print / Save PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-1">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Receipt body */}
        <div className="px-8 py-6">
          <div className="text-center mb-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Bank of Agriculture Nigeria</p>
            <h2 className="text-xl font-bold text-slate-800">AgriHub Receipt</h2>
            <p className="font-mono text-sm font-semibold text-boa-green mt-1">{receipt.receiptNumber}</p>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden mb-5">
            <Row label="Centre"        value={receipt.centreName}                      />
            <Row label="Commodity"     value={receipt.commodity}                 dark  />
            <Row label="Quantity"      value={`${receipt.quantityKg.toLocaleString()} kg`} />
            <Row label="Grade"         value={receipt.gradeQuality ?? '—'}        dark  />
            <Row label="Farmer Name"   value={receipt.farmerName}                      />
            <Row label="Farmer Phone"  value={receipt.farmerPhone ?? '—'}         dark  />
            <Row label="Farmer NIN"    value={receipt.farmerNin ?? '—'}                />
            <Row label="Issued On"     value={receipt.issuedAt.slice(0, 10)}      dark  />
            <Row label="Expires"       value={receipt.expiresAt?.slice(0, 10) ?? 'No expiry'} />
            <Row label="Status"        value={receipt.status.toUpperCase()}        dark  />
          </div>

          {receipt.notes && (
            <p className="text-xs text-slate-500 border-t border-slate-100 pt-3 mb-4">
              <span className="font-semibold">Notes: </span>{receipt.notes}
            </p>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center gap-2 my-5 py-5 border-t border-b border-slate-100">
            <QRCode
              value={`${LANDING_URL}/verify-receipt?r=${receipt.receiptNumber}`}
              size={110}
              bgColor="#ffffff"
              fgColor="#064e3b"
            />
            <p className="text-[10px] text-slate-400 text-center mt-1">
              Scan to verify authenticity
            </p>
            <p className="font-mono text-[10px] text-slate-400">{receipt.receiptNumber}</p>
          </div>

          <div className="flex justify-between items-end mt-4">
            <div>
              <p className="text-xs text-slate-400">Issued by</p>
              <p className="text-sm font-semibold text-slate-700">{managerName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">BOA AgriHub</p>
              <p className="text-xs text-slate-400">{new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, dark }: { label: string; value: string; dark?: boolean }) {
  return (
    <div className={`flex justify-between px-4 py-2.5 text-sm ${dark ? 'bg-slate-50' : 'bg-white'}`}>
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800 text-right max-w-[55%]">{value}</span>
    </div>
  );
}
