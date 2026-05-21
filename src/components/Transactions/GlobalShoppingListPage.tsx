import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { EXPENSE_NOTE_ITEMS_PAGE_SIZE, EXPENSE_NOTE_RAW_MAX, queueOpenTransactionNote } from '../../constants/expenseNote';
import {
  countImportableNotes,
  fetchExpenseNoteCategories,
  fetchGlobalShoppingItems,
  fetchItemDetail,
  fetchRecentNoteEntries,
  importExistingUserNotes,
  mergeCatalogItem,
  saveQuickAddNote,
  updateCatalogItem,
} from '../../lib/expenseNoteService';
import { isLikelySameItem } from '../../utils/itemNameMerge';
import { parseExpenseNoteText, sumExpenseNoteLines } from '../../utils/expenseNoteParser';
import type { ExpenseNoteCategory, ExpenseNoteEntrySummary, ExpenseNoteItem, ExpenseNoteItemDetail } from '../../types/expenseNote';
import {
  EXPENSE_NOTE_EMPTY,
  ExpenseNoteItemsTable,
  ExpenseNoteListPager,
  ExpenseNoteParseHint,
  ExpenseNoteParsedPreviewTable,
  ExpenseNoteItemDetailPanel,
  ExpenseNoteRecentTable,
  ExpenseNoteSection,
} from './expenseNoteCompactUi';
import { paginateList } from '../../utils/paginateList';
import { toast } from 'sonner';

