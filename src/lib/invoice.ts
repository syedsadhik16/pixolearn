// Invoice generation utility for PIXO Learn

export interface InvoiceData {
  invoiceNumber: string;
  parentName: string;
  learnerName: string;
  email: string;
  selectedPlan: string;
  selectedLevels: string;
  amountPaid: number;
  currency: string;
  paymentId: string;
  orderId: string;
  paymentDate: string;
  subscriptionStart: string;
  subscriptionExpiry: string;
  status: string;
}

export function generateInvoiceNumber(paymentId: string): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const suffix = paymentId.slice(-6).toUpperCase();
  return `PIXO-${y}${m}-${suffix}`;
}

export function buildInvoiceData(params: {
  parentName: string;
  learnerName: string;
  email: string;
  selectedPlan: string;
  selectedLevels: string;
  amountPaid: number;
  currency: string;
  paymentId: string;
  orderId: string;
  paidAt: string;
  startDate: string;
  expiryDate: string;
}): InvoiceData {
  return {
    invoiceNumber: generateInvoiceNumber(params.paymentId),
    parentName: params.parentName,
    learnerName: params.learnerName,
    email: params.email,
    selectedPlan: params.selectedPlan,
    selectedLevels: params.selectedLevels,
    amountPaid: params.amountPaid,
    currency: params.currency || 'INR',
    paymentId: params.paymentId,
    orderId: params.orderId,
    paymentDate: params.paidAt,
    subscriptionStart: params.startDate,
    subscriptionExpiry: params.expiryDate,
    status: 'Paid',
  };
}

export function downloadInvoicePDF(data: InvoiceData): void {
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch {
      return d;
    }
  };

  const subtotal = data.amountPaid;
  const gstRate = 18;
  const gstAmount = Math.round((subtotal * gstRate) / (100 + gstRate));
  const baseAmount = subtotal - gstAmount;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PIXO Learn Invoice - ${data.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #6c5ce7; padding-bottom: 20px; }
    .brand { display: flex; flex-direction: column; gap: 4px; }
    .brand h1 { font-size: 28px; color: #6c5ce7; font-weight: 800; }
    .brand .tagline { color: #636e72; font-size: 12px; font-style: italic; }
    .brand .org-line { color: #636e72; font-size: 11px; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 22px; color: #2d3436; }
    .invoice-meta p { color: #636e72; font-size: 13px; margin-top: 4px; }
    .section { margin-bottom: 24px; }
    .section-title { font-size: 13px; text-transform: uppercase; color: #6c5ce7; font-weight: 700; margin-bottom: 10px; letter-spacing: 1px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 12px; border-radius: 6px; background: #f8f9fa; }
    .detail-row:nth-child(even) { background: #fff; }
    .detail-label { color: #636e72; font-size: 13px; }
    .detail-value { font-weight: 600; font-size: 13px; }
    .amount-box { background: linear-gradient(135deg, #6c5ce7, #a29bfe); color: white; padding: 20px; border-radius: 12px; text-align: center; margin: 24px 0; }
    .amount-box .amount { font-size: 32px; font-weight: 800; }
    .amount-box .label { font-size: 12px; opacity: 0.9; margin-top: 4px; }
    .tax-section { margin: 16px 0; }
    .tax-row { display: flex; justify-content: space-between; padding: 6px 12px; font-size: 13px; }
    .tax-row.total { font-weight: 700; font-size: 14px; border-top: 2px solid #ddd; padding-top: 10px; margin-top: 6px; }
    .status-badge { display: inline-block; background: #00b894; color: white; padding: 4px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #b2bec3; font-size: 11px; }
    .footer p { margin-bottom: 4px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>PIXO Learn</h1>
      <p class="tagline">Energy. Learn. Grow.</p>
      <p class="org-line">AI-Powered English Learning Platform</p>
    </div>
    <div class="invoice-meta">
      <h2>INVOICE</h2>
      <p>${data.invoiceNumber}</p>
      <p>${formatDate(data.paymentDate)}</p>
      <p><span class="status-badge">${data.status}</span></p>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Account Details</div>
    <div class="detail-row"><span class="detail-label">Account Holder (Parent)</span><span class="detail-value">${data.parentName || 'N/A'}</span></div>
    <div class="detail-row"><span class="detail-label">Learner Name</span><span class="detail-value">${data.learnerName || 'N/A'}</span></div>
    <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${data.email}</span></div>
  </div>

  <div class="section">
    <div class="section-title">Subscription Details</div>
    <div class="detail-row"><span class="detail-label">Plan</span><span class="detail-value">${data.selectedPlan}</span></div>
    <div class="detail-row"><span class="detail-label">Levels Included</span><span class="detail-value">${data.selectedLevels}</span></div>
    <div class="detail-row"><span class="detail-label">Start Date</span><span class="detail-value">${formatDate(data.subscriptionStart)}</span></div>
    <div class="detail-row"><span class="detail-label">Expiry Date</span><span class="detail-value">${formatDate(data.subscriptionExpiry)}</span></div>
  </div>

  <div class="section tax-section">
    <div class="section-title">Amount Breakdown</div>
    <div class="tax-row"><span>Base Amount</span><span>₹${baseAmount.toLocaleString('en-IN')}</span></div>
    <div class="tax-row"><span>GST (${gstRate}% inclusive)</span><span>₹${gstAmount.toLocaleString('en-IN')}</span></div>
    <div class="tax-row total"><span>Total Amount Paid</span><span>₹${data.amountPaid.toLocaleString('en-IN')}</span></div>
  </div>

  <div class="amount-box">
    <div class="amount">₹${data.amountPaid.toLocaleString('en-IN')}</div>
    <div class="label">Total Amount Paid (${data.currency})</div>
  </div>

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div class="detail-row"><span class="detail-label">Payment ID</span><span class="detail-value">${data.paymentId}</span></div>
    <div class="detail-row"><span class="detail-label">Order ID</span><span class="detail-value">${data.orderId}</span></div>
    <div class="detail-row"><span class="detail-label">Payment Date</span><span class="detail-value">${formatDate(data.paymentDate)}</span></div>
    <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${data.status}</span></div>
  </div>

  <div class="footer">
    <p>This is a computer-generated invoice and does not require a signature.</p>
    <p><strong>PIXO Learn</strong> — Energy. Learn. Grow.</p>
    <p>For support: support@pixolearn.com</p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
}
