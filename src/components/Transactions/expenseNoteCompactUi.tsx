import React, { useEffect, useState } from 'react';
import { Check, ChevronDown, Loader2, ShoppingBasket, X } from 'lucide-react';
import { EXPENSE_NOTE_LOADING_LINES, SHOPPING_CATEGORY_SEEDS } from '../../constants/expenseNote';
import { expenseNoteParseHintText, lineDisplayAmount } from '../../utils/expenseNoteParser';
import { isAndroidApp } from '../../utils/platformDetection';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import type {
  ExpenseNoteCategory,
  ExpenseNoteEntrySummary,
  ExpenseNoteItem,
  ExpenseNoteItemDetail,
  ExpenseNoteParseStatus,
  ParsedExpenseNoteLine,
} from '../../types/expenseNote';

const slugLabel = Object.fromEntries(SHOPPING_CATEGORY_SEEDS.map((c) => [c.slug, c.name]));

export const EXPENSE_NOTE_SECTION_TITLE =
  'text-xs font-medium text-gray-500 dark:text-gray-400 uppercase leading-none m-0';
export const EXPENSE_NOTE_PANEL =
  'rounded-xl border border-gray-200 dark:border-gray-700 p-3 space-y-2 bg-white dark:bg-gray-900 min-w-0';
export const EXPENSE_NOTE_EMPTY =
  'text-xs text-gray-500 py-4 text-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg';
/** Desktop top row: Recent notes + Quick add share this body height. */
export const EXPENSE_NOTE_TOP_ROW_BODY = 'md:h-[12rem] md:min-h-[12rem] md:max-h-[12rem]';
export const EXPENSE_NOTE_TOP_ROW_PANEL = `${EXPENSE_NOTE_PANEL} h-full min-h-0 flex flex-col overflow-hidden`;
const EXPENSE_NOTE_CONTENT_PANEL = `${EXPENSE_NOTE_PANEL} flex flex-col min-w-0`;

export const ExpenseNoteLoadingCaption: React.FC<{ active: boolean; className?: string }> = ({
  active,
  className = '',
}) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    setIdx(0);
    const id = setInterval(() => setIdx((i) => (i + 1) % EXPENSE_NOTE_LOADING_LINES.length), 1400);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return null;
  return (
    <p
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}
    >
      <ShoppingBasket className="w-3.5 h-3.5 shrink-0 animate-bounce" aria-hidden />
      <span key={idx} className="animate-pulse">
        {EXPENSE_NOTE_LOADING_LINES[idx]}
      </span>
    </p>
  );
};

