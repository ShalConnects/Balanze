import { supabase } from './supabase';
import { EXPENSE_NOTE_AUTOCOMPLETE_LIMIT, SHOPPING_CATEGORY_SEEDS } from '../constants/expenseNote';
import { isLikelySameItem } from '../utils/itemNameMerge';
import { getShoppingFrequencyDays } from '../utils/shoppingFrequencyPrefs';
import { countDueShoppingItems } from '../utils/shoppingSuggestions';
import { getShoppingListCache, setShoppingDueCount } from '../utils/shoppingListCache';
import {
  buildExpenseNoteSummary,
  lineDisplayAmount,
  looksLikeItemListNote,
  normalizeExpenseItemName,
  parseExpenseNoteText,
} from '../utils/expenseNoteParser';
import { detectCategorySlug } from '../utils/shoppingCategory';
import type {
  ExpenseNoteCategory,
  ExpenseNoteDocumentPayload,
  ExpenseNoteDocumentView,
  ExpenseNoteItem,
  ExpenseNoteEntrySummary,
  ExpenseNoteItemDetail,
  ParsedExpenseNoteLine,
} from '../types/expenseNote';

const rawTextByTx = new Map<string, string | null>();
const categoriesByUser = new Map<string, ExpenseNoteCategory[]>();

const setRawTextCache = (transactionId: string, raw: string | null) => rawTextByTx.set(transactionId, raw);

async function ensureCategories(userId: string): Promise<ExpenseNoteCategory[]> {
  const cached = categoriesByUser.get(userId);
  if (cached) return cached;

  const { data: existing } = await supabase
    .from('expense_note_categories')
    .select('id, slug, name, sort_order')
    .eq('user_id', userId)
    .order('sort_order');
  if (existing?.length) {
    categoriesByUser.set(userId, existing);
    return existing;
  }

  const rows = SHOPPING_CATEGORY_SEEDS.map((c) => ({ user_id: userId, ...c, is_system: true }));
  const { data, error } = await supabase.from('expense_note_categories').insert(rows).select('id, slug, name, sort_order');
  if (error) throw error;
  const cats = data || [];
  categoriesByUser.set(userId, cats);
  return cats;
}

async function categoryIdBySlug(userId: string, slug: string): Promise<string | null> {
  const cats = await ensureCategories(userId);
  return cats.find((c) => c.slug === slug)?.id ?? null;
}

async function findItemByNormOrAlias(userId: string, norm: string) {
  const { data: alias } = await supabase
    .from('expense_note_item_aliases')
    .select('item_id')
    .eq('user_id', userId)
    .eq('alias_normalized', norm)
    .maybeSingle();
  if (alias?.item_id) {
    const { data } = await supabase.from('expense_note_items').select('id, usage_count, display_name, category_id, category_source, name_normalized').eq('id', alias.item_id).maybeSingle();
    if (data) return data;
  }
  const { data: exact } = await supabase
    .from('expense_note_items')
    .select('id, usage_count, display_name, category_id, category_source, name_normalized')
    .eq('user_id', userId)
    .eq('name_normalized', norm)
    .maybeSingle();
  if (exact) return exact;

  const prefix = norm.slice(0, Math.min(3, norm.length));
  if (prefix.length < 2) return null;
  const { data: candidates } = await supabase
    .from('expense_note_items')
    .select('id, usage_count, display_name, category_id, category_source, name_normalized')
    .eq('user_id', userId)
    .like('name_normalized', `${prefix}%`)
    .limit(40);
  return (candidates || []).find((c) => isLikelySameItem(norm, c.name_normalized)) ?? null;
}

