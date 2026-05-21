import { supabase } from './supabase';
import { EXPENSE_NOTE_AUTOCOMPLETE_LIMIT, SHOPPING_CATEGORY_SEEDS } from '../constants/expenseNote';
import { isLikelySameItem } from '../utils/itemNameMerge';
import {
  buildExpenseNoteSummary,
  lineDisplayAmount,
  looksLikeItemListNote,
  normalizeExpenseItemName,
  parseExpenseNoteSegment,
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

async function ensureCategories(userId: string): Promise<ExpenseNoteCategory[]> {
  const { data: existing } = await supabase
    .from('expense_note_categories')
    .select('id, slug, name, sort_order')
    .eq('user_id', userId)
    .order('sort_order');
  if (existing?.length) return existing;

  const rows = SHOPPING_CATEGORY_SEEDS.map((c) => ({ user_id: userId, ...c, is_system: true }));
  const { data, error } = await supabase.from('expense_note_categories').insert(rows).select('id, slug, name, sort_order');
  if (error) throw error;
  return data || [];
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
    const { data } = await supabase.from('expense_note_items').select('id, usage_count, display_name, category_id, category_source').eq('id', alias.item_id).maybeSingle();
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

async function resolveItemId(userId: string, line: ParsedExpenseNoteLine): Promise<string | null> {
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
    return existing.id;
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
      last_purchased_at: price != null ? new Date().toISOString() : null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

function lineInsertRow(
  documentId: string,
  sortOrder: number,
  line: ParsedExpenseNoteLine,
  itemId: string | null,
  observedAt: string
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
  };
}

async function touchItemOnNewLine(
  userId: string,
  itemId: string,
  line: ParsedExpenseNoteLine,
  observedAt: string
) {
  const price = lineDisplayAmount(line);
  const { data } = await supabase.from('expense_note_items').select('usage_count').eq('id', itemId).single();
  await supabase
    .from('expense_note_items')
    .update({
      usage_count: (data?.usage_count || 0) + 1,
      last_used_at: observedAt,
      ...(price != null ? { last_price: price, last_purchased_at: observedAt } : {}),
    })
    .eq('id', itemId)
    .eq('user_id', userId);
}

async function touchItemLastUsed(
  userId: string,
  itemId: string,
  line: ParsedExpenseNoteLine,
  observedAt: string
) {
  const price = lineDisplayAmount(line);
  await supabase
    .from('expense_note_items')
    .update({
      last_used_at: observedAt,
      ...(price != null ? { last_price: price, last_purchased_at: observedAt } : {}),
    })
    .eq('id', itemId)
    .eq('user_id', userId);
}

async function recordPriceObservation(
  userId: string,
  itemId: string,
  entryLineId: string,
  line: ParsedExpenseNoteLine,
  observedAt: string
) {
  const price = lineDisplayAmount(line);
  if (price == null) return;

  const { data: prev } = await supabase
    .from('expense_note_price_observations')
    .select('price')
    .eq('item_id', itemId)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const delta = prev?.price != null ? price - Number(prev.price) : null;
  await supabase.from('expense_note_price_observations').insert({
    user_id: userId,
    item_id: itemId,
    entry_line_id: entryLineId,
    price,
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
  }));
}

export async function searchExpenseNoteItems(userId: string, prefix: string): Promise<ExpenseNoteItem[]> {
  const norm = normalizeExpenseItemName(prefix);
  if (!norm) return [];
  const catNames = await categoryNameMap(userId);
  const seen = new Set<string>();
  const out: ExpenseNoteItem[] = [];
  const itemSelect = 'id, display_name, name_normalized, usage_count, category_id, last_price';

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
    .select('id, display_name, name_normalized, usage_count, category_id, last_price, last_purchased_at')
    .eq('user_id', userId)
    .order('usage_count', { ascending: false });
  if (categoryId) q = q.eq('category_id', categoryId);
  const { data, error } = await q;
  if (error) throw error;
  const items = data || [];
  if (!items.length) return [];

  const ids = items.map((r) => r.id);
  const { data: obs } = await supabase
    .from('expense_note_price_observations')
    .select('item_id, delta_from_previous, observed_at')
    .in('item_id', ids)
    .order('observed_at', { ascending: false });

  const deltaByItem = new Map<string, number>();
  for (const o of obs || []) {
    if (!deltaByItem.has(o.item_id) && o.delta_from_previous != null) {
      deltaByItem.set(o.item_id, Number(o.delta_from_previous));
    }
  }

  return items.map((r) => ({
    id: r.id,
    display_name: r.display_name,
    name_normalized: r.name_normalized,
    usage_count: r.usage_count,
    category_id: r.category_id,
    category_name: r.category_id ? catNames.get(r.category_id) : undefined,
    last_price: r.last_price != null ? Number(r.last_price) : null,
    last_purchased_at: r.last_purchased_at,
    price_delta: deltaByItem.get(r.id) ?? null,
  }));
}

export async function fetchRecentItemCount(userId: string): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - 7);
  const { count, error } = await supabase
    .from('expense_note_items')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('last_purchased_at', since.toISOString());
  if (error) return 0;
  return count ?? 0;
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

