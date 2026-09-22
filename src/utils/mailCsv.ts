/** Minimal CSV helpers for mail contacts / campaign export. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

function cell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  return [headers.join(','), ...rows.map((r) => headers.map((h) => cell(r[h])).join(','))].join('\n');
}

export function downloadCsv(filename: string, headers: string[], rows: Record<string, unknown>[]): void {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

export type CsvSkip = { row: number; email: string; reason: 'invalid' | 'duplicate' };

export type ParsedCsvRow = { email: string; name: string | null };

/** Parse email CSV (`email` + optional `name`). Preserves row order. */
export function parseEmailCsv(text: string): {
  rows: ParsedCsvRow[];
  skips: CsvSkip[];
  total_rows: number;
} {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { rows: [], skips: [], total_rows: 0 };

  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (q && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else q = !q;
      } else if (c === ',' && !q) {
        out.push(cur);
        cur = '';
      } else cur += c;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };

  const header = split(lines[0]).map((h) => h.toLowerCase());
  const emailIdx = Math.max(0, header.findIndex((h) => h === 'email'));
  const nameIdx = header.findIndex((h) => h === 'name');
  const dataLines = header.includes('email') || header.includes('name') ? lines.slice(1) : lines;

  const seen = new Set<string>();
  const rows: ParsedCsvRow[] = [];
  const skips: CsvSkip[] = [];

  dataLines.forEach((line, i) => {
    const cols = split(line);
    const email = normalizeEmail(cols[emailIdx] || cols[0] || '');
    const name = (nameIdx >= 0 ? cols[nameIdx] : '')?.trim() || null;
    const rowNum = i + (dataLines === lines ? 1 : 2);
    if (!email || !isValidEmail(email)) {
      skips.push({ row: rowNum, email, reason: 'invalid' });
      return;
    }
    if (seen.has(email)) {
      skips.push({ row: rowNum, email, reason: 'duplicate' });
      return;
    }
    seen.add(email);
    rows.push({ email, name });
  });

  return { rows, skips, total_rows: dataLines.length };
}