async function resolveNoteCurrency(userId: string, transactionId?: string): Promise<string> {
  if (transactionId) {
    const { data: tx } = await supabase
      .from('transactions')
      .select('account_id')
      .eq('id', transactionId)
      .eq('user_id', userId)
      .maybeSingle();
    if (tx?.account_id) {
      const { data: acc } = await supabase
        .from('accounts')
        .select('currency')
        .eq('id', tx.account_id)
        .maybeSingle();
      if (acc?.currency) return acc.currency;
    }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('local_currency')
    .eq('id', userId)
    .maybeSingle();
  return profile?.local_currency || 'USD';
}

function pricePatch(line: ParsedExpenseNoteLine, currency: string, observedAt: string) {
  const price = lineDisplayAmount(line);
  return price != null
    ? { last_price: price, last_price_currency: currency, last_purchased_at: observedAt }
    : {};
}

/** Resolve catalog item; `isNew` means this call created it (already counted as 1×). */
async function resolveItemId(
  userId: string,
  line: ParsedExpenseNoteLine,
  currency: string
): Promise<{ id: string; isNew: boolean } | null> {
  const norm = normalizeExpenseItemName(line.name);
  if (!norm) return null;
  const display = line.name.trim() || line.nameRaw.trim();
  const existing = await findItemByNormOrAlias(userId, norm);

  if (existing?.id) {
    if (norm !== existing.name_normalized) {
      await supabase.from('expense_note_item_aliases').upsert(
        { user_id: userId, item_id: existing.id, alias_normalized: norm },
        { onConflict: 'user_id,alias_normalized' }
      );
    }
    return { id: existing.id, isNew: false };
  }

  const catId = await categoryIdBySlug(userId, line.categorySlug || detectCategorySlug(display));
  const price = lineDisplayAmount(line);
  const { data, error } = await supabase
    .from('expense_note_items')
    .insert({
      user_id: userId,
      name_normalized: norm,
      display_name: display,
      category_id: catId,
      category_source: 'auto',
      usage_count: 1,
      last_used_at: new Date().toISOString(),
      last_price: price,
      last_price_currency: price != null ? currency : null,
      last_purchased_at: price != null ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data?.id ? { id: data.id, isNew: true } : null;
}

function lineInsertRow(
  documentId: string,
  sortOrder: number,
  line: ParsedExpenseNoteLine,
  itemId: string | null,
  observedAt: string,
  currency: string
) {
  return {
    document_id: documentId,
    item_id: itemId,
    sort_order: sortOrder,
    name_raw: line.nameRaw,
    item_name: line.name,
    quantity: line.quantity,
    unit: line.unit,
    line_total: line.lineTotal ?? line.amountComputed,
    amount: line.lineTotal,
    quantity_expr: line.quantityExpr,
    amount_computed: line.amountComputed,
    parse_status: line.parseStatus,
    purchased_at: observedAt,
    currency,
  };
}

async function bumpItemUsage(
  userId: string,
  itemId: string,
  opts: {
    observedAt: string;
    lastPrice?: number | null;
    lastPriceCurrency?: string | null;
    setPurchased?: boolean;
  }
) {
  const patch = {
    last_used_at: opts.observedAt,
    ...(opts.lastPrice != null
      ? {
          last_price: opts.lastPrice,
          last_price_currency: opts.lastPriceCurrency ?? null,
          last_purchased_at: opts.observedAt,
        }
      : {}),
    ...(opts.setPurchased ? { last_purchased_at: opts.observedAt } : {}),
  };

  const { data, error } = await supabase.rpc('bump_expense_note_item_usage', {
    p_user_id: userId,
    p_item_id: itemId,
    p_observed_at: opts.observedAt,
    p_last_price: opts.lastPrice ?? null,
    p_last_price_currency: opts.lastPriceCurrency ?? null,
    p_set_purchased: opts.setPurchased ?? false,
  });
  if (!error) {
    if (data === false) throw new Error('not_found');
    return;
  }
  // Fallback until migration 20260718120000 is applied
  const rpcMissing =
    error.code === 'PGRST202' || /bump_expense_note_item_usage/i.test(error.message || '');
  if (!rpcMissing) throw error;

  const { data: row, error: selErr } = await supabase
    .from('expense_note_items')
    .select('usage_count')
    .eq('id', itemId)
    .eq('user_id', userId)
    .maybeSingle();
  if (selErr || !row) throw new Error('not_found');

  const { error: updErr } = await supabase
    .from('expense_note_items')
    .update({ usage_count: (row.usage_count || 0) + 1, ...patch })
    .eq('id', itemId)
    .eq('user_id', userId);
  if (updErr) throw updErr;
}

async function touchItemOnNewLine(
  userId: string,
  itemId: string,
  line: ParsedExpenseNoteLine,
  observedAt: string,
  currency: string
) {
  const price = lineDisplayAmount(line);
  await bumpItemUsage(userId, itemId, {
    observedAt,
    ...(price != null ? { lastPrice: price, lastPriceCurrency: currency } : {}),
  });
}

async function touchItemLastUsed(
  userId: string,
  itemId: string,
  line: ParsedExpenseNoteLine,
  observedAt: string,
  currency: string
) {
  await supabase
    .from('expense_note_items')
    .update({
      last_used_at: observedAt,
      ...pricePatch(line, currency, observedAt),
    })
    .eq('id', itemId)
    .eq('user_id', userId);
}

async function recordPriceObservation(
  userId: string,
  itemId: string,
  entryLineId: string,
  line: ParsedExpenseNoteLine,
  observedAt: string,
  currency: string
) {
  const price = lineDisplayAmount(line);
  if (price == null) return;

  const { data: prev } = await supabase
    .from('expense_note_price_observations')
    .select('price, currency')
    .eq('item_id', itemId)
    .eq('currency', currency)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const delta = prev?.price != null ? price - Number(prev.price) : null;
  await supabase.from('expense_note_price_observations').insert({
    user_id: userId,
    item_id: itemId,
    entry_line_id: entryLineId,
    price,
    currency,
    quantity: line.quantity,
    line_total: line.lineTotal ?? line.amountComputed,
    observed_at: observedAt,
    delta_from_previous: delta,
  });
}

export async function fetchExpenseNoteCategories(userId: string): Promise<ExpenseNoteCategory[]> {
  return ensureCategories(userId);
}

async function categoryNameMap(userId: string): Promise<Map<string, string>> {
  const cats = await ensureCategories(userId);
  return new Map(cats.map((c) => [c.id, c.name]));
}

function mapItemRows(
  rows: {
    id: string;
    display_name: string;
    name_normalized: string;
    usage_count: number;
    category_id: string | null;
    last_price: number | null;
    last_price_currency?: string | null;
  }[],
  catNames: Map<string, string>
): ExpenseNoteItem[] {
  return rows.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    name_normalized: r.name_normalized,
    usage_count: r.usage_count,
    category_name: r.category_id ? catNames.get(r.category_id) : undefined,
    last_price: r.last_price != null ? Number(r.last_price) : null,
    last_price_currency: r.last_price_currency ?? null,
  }));
}