function mapDbLine(row: { name_raw: string }): ParsedExpenseNoteLine {
  return parseExpenseNoteSegment(row.name_raw);
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
  if (!doc) return null;

  const { data: lines, error: lineErr } = await supabase
    .from('expense_note_lines')
    .select('name_raw')
    .eq('document_id', doc.id)
    .order('sort_order');
  if (lineErr) throw lineErr;

  return {
    documentId: doc.id,
    rawText: doc.raw_text,
    entryDate: doc.entry_date,
    lines: (lines || []).map(mapDbLine),
  };
}

async function persistDocument(
  userId: string,
  opts: { transactionId?: string; documentId?: string; payload: ExpenseNoteDocumentPayload; observedAt?: string }
): Promise<string> {
  const { transactionId, payload } = opts;
  const observedAt = opts.observedAt ?? new Date().toISOString();
  const itemIds: (string | null)[] = [];
  for (const line of payload.lines) {
    if (line.parseStatus === 'failed' || !line.name.trim()) {
      itemIds.push(null);
      continue;
    }
    itemIds.push(await resolveItemId(userId, line));
  }

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
  for (let i = 0; i < payload.lines.length; i++) {
    const line = payload.lines[i];
    const itemId = itemIds[i];
    const row = lineInsertRow(docId, i, line, itemId, observedAt);
    const lineId = existingLineIds[i];

    if (lineId) {
      const { error } = await supabase.from('expense_note_lines').update(row).eq('id', lineId);
      if (error) throw error;
      if (itemId) {
        await touchItemLastUsed(userId, itemId, line, observedAt);
        const price = lineDisplayAmount(line);
        if (price != null) {
          const { data: obs } = await supabase
            .from('expense_note_price_observations')
            .select('price')
            .eq('entry_line_id', lineId)
            .maybeSingle();
          if (!obs) await recordPriceObservation(userId, itemId, lineId, line, observedAt);
          else if (Number(obs.price) !== price) {
            await supabase.from('expense_note_price_observations').delete().eq('entry_line_id', lineId);
            await recordPriceObservation(userId, itemId, lineId, line, observedAt);
          }
        }
      }
    } else {
      const { data: inserted, error } = await supabase.from('expense_note_lines').insert(row).select('id').single();
      if (error) throw error;
      if (itemId && inserted?.id) {
        await touchItemOnNewLine(userId, itemId, line, observedAt);
        await recordPriceObservation(userId, itemId, inserted.id, line, observedAt);
      }
    }
  }

  for (let i = payload.lines.length; i < existingLineIds.length; i++) {
    await supabase.from('expense_note_lines').delete().eq('id', existingLineIds[i]);
  }

  return payload.lines.length ? buildExpenseNoteSummary(payload.lines) : payload.rawText.trim();
}

export async function saveExpenseNoteDocument(
  userId: string,
  transactionId: string,
  payload: ExpenseNoteDocumentPayload
): Promise<string> {
  return persistDocument(userId, { transactionId, payload });
}

export async function saveQuickAddNote(userId: string, payload: ExpenseNoteDocumentPayload): Promise<void> {
  await persistDocument(userId, { payload });
}

export async function deleteExpenseNoteDocument(transactionId: string): Promise<void> {
  const { data } = await supabase
    .from('expense_note_documents')
    .select('id')
    .eq('transaction_id', transactionId)
    .maybeSingle();
  if (!data?.id) return;
  await supabase.from('expense_note_documents').delete().eq('id', data.id);
}

export async function fetchItemDetail(userId: string, itemId: string): Promise<ExpenseNoteItemDetail | null> {
  const { data: item, error } = await supabase
    .from('expense_note_items')
    .select('id, display_name, name_normalized, usage_count, category_id, last_price')
    .eq('user_id', userId)
    .eq('id', itemId)
    .maybeSingle();
  if (error || !item) return null;

  const cats = await ensureCategories(userId);
  const cat = cats.find((c) => c.id === item.category_id) ?? null;

  const { data: observations } = await supabase
    .from('expense_note_price_observations')
    .select(
      'price, observed_at, delta_from_previous, expense_note_lines(expense_note_documents(entry_date, transaction_id, source))'
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
    },
    category: cat,
    observations: (observations || []).map((o) => {
      const doc = (o as { expense_note_lines?: { expense_note_documents?: { entry_date?: string; transaction_id?: string; source?: string } } })
        .expense_note_lines?.expense_note_documents;
      return {
        price: Number(o.price),
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

/** @deprecated Use fetchGlobalShoppingItems */
export const fetchAllExpenseNoteItems = (userId: string) => fetchGlobalShoppingItems(userId);
