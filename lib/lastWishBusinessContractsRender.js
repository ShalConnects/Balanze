import { getEffectivePrincipal } from './businessInvestmentStats.js';

const BIZ_ENTRY_LABELS = {
  profit: 'Profit',
  loss: 'Loss',
  principal_return: 'Principal returned',
  capital_contribution: 'Capital contribution'
};

function htmlEsc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** @param {Array} contracts @param {(n: number, c?: string) => string} formatCurrencyWithSymbol */
export function renderBusinessInvestmentContractsHtml(contracts, formatCurrencyWithSymbol, dark = false) {
  if (!contracts?.length) return '';
  const cardBg = dark ? '#1f2937' : '#f9fafb';
  const border = dark ? '#374151' : '#e5e7eb';
  const sub = dark ? '#9ca3af' : '#6b7280';
  const fd = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A');
  return contracts.map((c) => {
    const cur = c.currency || 'USD';
    const pr = getEffectivePrincipal(c);
    const rows = (c.entries || []).slice(0, 20).map((e) =>
      `<tr><td style="padding:4px 8px;border-bottom:1px solid ${border};">${htmlEsc(BIZ_ENTRY_LABELS[e.type] || e.type || '')}</td>` +
      `<td style="padding:4px 8px;border-bottom:1px solid ${border};">${fd(e.date)}</td>` +
      `<td style="padding:4px 8px;border-bottom:1px solid ${border};">${formatCurrencyWithSymbol(parseFloat(e.amount) || 0, cur)}</td>` +
      `<td style="padding:4px 8px;border-bottom:1px solid ${border};">${htmlEsc((e.note || '').slice(0, 48))}</td></tr>`
    ).join('');
    const status = c.status ? ` · ${htmlEsc(c.status)}` : '';
    return `<div style="background:${cardBg};border:1px solid ${border};border-radius:8px;padding:14px;margin-bottom:14px;">` +
      `<div style="font-weight:600;margin-bottom:8px;">${htmlEsc(c.title)}${status}</div>` +
      `<div style="font-size:13px;color:${sub};">Principal: ${formatCurrencyWithSymbol(pr, cur)}` +
      (c.funding_account_name ? ` · Funding: ${htmlEsc(c.funding_account_name)}` : '') +
      `</div>` +
      `<div style="font-size:13px;color:${sub};margin-top:4px;">${fd(c.start_date)}${c.end_date ? ` – ${fd(c.end_date)}` : ''}</div>` +
      (c.note ? `<p style="font-size:13px;color:${sub};margin:8px 0 0 0;">${htmlEsc(c.note)}</p>` : '') +
      (rows ? `<table style="width:100%;margin-top:10px;font-size:12px;border-collapse:collapse;"><thead><tr>` +
        `<th style="text-align:left;padding:4px 8px;">Type</th><th style="text-align:left;">Date</th><th style="text-align:left;">Amount</th><th style="text-align:left;">Note</th></tr></thead><tbody>${rows}</tbody></table>` : '') +
      `</div>`;
  }).join('');
}

export { BIZ_ENTRY_LABELS };