export const GlobalShoppingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [categories, setCategories] = useState<ExpenseNoteCategory[]>([]);
  const [items, setItems] = useState<ExpenseNoteItem[]>([]);
  const [recentEntries, setRecentEntries] = useState<ExpenseNoteEntrySummary[]>([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [quickAdd, setQuickAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [detail, setDetail] = useState<ExpenseNoteItemDetail | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [mergingItem, setMergingItem] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);

  const parsed = useMemo(() => parseExpenseNoteText(quickAdd), [quickAdd]);
  const lineTotal = useMemo(() => sumExpenseNoteLines(parsed), [parsed]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [cats, rows, recent] = await Promise.all([
      fetchExpenseNoteCategories(user.id),
      fetchGlobalShoppingItems(user.id, filterCategory || undefined),
      fetchRecentNoteEntries(user.id),
    ]);
    setCategories(cats);
    setItems(rows);
    setRecentEntries(recent);
  }, [user?.id, filterCategory]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setImporting(true);
      try {
        if ((await countImportableNotes(user.id)) > 0) {
          const r = await importExistingUserNotes(user.id);
          if (!cancelled && r.entries > 0) {
            toast.success(`Imported ${r.entries} note(s) · ${r.items} items`);
          }
        }
        if (!cancelled) await load();
      } catch {
        if (!cancelled) toast.error('Failed to load shopping list');
      } finally {
        if (!cancelled) setImporting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, load]);

  const mergeCandidates = useMemo(() => {
    if (!detail) return [];
    return items
      .filter(
        (i) => i.id !== detail.item.id && isLikelySameItem(detail.item.name_normalized, i.name_normalized)
      )
      .map((i) => ({ label: i.display_name, value: i.id }));
  }, [detail, items]);

  const runImport = async () => {
    if (!user?.id || importing) return;
    setImporting(true);
    try {
      const r = await importExistingUserNotes(user.id);
      await load();
      toast.success(r.entries > 0 ? `Synced ${r.entries} note(s) · ${r.items} items` : 'Nothing new to import');
    } catch {
      toast.error('Failed to sync notes');
    } finally {
      setImporting(false);
    }
  };

  const openTransaction = (id: string) => {
    queueOpenTransactionNote(id);
    navigate('/transactions');
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) => i.display_name.toLowerCase().includes(q) || i.name_normalized.includes(q)
    );
  }, [items, search]);

  useEffect(() => {
    setItemsPage(1);
  }, [search, filterCategory]);

  const pagedItems = useMemo(
    () => paginateList(filtered, itemsPage, EXPENSE_NOTE_ITEMS_PAGE_SIZE),
    [filtered, itemsPage]
  );

  const handleCatalogSave = async (patch: { displayName: string; categoryId: string }) => {
    if (!user?.id || !detail) return;
    setSavingItem(true);
    try {
      await updateCatalogItem(user.id, detail.item.id, patch);
      await load();
      setDetail(await fetchItemDetail(user.id, detail.item.id));
      toast.success('Item updated');
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      if (code === 'duplicate_name') toast.error('Another item already uses that name');
      else toast.error('Failed to update item');
    } finally {
      setSavingItem(false);
    }
  };

  const handleMerge = async (removeId: string) => {
    if (!user?.id || !detail) return;
    setMergingItem(true);
    try {
      await mergeCatalogItem(user.id, detail.item.id, removeId);
      setDetail(null);
      await load();
      toast.success('Items merged');
    } catch {
      toast.error('Failed to merge items');
    } finally {
      setMergingItem(false);
    }
  };

  const handleQuickSave = async () => {
    if (!user?.id || !quickAdd.trim()) return;
    setSaving(true);
    try {
      await saveQuickAddNote(user.id, { rawText: quickAdd.trim(), lines: parsed });
      setQuickAdd('');
      await load();
      toast.success('Items saved to your global list');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-full m-0 min-w-0">
      {importing && (
        <p className="text-xs text-gray-500 animate-pulse mb-3">Syncing notes from your transactions…</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start md:items-stretch">
        <ExpenseNoteSection title="Recent notes" collapseOnMobile equalHeightDesktop className="order-3 md:order-1">
          {recentEntries.length > 0 ? (
            <ExpenseNoteRecentTable
              entries={recentEntries}
              onOpenTransaction={openTransaction}
            />
          ) : (
            <p className={`${EXPENSE_NOTE_EMPTY} flex-1 flex items-center justify-center`}>No notes yet</p>
          )}
        </ExpenseNoteSection>

        <ExpenseNoteSection title="Quick add" equalHeightDesktop panelClassName="md:overflow-y-auto" className="order-1 md:order-2">
            <textarea
              value={quickAdd}
              onChange={(e) => e.target.value.length <= EXPENSE_NOTE_RAW_MAX && setQuickAdd(e.target.value)}
              placeholder="Toast 43, Egg 12 138, Potato 2kg 40"
              className="w-full flex-1 min-h-[64px] md:min-h-0 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 resize-none"
            />
            <ExpenseNoteParseHint lines={parsed} />
            <ExpenseNoteParsedPreviewTable lines={parsed} lineTotal={lineTotal} />
            <button
              type="button"
              disabled={saving || !quickAdd.trim() || importing}
              onClick={handleQuickSave}
              className="shrink-0 w-full sm:w-auto px-3 py-1.5 text-xs text-white bg-gradient-primary rounded-lg disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save to global list'}
            </button>
        </ExpenseNoteSection>

        <ExpenseNoteSection title="All items" titleInPanel className="order-2 md:order-3 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center min-w-0">
              <div className="relative w-full sm:flex-1 sm:min-w-[140px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-7 pr-2 py-1.5 sm:py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <button
                  type="button"
                  disabled={importing}
                  onClick={runImport}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  Sync notes
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('')}
                  className={`text-xs px-2 py-0.5 rounded-full ${!filterCategory ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setFilterCategory(c.id)}
                    className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${filterCategory === c.id ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-600'}`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
          </div>

          {filtered.length > 0 ? (
            <>
              <ExpenseNoteItemsTable
                items={pagedItems.items}
                onSelect={async (id) => {
                  if (!user?.id) return;
                  setDetail(await fetchItemDetail(user.id, id));
                }}
              />
              <ExpenseNoteListPager
                page={pagedItems.page}
                totalPages={pagedItems.totalPages}
                total={pagedItems.total}
                start={pagedItems.start}
                end={pagedItems.end}
                onPage={setItemsPage}
              />
            </>
          ) : (
            !importing && <p className={EXPENSE_NOTE_EMPTY}>No items yet</p>
          )}
        </ExpenseNoteSection>
      </div>

      {detail && (
        <ExpenseNoteItemDetailPanel
          detail={detail}
          categories={categories}
          mergeCandidates={mergeCandidates}
          saving={savingItem}
          merging={mergingItem}
          onSave={handleCatalogSave}
          onMerge={handleMerge}
          onOpenTransaction={openTransaction}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
};