export async function searchExpenseNoteItems(userId: string, prefix: string): Promise<ExpenseNoteItem[]> {
  const norm = normalizeExpenseItemName(prefix);
  if (!norm) return [];
  const catNames = await categoryNameMap(userId);
  const seen = new Set<string>();
  const out: ExpenseNoteItem[] = [];
  const itemSelect = 'id, display_name, name_normalized, usage_count, category_id, last_price, last_price_currency';

  const push = (rows: Parameters<typeof mapItemRows>[0]) => {
    for (const item of mapItemRows(rows, catNames)) {
      if (seen.has(item.id) || out.length >= EXPENSE_NOTE_AUTOCOMPLETE_LIMIT) return;
      seen.add(item.id);
      out.push(item);
    }
  };

  const { data: byName } = await supabase
    .from('expense_note_items')
    .select(itemSelect)
    .eq('user_id', userId)
    .like('name_normalized', `${norm}%`)
    .order('usage_count', { ascending: false })
    .limit(EXPENSE_NOTE_AUTOCOMPLETE_LIMIT);
  push(byName || []);
  if (out.length >= EXPENSE_NOTE_AUTOCOMPLETE_LIMIT) return out;

  const { data: aliases } = await supabase
    .from('expense_note_item_aliases')
    .select('item_id')
    .eq('user_id', userId)
    .like('alias_normalized', `${norm}%`)
    .limit(EXPENSE_NOTE_AUTOCOMPLETE_LIMIT);
  const aliasIds = [...new Set((aliases || []).map((a) => a.item_id).filter((id) => !seen.has(id)))];
  if (aliasIds.length) {
    const { data: byAlias } = await supabase.from('expense_note_items').select(itemSelect).in('id', aliasIds);
    push(byAlias || []);
  }
  return out;
}

