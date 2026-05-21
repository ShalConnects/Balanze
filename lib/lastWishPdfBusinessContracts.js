import { BIZ_ENTRY_LABELS } from './lastWishBusinessContractsRender.js';

/** Per-contract blocks + entry tables for Last Wish PDF (PDFKit). */
export function drawBusinessContractDetails(doc, contracts, { formatCurrency, formatDate, drawTable, addPageWithHeader }) {
  if (!contracts?.length) return;
  const pageBottom = doc.page.height - 100;
  const ensureSpace = (h) => {
    if (doc.y + h > pageBottom) {
      addPageWithHeader();
      doc.y = 80;
    }
  };

  for (const c of contracts) {
    const cur = c.currency || 'USD';
    const pr = parseFloat(c.principal) || 0;
    ensureSpace(72);
    doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold')
      .text(String(c.title || 'Contract'), 50, doc.y, { width: doc.page.width - 100 });
    doc.moveDown(0.35);
    doc.fillColor('#374151').fontSize(10).font('Helvetica')
      .text(
        `Principal: ${formatCurrency(pr, cur)}${c.funding_account_name ? ` · Funding: ${c.funding_account_name}` : ''}${c.status ? ` · ${c.status}` : ''}`,
        50,
        doc.y,
        { width: doc.page.width - 100 }
      );
    doc.moveDown(0.3);
    const range = [c.start_date ? formatDate(c.start_date) : 'N/A', c.end_date ? formatDate(c.end_date) : null].filter(Boolean).join(' – ');
    if (range) {
      doc.text(range, 50, doc.y, { width: doc.page.width - 100 });
      doc.moveDown(0.3);
    }
    if (c.note) {
      doc.text(String(c.note).slice(0, 200), 50, doc.y, { width: doc.page.width - 100 });
      doc.moveDown(0.5);
    }
    const entries = c.entries || [];
    if (entries.length) {
      ensureSpace(60);
      const rows = entries.map((e) => [
        BIZ_ENTRY_LABELS[e.type] || e.type || '',
        e.date ? formatDate(e.date) : 'N/A',
        formatCurrency(parseFloat(e.amount) || 0, cur),
        (e.note || '').substring(0, 28) || 'N/A'
      ]);
      drawTable(['Type', 'Date', 'Amount', 'Note'], rows, doc.y, {
        columnWidths: [0.22, 0.18, 0.22, 0.38].map((w) => (doc.page.width - 100) * w),
        fontSize: 8
      });
    }
    doc.moveDown(0.8);
  }
}
