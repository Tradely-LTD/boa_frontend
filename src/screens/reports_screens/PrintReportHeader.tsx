interface Props {
  title: string;
  subtitle: string;
}

export default function PrintReportHeader({ title, subtitle }: Props) {
  return (
    <>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 0.8cm; size: A4 portrait; }
          .print\\:hidden { display: none !important; }
          .print-header { display: flex !important; }
          body { font-size: 9px; }
        }
        .print-header { display: none; }
      `}</style>
      <div
        className="print-header items-center justify-between mb-4 rounded-xl overflow-hidden"
        style={{ background: '#166534', color: '#fff', padding: '14px 20px', printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 'bold' }}>Bank of Agriculture — AgriHub</div>
          <div style={{ fontSize: 8, opacity: 0.8, marginTop: 2 }}>Federal Republic of Nigeria</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 8, opacity: 0.85 }}>
          <div style={{ fontWeight: 'bold', fontSize: 11 }}>{title}</div>
          <div style={{ marginTop: 2 }}>{subtitle}</div>
        </div>
      </div>
    </>
  );
}
