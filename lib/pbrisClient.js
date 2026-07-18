import { normalizeAsciiDigits } from './prizeBondShared.js';

const PBRIS_URL = 'https://prizebond.ird.gov.bd/hybrid_action_b2e.php';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function bondDigits(raw) {
  return normalizeAsciiDigits(raw).replace(/\D/g, '');
}

function parseTableRows(html) {
  const results = [];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  while ((rowMatch = rowRe.exec(html))) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripTags(m[1]));
    const bond_number = bondDigits(cells[0] || '');
    if (cells.length >= 4 && /^\d{7}$/.test(bond_number)) {
      const prize_amount = Number(normalizeAsciiDigits(cells[2] || '0').replace(/[^\d.]/g, '')) || 0;
      results.push({
        bond_number,
        prize_tier: cells[1] || '',
        prize_amount,
        draw_date: normalizeAsciiDigits(cells[3] || '').trim(),
        series: cells[4] || undefined,
      });
    }
  }
  return results;
}

export async function checkBondsWithPbris(bondNumbers) {
  if (!bondNumbers?.length) return [];
  const body = new URLSearchParams({ from: bondNumbers.join(',') });
  const res = await fetch(PBRIS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': UA,
      Accept: 'text/html',
    },
    body,
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`PBRIS_HTTP_${res.status}`);
  const html = await res.text();
  if (html.includes('ম্যাচ করেনি')) return [];
  return parseTableRows(html);
}

export function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}
