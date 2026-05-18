export interface ReceiptLine {
  label: string;
  value: string | null | undefined;
  bold?: boolean;
}

export interface ReceiptData {
  title: string;
  receiptNumber: string;
  date: string;
  lines: ReceiptLine[];
  buyerName?: string | null;
  buyerPhone?: string | null;
  buyerNin?: string | null;
  notes?: string | null;
}

export function printReceipt(data: ReceiptData) {
  const row = (l: ReceiptLine) =>
    l.value
      ? `<tr>
           <td style="padding:5px 8px;color:#555;font-size:13px;">${l.label}</td>
           <td style="padding:5px 8px;font-size:13px;${l.bold ? 'font-weight:700;' : ''}">${l.value}</td>
         </tr>`
      : '';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${data.receiptNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; background: #fff; color: #111; }
    .page { max-width: 360px; margin: 0 auto; padding: 24px 16px; }
    .header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 14px; margin-bottom: 14px; }
    .header h1 { font-size: 18px; letter-spacing: 1px; }
    .header p { font-size: 12px; color: #555; margin-top: 4px; }
    .ref { font-size: 11px; color: #888; margin-top: 6px; letter-spacing: 1px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888;
                     padding: 8px 8px 4px; border-top: 1px dashed #ddd; margin-top: 4px; }
    .total-row td { font-size: 15px; font-weight: 700; padding: 8px; border-top: 2px dashed #ccc; }
    .footer { text-align: center; font-size: 11px; color: #888; border-top: 1px dashed #ccc;
              padding-top: 12px; margin-top: 8px; }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1>BOA AgriHub</h1>
      <p>${data.title}</p>
      <p class="ref">${data.receiptNumber}</p>
      <p class="ref">${data.date}</p>
    </div>

    <div class="section-title">Transaction</div>
    <table>
      ${data.lines.map(row).join('')}
    </table>

    ${data.buyerName || data.buyerPhone || data.buyerNin ? `
    <div class="section-title">Buyer</div>
    <table>
      ${data.buyerName  ? `<tr><td style="padding:5px 8px;color:#555;font-size:13px;">Name</td><td style="padding:5px 8px;font-size:13px;">${data.buyerName}</td></tr>` : ''}
      ${data.buyerPhone ? `<tr><td style="padding:5px 8px;color:#555;font-size:13px;">Phone</td><td style="padding:5px 8px;font-size:13px;">${data.buyerPhone}</td></tr>` : ''}
      ${data.buyerNin   ? `<tr><td style="padding:5px 8px;color:#555;font-size:13px;">NIN</td><td style="padding:5px 8px;font-size:13px;">${data.buyerNin}</td></tr>` : ''}
    </table>` : ''}

    ${data.notes ? `<div class="section-title">Notes</div><p style="padding:6px 8px;font-size:13px;">${data.notes}</p>` : ''}

    <div class="footer">
      <p>Thank you for your business!</p>
      <p style="margin-top:4px;">BOA AgriHub &mdash; Powered by Agriculture</p>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }</script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=650');
  if (!win) return;
  win.document.write(html);
  win.document.close();
}
