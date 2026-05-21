import { detectCategorySlug } from './shoppingCategory';
import type { ParsedExpenseNoteLine } from '../types/expenseNote';

const FORMULA_TAIL = /^(.+?)\s+(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/i;
const UNIT_PRICE = /^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|lb|pcs|pc|dozen)\s+(\d+(?:\.\d+)?)$/i;
const QTY_TOTAL = /^(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)$/;
const AMOUNT_TAIL = /^(.+?)\s+(\d+(?:\.\d+)?)$/;

export function normalizeExpenseItemName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Strip trailing dash placeholders (e.g. "Guava -"). */
export function cleanItemName(name: string): string {
  return name.replace(/\s*-\s*$/g, '').trim();
}

function splitSpacePriceList(raw: string): string[] {
  const parts: string[] = [];
  const re = /(.+?)\s+(\d+(?:\.\d+)?)(?=\s+|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw.trim()))) parts.push(`${m[1].trim()} ${m[2]}`);
  return parts.length >= 2 ? parts : [];
}

export function splitNoteSegments(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  if (t.includes(',')) return t.split(',').map((s) => s.trim()).filter(Boolean);
  const space = splitSpacePriceList(t);
  return space.length >= 2 ? space : [t];
}

function baseLine(nameRaw: string, partial: Partial<ParsedExpenseNoteLine>): ParsedExpenseNoteLine {
  const name = cleanItemName(partial.name ?? nameRaw);
  return {
    name,
    nameRaw,
    quantity: null,
    unit: null,
    lineTotal: null,
    quantityExpr: null,
    amountComputed: null,
    categorySlug: detectCategorySlug(name),
    parseStatus: 'ambiguous',
    ...partial,
  };
}

export function parseExpenseNoteSegment(segment: string): ParsedExpenseNoteLine {
  const nameRaw = segment.trim();
  if (!nameRaw) {
    return baseLine('', { name: '', parseStatus: 'failed' });
  }

  const formula = nameRaw.match(FORMULA_TAIL);
  if (formula) {
    const q1 = parseFloat(formula[2]);
    const q2 = parseFloat(formula[3]);
    const name = cleanItemName(formula[1].trim());
    const total = Number.isFinite(q1 * q2) ? q1 * q2 : null;
    return baseLine(nameRaw, {
      name,
      quantityExpr: `${formula[2]}x${formula[3]}`,
      amountComputed: total,
      lineTotal: total,
      parseStatus: name ? 'ok' : 'ambiguous',
    });
  }

  const unitMatch = nameRaw.match(UNIT_PRICE);
  if (unitMatch) {
    const name = cleanItemName(unitMatch[1].trim());
    const qty = parseFloat(unitMatch[2]);
    const total = parseFloat(unitMatch[4]);
    return baseLine(nameRaw, {
      name,
      quantity: Number.isFinite(qty) ? qty : null,
      unit: unitMatch[3].toLowerCase(),
      lineTotal: Number.isFinite(total) ? total : null,
      parseStatus: name ? 'ok' : 'ambiguous',
    });
  }

  const qtyTotal = nameRaw.match(QTY_TOTAL);
  if (qtyTotal) {
    const name = cleanItemName(qtyTotal[1].trim());
    const qty = parseFloat(qtyTotal[2]);
    const total = parseFloat(qtyTotal[3]);
    return baseLine(nameRaw, {
      name,
      quantity: Number.isFinite(qty) ? qty : null,
      lineTotal: Number.isFinite(total) ? total : null,
      parseStatus: name ? 'ok' : 'ambiguous',
    });
  }

  const amount = nameRaw.match(AMOUNT_TAIL);
  if (amount) {
    const n = parseFloat(amount[2]);
    const name = cleanItemName(amount[1].trim());
    return baseLine(nameRaw, {
      name,
      lineTotal: Number.isFinite(n) ? n : null,
      parseStatus: name ? 'ok' : 'ambiguous',
    });
  }

  return baseLine(nameRaw, { name: cleanItemName(nameRaw), parseStatus: 'ambiguous' });
}

export function parseExpenseNoteText(raw: string): ParsedExpenseNoteLine[] {
  return splitNoteSegments(raw).map(parseExpenseNoteSegment).filter((l) => l.nameRaw.length > 0);
}

export function lineDisplayAmount(line: ParsedExpenseNoteLine): number | null {
  if (line.lineTotal != null) return line.lineTotal;
  return line.amountComputed;
}

export function sumExpenseNoteLines(lines: ParsedExpenseNoteLine[]): number {
  return lines.reduce((sum, l) => sum + (lineDisplayAmount(l) ?? 0), 0);
}

export function buildExpenseNoteSummary(lines: ParsedExpenseNoteLine[]): string {
  if (!lines.length) return '';
  const total = sumExpenseNoteLines(lines);
  const names = lines
    .slice(0, 4)
    .map((l) => l.name)
    .filter(Boolean)
    .join(', ');
  const more = lines.length > 4 ? ` +${lines.length - 4} more` : '';
  const totalPart = total > 0 ? ` · ${total.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '';
  let out = `${lines.length} items: ${names}${more}${totalPart}`;
  if (out.length > 500) out = out.slice(0, 497) + '…';
  return out;
}

export function expenseNoteParseIssues(lines: ParsedExpenseNoteLine[]) {
  let failed = 0;
  let ambiguous = 0;
  for (const l of lines) {
    if (l.parseStatus === 'failed') failed++;
    else if (l.parseStatus === 'ambiguous') ambiguous++;
  }
  return { failed, ambiguous };
}

export function expenseNoteParseHintText(lines: ParsedExpenseNoteLine[]): string | null {
  const { failed, ambiguous } = expenseNoteParseIssues(lines);
  if (!failed && !ambiguous) return null;
  return `${failed > 0 ? `${failed} line(s) could not be parsed. ` : ''}${ambiguous > 0 ? `${ambiguous} line(s) may need review.` : ''}`.trim();
}

export function getActiveExpenseNoteSegment(raw: string, caret: number): string {
  const before = raw.slice(0, caret);
  const lastComma = before.lastIndexOf(',');
  return before.slice(lastComma + 1);
}

/** Skip generated summaries and prose; allow comma lists and name+price patterns. */
export function looksLikeItemListNote(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return false;
  if (/^\d+\s+items?\s*:/i.test(t)) return false;
  if (t.includes(',')) return true;
  if (splitSpacePriceList(t).length >= 2) return true; // space-separated name+price list
  return /\s\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?\s*$/i.test(t) || /\s\d+(?:\.\d+)?\s+\d+(?:\.\d+)?\s*$/.test(t);
}
