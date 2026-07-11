import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, ShoppingBasket, Trash2, X } from 'lucide-react';
import { EXPENSE_NOTE_LOADING_LINES, EXPENSE_NOTE_RAW_MAX, SHOPPING_CATEGORY_SEEDS } from '../../constants/expenseNote';
import { expenseNoteParseHintText, lineDisplayAmount } from '../../utils/expenseNoteParser';
import { applyExpenseNoteSuggestion, useExpenseNoteItemSuggestions, type ExpenseNoteSuggestItem } from '../../hooks/useExpenseNoteItemSuggestions';
import { isAndroidApp } from '../../utils/platformDetection';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import type {
  ExpenseNoteCategory,
  ExpenseNoteEntrySummary,
  ExpenseNoteFmtAmount,
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

export const ExpenseNoteLoadingCaption: React.FC<{
  active: boolean;
  className?: string;
  /** Shown when not loading (e.g. header subtitle). */
  children?: React.ReactNode;
}> = ({ active, className = '', children }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!active) return;
    setIdx(0);
    const id = setInterval(() => setIdx((i) => (i + 1) % EXPENSE_NOTE_LOADING_LINES.length), 1400);
    return () => clearInterval(id);
  }, [active]);
  if (!active) return children ? <>{children}</> : null;
  return (
    <span
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}
    >
      <ShoppingBasket className="w-3.5 h-3.5 shrink-0 animate-bounce" aria-hidden />
      <span key={idx} className="animate-pulse">
        {EXPENSE_NOTE_LOADING_LINES[idx]}
      </span>
    </span>
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
          className="md:hidden flex items-center justify-between gap-2 shrink-0 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left"
        >
          <span className="min-w-0">
            <span className="block text-xs font-medium text-gray-800 dark:text-gray-200">{title}</span>
            <span className="block text-[11px] text-gray-500 dark:text-gray-400">
              {open ? 'Tap to hide' : 'Tap to show notes from transactions'}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
            aria-hidden
          />
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
const fmtAmt = (n: number, fmt?: ExpenseNoteFmtAmount, currency?: string | null) =>
  fmt ? fmt(n, currency ?? undefined) : n.toLocaleString();

export const ExpenseNoteSuggestDropdown: React.FC<{
  suggestions: ExpenseNoteSuggestItem[];
  onPick: (name: string) => void;
}> = ({ suggestions, onPick }) => (
  <ul className="absolute left-0 right-0 top-full z-10 mt-1 max-h-36 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg">
    {suggestions.map((s) => (
      <li key={s.id}>
        <button
          type="button"
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(s.display_name);
          }}
        >
          {s.display_name}
          {s.category_name && <span className="text-gray-400 ml-1">· {s.category_name}</span>}
        </button>
      </li>
    ))}
  </ul>
);

/** Shared note textarea with per-user shopping-item suggestions (UI only; caller owns persistence). */
export const ExpenseNoteSuggestTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  userId?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  textareaClassName?: string;
  maxLength?: number;
  id?: string;
  name?: string;
  rows?: number;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
}> = ({
  value,
  onChange,
  userId,
  disabled,
  placeholder,
  className = '',
  textareaClassName = '',
  maxLength,
  id,
  name,
  rows,
  onBlur,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions, refresh, clear } = useExpenseNoteItemSuggestions(userId);
  const pick = (itemName: string) => {
    const el = textareaRef.current;
    const caret = el?.selectionStart ?? value.length;
    onChange(applyExpenseNoteSuggestion(value, caret, itemName));
    clear();
    setTimeout(() => el?.focus(), 0);
  };
  return (
    <div className={`relative ${className}`.trim()}>
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        onBlur={onBlur}
        onChange={(e) => {
          const v = e.target.value;
          if (maxLength != null && v.length > maxLength) return;
          onChange(v);
          refresh(v, e.target.selectionStart ?? v.length);
        }}
        onClick={(e) => refresh(value, e.currentTarget.selectionStart ?? 0)}
        onKeyUp={(e) => refresh(value, e.currentTarget.selectionStart ?? 0)}
        placeholder={placeholder}
        className={textareaClassName}
      />
      {suggestions.length > 0 && !disabled && <ExpenseNoteSuggestDropdown suggestions={suggestions} onPick={pick} />}
    </div>
  );
};