export async function fetchGlobalShoppingItems(
  userId: string,
  categoryId?: string
): Promise<ExpenseNoteItem[]> {
  const catNames = await categoryNameMap(userId);
  let q = supabase
    .from('expense_note_items')
    .select('id, display_name, name_normalized, usage_count, category_id, last_price, last_price_currency, last_purchased_at')
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false, nullsFirst: false });
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error) throw error;
  const items = data || [];
  if (!items.length) return [];

  const ids = items.map((r) => r.id);
  const { data: obs } = await supabase
    .from('expense_note_price_observations')
    .select('item_id, delta_from_previous, observed_at, currency')
    .in('item_id', ids)
    .order('observed_at', { ascending: false });

  const currencyByItem = new Map(items.map((r) => [r.id, r.last_price_currency as string | null]));
  const deltaByItem = new Map<string, number>();
  for (const o of obs || []) {
    if (deltaByItem.has(o.item_id) || o.delta_from_previous == null) continue;
    const itemCur = currencyByItem.get(o.item_id);
    if (itemCur && o.currency && o.currency !== itemCur) continue;
    deltaByItem.set(o.item_id, Number(o.delta_from_previous));
  }

  return items.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    name_normalized: r.name_normalized,
    usage_count: r.usage_count,
    category_id: r.category_id,
    category_name: r.category_id ? catNames.get(r.category_id) : undefined,
    last_price: r.last_price != null ? Number(r.last_price) : null,
    last_price_currency: r.last_price_currency ?? null,
    last_purchased_at: r.last_purchased_at,
    price_delta: deltaByItem.get(r.id) ?? null,
  }));
}

export async function fetchDueShoppingCount(userId: string): Promise<number> {
  const cached = getShoppingListCache(userId);
  if (cached) {
    const n = countDueShoppingItems(cached.items, cached.purchaseDates, getShoppingFrequencyDays());
    setShoppingDueCount(n);
    return n;
  }
  const [items, purchaseDates] = await Promise.all([
    fetchGlobalShoppingItems(userId),
    fetchItemPurchaseDates(userId),
  ]);
  const n = countDueShoppingItems(items, purchaseDates, getShoppingFrequencyDays());
  setShoppingDueCount(n);
  return n;
}

export async function deleteCatalogItem(userId: string, itemId: string): Promise<void> {
  const { error } = await supabase.from('expense_note_items').delete().eq('id', itemId).eq('user_id', userId);
  if (error) throw error;
}