/** Section shell: optional mobile-only collapse; pass grid order via className. */
export const ExpenseNoteSection: React.FC<{
  title: string;
  className?: string;
  collapseOnMobile?: boolean;
  equalHeightDesktop?: boolean;
  titleInPanel?: boolean;
  panelClassName?: string;
  children: React.ReactNode;
}> = ({ title, className = '', collapseOnMobile, equalHeightDesktop, titleInPanel, panelClassName = '', children }) => {
  const [open, setOpen] = useState(false);
  const inPanel = equalHeightDesktop || titleInPanel;
  const panelCls = equalHeightDesktop
    ? `${EXPENSE_NOTE_TOP_ROW_PANEL} ${panelClassName}`.trim()
    : `${EXPENSE_NOTE_CONTENT_PANEL} ${panelClassName}`.trim();
  return (
    <section className={`min-w-0 flex flex-col ${inPanel ? '' : 'space-y-2'} ${className}`}>
      {collapseOnMobile ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden flex items-center justify-between gap-2 shrink-0 mb-2"
        >
          <span className={EXPENSE_NOTE_SECTION_TITLE}>{title}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      ) : null}
      {!inPanel ? <h2 className={`${EXPENSE_NOTE_SECTION_TITLE} shrink-0`}>{title}</h2> : null}
      <div
        className={`min-h-0 ${equalHeightDesktop ? EXPENSE_NOTE_TOP_ROW_BODY : 'flex-1'} ${collapseOnMobile && !open ? 'hidden md:block' : ''}`}
      >
        {inPanel ? (
          <div className={panelCls}>
            <h2 className={`${EXPENSE_NOTE_SECTION_TITLE} shrink-0 ${collapseOnMobile ? 'hidden md:block' : ''}`}>{title}</h2>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
};

const tableWrap = 'rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden min-w-0';
const tableScroll = 'overflow-x-auto overscroll-x-contain';
const tableMin = 'w-full min-w-[280px] text-xs';
const th = 'text-left align-middle px-2 py-1.5 font-medium text-gray-500 whitespace-nowrap';
const td = 'px-2 py-1.5 align-middle text-gray-800 dark:text-gray-200';
const priceDeltaClass = (delta: number | null | undefined) =>
  delta == null ? 'text-gray-400' : delta >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600';

export const ExpenseNoteParseHint: React.FC<{ lines: ParsedExpenseNoteLine[]; className?: string }> = ({
  lines,
  className = '',
}) => {
  const msg = expenseNoteParseHintText(lines);
  if (!msg) return null;
  return <p className={`text-xs text-amber-700 dark:text-amber-300 ${className}`.trim()}>{msg}</p>;
};

export const ExpenseNoteListPager: React.FC<{
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  onPage: (page: number) => void;
}> = ({ page, totalPages, total, start, end, onPage }) => {
  if (totalPages <= 1) return null;
  const btn =
    'px-2 py-0.5 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800';
  return (
    <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mt-2">
      <span>
        {start + 1}–{end} of {total}
      </span>
      <div className="flex gap-1">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Prev
        </button>
        <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

const parseRowClass = (s: ExpenseNoteParseStatus) =>
  s === 'failed'
    ? 'bg-red-50 dark:bg-red-900/20'
    : s === 'ambiguous'
      ? 'bg-amber-50 dark:bg-amber-900/20'
      : '';

export const ExpenseNoteParsedPreviewTable: React.FC<{
  lines: ParsedExpenseNoteLine[];
  lineTotal?: number;
}> = ({ lines, lineTotal }) => {
  if (!lines.length) return null;
  const hint = expenseNoteParseHintText(lines);
  return (
    <div className={tableWrap}>
      <div className={tableScroll}>
      <table className={tableMin}>
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className={th}>Item</th>
            <th className={th}>Category</th>
            <th className={`${th} text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, i) => (
            <tr key={i} className={`border-t border-gray-100 dark:border-gray-700 ${parseRowClass(line.parseStatus)}`}>
              <td className={td} title={line.parseStatus !== 'ok' ? line.nameRaw : undefined}>
                {line.name || line.nameRaw || '—'}
                {line.parseStatus === 'ambiguous' && <span className="text-amber-600 ml-0.5">?</span>}
              </td>
              <td className="px-2 py-1 text-gray-500">{slugLabel[line.categorySlug] || line.categorySlug}</td>
              <td className="px-2 py-1 text-right text-gray-600 dark:text-gray-400">
                {line.quantityExpr ||
                  (line.quantity != null ? `${line.quantity}${line.unit || ''} → ` : '')}
                {lineDisplayAmount(line) != null ? lineDisplayAmount(line)!.toLocaleString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {hint && (
        <p className="px-2 py-1 text-xs text-amber-700 dark:text-amber-300 border-t border-gray-200 dark:border-gray-600">
          {hint}
        </p>
      )}
      {lineTotal != null && lineTotal > 0 && (
        <div className="px-2 py-1 text-xs font-medium border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/30">
          Total: {lineTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      )}
    </div>
  );
};

export const ExpenseNoteRecentTable: React.FC<{
  entries: ExpenseNoteEntrySummary[];
  onOpenTransaction?: (transactionId: string) => void;
}> = ({ entries, onOpenTransaction }) => {
  if (!entries.length) return null;
  const sourceLabel = (s: string) =>
    s === 'transaction_note' ? 'Tx' : s === 'quick_add' ? 'Quick' : s;
  return (
    <div className={`${tableWrap} min-h-0 flex-1 overflow-y-auto`}>
      <div className={tableScroll}>
      <table className={tableMin}>
        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
          <tr>
            <th className={th}>Date</th>
            <th className={`${th} text-right`}>#</th>
            <th className={th}>Items</th>
            <th className={`${th} text-right`}>Src</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.id}
              className={`border-t border-gray-100 dark:border-gray-700 ${e.transactionId && onOpenTransaction ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer' : ''}`}
              onClick={() => e.transactionId && onOpenTransaction?.(e.transactionId)}
            >
              <td className={`${td} whitespace-nowrap`}>
                {e.entryDate
                  ? new Date(e.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                  : '—'}
              </td>
              <td className="px-2 py-1 text-right text-gray-500">{e.lineCount}</td>
              <td className="px-2 py-1 text-gray-600 dark:text-gray-400 max-w-[120px] sm:max-w-none truncate">{e.preview}</td>
              <td className="px-2 py-1 text-right text-gray-400">{sourceLabel(e.source)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export const ExpenseNoteItemsTable: React.FC<{
  items: ExpenseNoteItem[];
  onSelect: (id: string) => void;
}> = ({ items, onSelect }) => {
  if (!items.length) return null;
  return (
    <div className={`${tableWrap} mt-2.5 max-h-[min(55vh,420px)] md:max-h-[min(65vh,520px)] overflow-y-auto`}>
      <div className={tableScroll}>
      <table className={tableMin}>
        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
          <tr>
            <th className={th}>Item</th>
            <th className={th}>Category</th>
            <th className={`${th} text-right`}>Used</th>
            <th className={`${th} text-right`}>Price</th>
            <th className={`${th} text-right`}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() => onSelect(item.id)}
            >
              <td className={td}>{item.display_name}</td>
              <td className="px-2 py-1 text-gray-500">{item.category_name || '—'}</td>
              <td className="px-2 py-1 text-right text-gray-500">{item.usage_count}×</td>
              <td className="px-2 py-1 text-right text-gray-700 dark:text-gray-300">
                {item.last_price != null ? item.last_price.toLocaleString() : '—'}
              </td>
              <td className={`px-2 py-1 text-right ${priceDeltaClass(item.price_delta)}`}>
                {item.price_delta != null
                  ? `${item.price_delta >= 0 ? '+' : ''}${item.price_delta}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
};

const fieldClass =
  'w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5';
const modalIconBtn =
  'p-2 rounded-lg transition-colors disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800';

export const ExpenseNoteItemDetailPanel: React.FC<{
  detail: ExpenseNoteItemDetail;
  categories: ExpenseNoteCategory[];
  mergeCandidates?: { label: string; value: string }[];
  saving?: boolean;
  merging?: boolean;
  onSave: (patch: { displayName: string; categoryId: string }) => void | Promise<void>;
  onMerge?: (removeId: string) => void | Promise<void>;
  onOpenTransaction?: (transactionId: string) => void;
  onClose: () => void;
}> = ({ detail, categories, mergeCandidates, saving, merging, onSave, onMerge, onOpenTransaction, onClose }) => {
  const [displayName, setDisplayName] = useState(detail.item.display_name);
  const [categoryId, setCategoryId] = useState(detail.category?.id ?? categories[0]?.id ?? '');
  const [mergeInto, setMergeInto] = useState('');

  useEffect(() => {
    setDisplayName(detail.item.display_name);
    setCategoryId(detail.category?.id ?? categories[0]?.id ?? '');
    setMergeInto('');
  }, [detail.item.id, detail.item.display_name, detail.category?.id, categories]);

  const dirty =
    displayName.trim() !== detail.item.display_name ||
    categoryId !== (detail.category?.id ?? categories[0]?.id);

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center p-4 bg-black/40 ${isAndroidApp() ? 'items-center' : 'items-end sm:items-center'}`}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-xl p-4 w-full max-w-md max-h-[70vh] overflow-y-auto space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-base">Edit item</h3>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              aria-label="Save item"
              title="Save"
              disabled={saving || !dirty || !displayName.trim() || !categoryId}
              onClick={() => onSave({ displayName: displayName.trim(), categoryId })}
              className={`${modalIconBtn} text-white bg-gradient-primary hover:opacity-90`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button type="button" aria-label="Close" title="Close" onClick={onClose} className={`${modalIconBtn} text-gray-500`}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">Name</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-gray-500">Category</span>
          <CustomDropdown
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Select category"
            fullWidth
          />
        </label>
        <p className="text-xs text-gray-500">Updates your global list only; past transaction notes stay unchanged.</p>
        {mergeCandidates && mergeCandidates.length > 0 && onMerge && (
          <div className="flex flex-wrap gap-2 items-end">
            <label className="flex-1 min-w-[140px] space-y-1">
              <span className="text-xs text-gray-500">Merge duplicate into this item</span>
              <CustomDropdown
                options={mergeCandidates}
                value={mergeInto}
                onChange={setMergeInto}
                placeholder="Select item"
                fullWidth
              />
            </label>
            <button
              type="button"
              disabled={merging || !mergeInto}
              onClick={() => onMerge(mergeInto)}
              className="h-10 px-3 text-xs flex items-center justify-center shrink-0 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              {merging ? 'Merging…' : 'Merge'}
            </button>
          </div>
        )}
        {detail.observations.length > 0 && (
          <div className={`${tableWrap} max-h-40 overflow-y-auto`}>
            <table className={tableMin}>
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className={th}>Date</th>
                  <th className={`${th} text-right`}>Price</th>
                </tr>
              </thead>
              <tbody>
                {detail.observations.map((o, i) => {
                  const label = o.entry_date || new Date(o.observed_at).toLocaleDateString();
                  return (
                    <tr key={i} className="border-t border-gray-100 dark:border-gray-700">
                      <td className={td}>
                        {o.transaction_id && onOpenTransaction ? (
                          <button
                            type="button"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={() => onOpenTransaction(o.transaction_id!)}
                          >
                            {label}
                          </button>
                        ) : (
                          label
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        {o.price.toLocaleString()}
                        {o.delta_from_previous != null && (
                          <span className={`ml-1 ${priceDeltaClass(o.delta_from_previous)}`}>
                            ({o.delta_from_previous >= 0 ? '+' : ''}{o.delta_from_previous})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