export const ExpenseNoteQuickAddField: React.FC<{
  value: string;
  onChange: (v: string) => void;
  userId?: string;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}> = (props) => (
  <ExpenseNoteSuggestTextarea
    {...props}
    maxLength={EXPENSE_NOTE_RAW_MAX}
    textareaClassName="w-full flex-1 min-h-[64px] md:min-h-0 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 resize-none"
  />
);

export const ExpenseNoteParseHint: React.FC<{ lines: ParsedExpenseNoteLine[]; className?: string }> = ({
  lines,
  className = '',
}) => {
  const msg = expenseNoteParseHintText(lines);
  if (!msg) return null;
  return <p className={`text-xs text-amber-700 dark:text-amber-300 ${className}`.trim()}>{msg}</p>;
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
  fmtAmount?: ExpenseNoteFmtAmount;
}> = ({ lines, lineTotal, fmtAmount }) => {
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
                {lineDisplayAmount(line) != null ? fmtAmt(lineDisplayAmount(line)!, fmtAmount) : '—'}
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
          Total: {fmtAmt(lineTotal, fmtAmount)}
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
  onMarkPurchased?: (item: ExpenseNoteItem) => void;
  markingId?: string | null;
  fmtAmount?: ExpenseNoteFmtAmount;
}> = ({ items, onSelect, onMarkPurchased, markingId, fmtAmount }) => {
  if (!items.length) return null;
  return (
    <div className={`${tableWrap} mt-2.5 max-h-[min(55vh,420px)] md:max-h-[min(65vh,520px)] overflow-y-auto`}>
      <div className={tableScroll}>
      <table className={tableMin}>
        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0">
          <tr>
            {onMarkPurchased && <th className={`${th} w-8`} />}
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
              className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              {onMarkPurchased && (
                <td className="px-1 py-1 align-middle">
                  <button
                    type="button"
                    title="Mark purchased"
                    disabled={markingId === item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkPurchased(item);
                    }}
                    className="p-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-40"
                  >
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </button>
                </td>
              )}
              <td className={`${td} cursor-pointer`} onClick={() => onSelect(item.id)}>{item.display_name}</td>
              <td className="px-2 py-1 text-gray-500 cursor-pointer" onClick={() => onSelect(item.id)}>{item.category_name || '—'}</td>
              <td className="px-2 py-1 text-right text-gray-500 cursor-pointer" onClick={() => onSelect(item.id)}>{item.usage_count}×</td>
              <td className="px-2 py-1 text-right text-gray-700 dark:text-gray-300 cursor-pointer" onClick={() => onSelect(item.id)}>
                {item.last_price != null ? fmtAmt(item.last_price, fmtAmount, item.last_price_currency) : '—'}
              </td>
              <td className={`px-2 py-1 text-right cursor-pointer ${priceDeltaClass(item.price_delta)}`} onClick={() => onSelect(item.id)}>
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
  deleting?: boolean;
  onSave: (patch: { displayName: string; categoryId: string }) => void | Promise<void>;
  onMerge?: (removeId: string) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  onOpenTransaction?: (transactionId: string) => void;
  onClose: () => void;
  fmtAmount?: ExpenseNoteFmtAmount;
}> = ({ detail, categories, mergeCandidates, saving, merging, deleting, onSave, onMerge, onDelete, onOpenTransaction, onClose, fmtAmount }) => {
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
        {onDelete && (
          <button
            type="button"
            disabled={deleting || saving || merging}
            onClick={onDelete}
            className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleting ? 'Deleting…' : 'Delete item'}
          </button>
        )}
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
                        {fmtAmt(o.price, fmtAmount, o.currency)}
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