/** Catalog-only: updates global item row; does not touch documents, lines, or transaction notes. */
export async function updateCatalogItem(
  userId: string,
  itemId: string,
  patch: { displayName: string; categoryId: string }
): Promise<void> {
  const display = patch.displayName.trim();
  if (!display) throw new Error('invalid_name');

  const { data: current, error: fetchErr } = await supabase
    .from('expense_note_items')
    .select('name_normalized')
    .eq('user_id', userId)
    .eq('id', itemId)
    .maybeSingle();
  if (fetchErr || !current) throw new Error('not_found');

  const norm = normalizeExpenseItemName(display);
  if (!norm) throw new Error('invalid_name');

  if (norm !== current.name_normalized) {
    const { data: clash } = await supabase
      .from('expense_note_items')
      .select('id')
      .eq('user_id', userId)
      .eq('name_normalized', norm)
      .neq('id', itemId)
      .maybeSingle();
    if (clash) throw new Error('duplicate_name');
    await supabase.from('expense_note_item_aliases').upsert(
      { user_id: userId, item_id: itemId, alias_normalized: current.name_normalized },
      { onConflict: 'user_id,alias_normalized' }
    );
  }

  const { error } = await supabase
    .from('expense_note_items')
    .update({
      display_name: display,
      name_normalized: norm,
      category_id: patch.categoryId,
      category_source: 'manual',
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function mergeCatalogItem(userId: string, keepId: string, removeId: string): Promise<void> {
  if (keepId === removeId) return;
  const [{ data: keep }, { data: remove }] = await Promise.all([
    supabase.from('expense_note_items').select('usage_count').eq('user_id', userId).eq('id', keepId).maybeSingle(),
    supabase.from('expense_note_items').select('name_normalized, usage_count').eq('user_id', userId).eq('id', removeId).maybeSingle(),
  ]);
  if (!keep || !remove) throw new Error('not_found');

  await supabase.from('expense_note_item_aliases').update({ item_id: keepId }).eq('item_id', removeId).eq('user_id', userId);
  await supabase.from('expense_note_lines').update({ item_id: keepId }).eq('item_id', removeId);
  await supabase.from('expense_note_price_observations').update({ item_id: keepId }).eq('item_id', removeId);
  await supabase.from('expense_note_item_aliases').upsert(
    { user_id: userId, item_id: keepId, alias_normalized: remove.name_normalized },
    { onConflict: 'user_id,alias_normalized' }
  );
  await supabase
    .from('expense_note_items')
    .update({ usage_count: (keep.usage_count || 0) + (remove.usage_count || 0) })
    .eq('id', keepId);
  const { error } = await supabase.from('expense_note_items').delete().eq('id', removeId).eq('user_id', userId);
  if (error) throw error;
}

export async function fetchExpenseNoteRawText(userId: string, transactionId: string): Promise<string | null> {
  if (rawTextByTx.has(transactionId)) return rawTextByTx.get(transactionId)!;

  const { data, error } = await supabase
    .from('expense_note_documents')
    .select('raw_text')
    .eq('user_id', userId)
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (error) throw error;
  const raw = data?.raw_text ?? null;
  setRawTextCache(transactionId, raw);
  return raw;
}

export function prefetchExpenseNoteRawText(userId: string, transactionId: string) {
  if (!rawTextByTx.has(transactionId)) void fetchExpenseNoteRawText(userId, transactionId).catch(() => {});
}

export async function loadExpenseNoteDocument(
  userId: string,
  transactionId: string
): Promise<ExpenseNoteDocumentView | null> {
  const { data: doc, error } = await supabase
    .from('expense_note_documents')
    .select('id, raw_text, entry_date')
    .eq('user_id', userId)
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (error) throw error;
  if (!doc) {
    setRawTextCache(transactionId, null);
    return null;
  }
  setRawTextCache(transactionId, doc.raw_text);
  return {
    documentId: doc.id,
    rawText: doc.raw_text,
    entryDate: doc.entry_date,
    lines: parseExpenseNoteText(doc.raw_text),
  };
}

async function persistDocument(
  userId: string,
  opts: {
    transactionId?: string;
    documentId?: string;
    payload: ExpenseNoteDocumentPayload;
    observedAt?: string;
    /** Quick-add only; TX notes always use the account currency. */
    currency?: string;
  }
): Promise<string> {
  const { transactionId, payload } = opts;
  const observedAt = opts.observedAt ?? new Date().toISOString();
  const currency = transactionId
    ? await resolveNoteCurrency(userId, transactionId)
    : opts.currency?.trim() || (await resolveNoteCurrency(userId));
  const resolved = await Promise.all(
    payload.lines.map((line) =>
      line.parseStatus === 'failed' || !line.name.trim()
        ? Promise.resolve(null)
        : resolveItemId(userId, line, currency)
    )
  );

  let documentId: string | undefined = opts.documentId;
  if (!documentId && transactionId) {
    const { data: existing } = await supabase
      .from('expense_note_documents')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    documentId = existing?.id;
  }

  const docRow = {
    user_id: userId,
    raw_text: payload.rawText,
    entry_date: payload.entryDate || new Date().toISOString().slice(0, 10),
    source: transactionId ? 'transaction_note' : 'quick_add',
    list_id: null,
    ...(transactionId ? { transaction_id: transactionId } : {}),
  };

  let existingLineIds: string[] = [];
  if (documentId) {
    await supabase.from('expense_note_documents').update({ ...docRow, updated_at: observedAt }).eq('id', documentId);
    const { data: prevLines } = await supabase
      .from('expense_note_lines')
      .select('id')
      .eq('document_id', documentId)
      .order('sort_order');
    existingLineIds = (prevLines || []).map((r) => r.id);
  } else {
    const { data, error } = await supabase.from('expense_note_documents').insert(docRow).select('id').single();
    if (error) throw error;
    documentId = data!.id;
  }

  const docId = documentId!;
  await Promise.all(
    payload.lines.map(async (line, i) => {
      const itemId = resolved[i]?.id ?? null;
      const row = lineInsertRow(docId, i, line, itemId, observedAt, currency);
      const lineId = existingLineIds[i];

      if (lineId) {
        const { error } = await supabase.from('expense_note_lines').update(row).eq('id', lineId);
        if (error) throw error;
        if (!itemId) return;
        await touchItemLastUsed(userId, itemId, line, observedAt, currency);
        const price = lineDisplayAmount(line);
        if (price == null) return;
        const { data: obs } = await supabase
          .from('expense_note_price_observations')
          .select('price, currency')
          .eq('entry_line_id', lineId)
          .maybeSingle();
        if (!obs || Number(obs.price) !== price || obs.currency !== currency) {
          if (obs) await supabase.from('expense_note_price_observations').delete().eq('entry_line_id', lineId);
          await recordPriceObservation(userId, itemId, lineId, line, observedAt, currency);
        }
        return;
      }

      const { data: inserted, error } = await supabase.from('expense_note_lines').insert(row).select('id').single();
      if (error) throw error;
      if (!itemId || !inserted?.id) return;
      // New catalog rows already start at 1×; only bump when reusing an existing item
      if (!resolved[i]?.isNew) {
        await touchItemOnNewLine(userId, itemId, line, observedAt, currency);
      }
      await recordPriceObservation(userId, itemId, inserted.id, line, observedAt, currency);
    })
  );

  const staleLineIds = existingLineIds.slice(payload.lines.length);
  if (staleLineIds.length) {
    await Promise.all(staleLineIds.map((id) => supabase.from('expense_note_lines').delete().eq('id', id)));
  }

  if (transactionId) setRawTextCache(transactionId, payload.rawText);
  return payload.lines.length ? buildExpenseNoteSummary(payload.lines) : payload.rawText.trim();
}

export async function saveExpenseNoteDocument(
  userId: string,
  transactionId: string,
  payload: ExpenseNoteDocumentPayload
): Promise<string> {
  return persistDocument(userId, { transactionId, payload });
}

export async function saveQuickAddNote(
  userId: string,
  payload: ExpenseNoteDocumentPayload,
  currency?: string
): Promise<void> {
  await persistDocument(userId, { payload, currency });
}

export async function deleteExpenseNoteDocument(transactionId: string): Promise<void> {
  setRawTextCache(transactionId, null);
  const { data } = await supabase
    .from('expense_note_documents')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (!data?.id) return;
  await supabase.from('expense_note_documents').delete().eq('id', data.id);
}

/** Persist raw item text for a transaction (or clear it). Returns the denormalized summary for `transactions.note`. */
export async function saveExpenseNoteForTransaction(
  userId: string,
  transactionId: string,
  rawText: string
): Promise<string> {
  const trimmed = rawText.trim();
  if (!trimmed) {
    await deleteExpenseNoteDocument(transactionId);
    return '';
  }
  // Prime cache synchronously so reopen stays instant when callers fire-and-forget
  setRawTextCache(transactionId, trimmed);
  return saveExpenseNoteDocument(userId, transactionId, {
    rawText: trimmed,
    lines: parseExpenseNoteText(trimmed),
  });
}

export async function fetchItemDetail(userId: string, itemId: string): Promise<ExpenseNoteItemDetail | null> {
  const { data: item, error } = await supabase
    .from('expense_note_items')
    .select('id, display_name, name_normalized, usage_count, category_id, last_price, last_price_currency')
    .eq('user_id', userId)
    .eq('id', itemId)
    .maybeSingle();
  if (error || !item) return null;

  const cats = await ensureCategories(userId);
  const cat = cats.find((c) => c.id === item.category_id) ?? null;

  const { data: observations } = await supabase
    .from('expense_note_price_observations')
    .select(
      'price, currency, observed_at, delta_from_previous, expense_note_lines(expense_note_documents(entry_date, transaction_id, source))'
    )
    .eq('item_id', itemId)
    .order('observed_at', { ascending: false })
    .limit(50);

  return {
    item: {
      id: item.id,
      display_name: item.display_name,
      name_normalized: item.name_normalized,
      usage_count: item.usage_count,
      last_price: item.last_price != null ? Number(item.last_price) : null,
      last_price_currency: item.last_price_currency ?? null,
    },
    category: cat,
    observations: (observations || []).map((o) => {
      const doc = (o as { expense_note_lines?: { expense_note_documents?: { entry_date?: string; transaction_id?: string; source?: string } } })
        .expense_note_lines?.expense_note_documents;
      return {
        price: Number(o.price),
        currency: o.currency ?? null,
        observed_at: o.observed_at,
        delta_from_previous: o.delta_from_previous != null ? Number(o.delta_from_previous) : null,
        transaction_id: doc?.transaction_id ?? null,
        entry_date: doc?.entry_date ?? null,
        source: doc?.source ?? null,
      };
    }),
  };
}

async function countLinesForDocuments(documentIds: string[]): Promise<Map<string, number>> {
  const m = new Map<string, number>();
  if (!documentIds.length) return m;
  const { data } = await supabase.from('expense_note_lines').select('document_id').in('document_id', documentIds);
  for (const row of data || []) m.set(row.document_id, (m.get(row.document_id) || 0) + 1);
  return m;
}

export async function countImportableNotes(userId: string): Promise<number> {
  const [{ data: txs }, { data: docs }] = await Promise.all([
    supabase.from('transactions').select('id, note').eq('user_id', userId).not('note', 'is', null),
    supabase.from('expense_note_documents').select('id, raw_text').eq('user_id', userId),
  ]);
  const { data: linked } = await supabase
    .from('expense_note_documents')
    .select('transaction_id')
    .eq('user_id', userId)
    .not('transaction_id', 'is', null);
  const linkedTx = new Set((linked || []).map((d) => d.transaction_id));

  let n = 0;
  for (const tx of txs || []) {
    const note = tx.note?.trim();
    if (note && !linkedTx.has(tx.id) && looksLikeItemListNote(note) && parseExpenseNoteText(note).length) n++;
  }
  const lineCounts = await countLinesForDocuments((docs || []).map((d) => d.id));
  for (const doc of docs || []) {
    if (looksLikeItemListNote(doc.raw_text) && !lineCounts.get(doc.id) && parseExpenseNoteText(doc.raw_text).length) n++;
  }
  return n;
}

export async function importExistingUserNotes(userId: string): Promise<{ entries: number; items: number }> {
  await ensureCategories(userId);
  let entries = 0;
  let items = 0;

  const { data: txs } = await supabase
    .from('transactions')
    .select('id, note, date')
    .eq('user_id', userId)
    .not('note', 'is', null);
  const { data: linked } = await supabase
    .from('expense_note_documents')
    .select('transaction_id')
    .eq('user_id', userId)
    .not('transaction_id', 'is', null);
  const linkedTx = new Set((linked || []).map((d) => d.transaction_id));

  for (const tx of txs || []) {
    const raw = tx.note?.trim();
    if (!raw || linkedTx.has(tx.id) || !looksLikeItemListNote(raw)) continue;
    const lines = parseExpenseNoteText(raw);
    if (!lines.length) continue;
    const entryDate = tx.date ? String(tx.date).slice(0, 10) : undefined;
    const observedAt = tx.date ? new Date(tx.date).toISOString() : undefined;
    await persistDocument(userId, {
      transactionId: tx.id,
      payload: { rawText: raw, lines, entryDate },
      observedAt,
    });
    entries++;
    items += lines.length;
  }

  const { data: docs } = await supabase
    .from('expense_note_documents')
    .select('id, raw_text, entry_date, transaction_id')
    .eq('user_id', userId);
  const lineCounts = await countLinesForDocuments((docs || []).map((d) => d.id));

  for (const doc of docs || []) {
    if (lineCounts.get(doc.id)) continue;
    const raw = doc.raw_text?.trim();
    if (!raw || !looksLikeItemListNote(raw)) continue;
    const lines = parseExpenseNoteText(raw);
    if (!lines.length) continue;
    const observedAt = doc.entry_date ? new Date(doc.entry_date).toISOString() : undefined;
    await persistDocument(userId, {
      documentId: doc.id,
      transactionId: doc.transaction_id ?? undefined,
      payload: { rawText: raw, lines, entryDate: doc.entry_date ?? undefined },
      observedAt,
    });
    entries++;
    items += lines.length;
  }

  return { entries, items };
}

function entryPreview(raw: string, lineCount: number): string {
  const lines = parseExpenseNoteText(raw);
  const names = lines.slice(0, 3).map((l) => l.name).filter(Boolean);
  if (names.length) return names.join(', ') + (lines.length > 3 ? ` +${lines.length - 3}` : '');
  return raw.length > 48 ? raw.slice(0, 45) + '…' : raw;
}

export async function fetchRecentNoteEntries(userId: string, limit = 15): Promise<ExpenseNoteEntrySummary[]> {
  const { data: docs, error } = await supabase
    .from('expense_note_documents')
    .select('id, raw_text, entry_date, source, transaction_id, created_at')
    .eq('user_id', userId)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !docs?.length) return [];

  const lineCounts = await countLinesForDocuments(docs.map((d) => d.id));
  return docs.map((d) => {
    const lc = lineCounts.get(d.id) || parseExpenseNoteText(d.raw_text).length;
    return {
      id: d.id,
      rawText: d.raw_text,
      entryDate: d.entry_date,
      source: d.source || 'note',
      transactionId: d.transaction_id,
      lineCount: lc,
      preview: entryPreview(d.raw_text, lc),
    };
  });
}

export async function fetchItemPurchaseDates(userId: string): Promise<Map<string, string[]>> {
  const { data, error } = await supabase
    .from('expense_note_price_observations')
    .select('item_id, observed_at')
    .eq('user_id', userId)
    .order('observed_at');
  if (error) throw error;
  const map = new Map<string, string[]>();
  for (const row of data || []) {
    const arr = map.get(row.item_id) || [];
    arr.push(row.observed_at);
    map.set(row.item_id, arr);
  }
  return map;
}

export async function markCatalogItemPurchased(userId: string, itemId: string): Promise<void> {
  await bumpItemUsage(userId, itemId, {
    observedAt: new Date().toISOString(),
    setPurchased: true,
  });
}

/** @deprecated Use fetchGlobalShoppingItems */
export const fetchAllExpenseNoteItems = (userId: string) => fetchGlobalShoppingItems(userId);
