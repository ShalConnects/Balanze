import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { EXPENSE_NOTE_ITEMS_PAGE_SIZE, queueOpenTransactionNote } from '../../constants/expenseNote';
import {
  deleteCatalogItem,
  fetchExpenseNoteCategories,
  fetchGlobalShoppingItems,
  fetchItemDetail,
  fetchItemPurchaseDates,
  fetchRecentNoteEntries,
  importExistingUserNotes,
  markCatalogItemPurchased,
  mergeCatalogItem,
  saveQuickAddNote,
  updateCatalogItem,
} from '../../lib/expenseNoteService';
import { ShoppingSuggestionsPanel } from './ShoppingSuggestionsPanel';
import { isLikelySameItem } from '../../utils/itemNameMerge';
import { parseExpenseNoteText, sumExpenseNoteLines } from '../../utils/expenseNoteParser';
import { getShoppingQuickCurrency, setShoppingQuickCurrency } from '../../utils/shoppingFrequencyPrefs';
import { getProfilePreferredCurrency } from '../../utils/usePreferredCurrency';
import { formatCurrency } from '../../utils/currency';
import type { ExpenseNoteCategory, ExpenseNoteEntrySummary, ExpenseNoteFmtAmount, ExpenseNoteItem, ExpenseNoteItemDetail } from '../../types/expenseNote';
import {
  EXPENSE_NOTE_EMPTY,
  ExpenseNoteItemsTable,
  ExpenseNoteParseHint,
  ExpenseNoteParsedPreviewTable,
  ExpenseNoteItemDetailPanel,
  ExpenseNoteRecentTable,
  ExpenseNoteQuickAddField,
  ExpenseNoteSection,
} from './expenseNoteCompactUi';
import { CustomDropdown } from '../Purchases/CustomDropdown';
import { ListPager } from '../common/ListPager';
import { UnderlineTabBar } from '../common/UnderlineTabBar';
import { paginateList } from '../../utils/paginateList';
import { getShoppingListCache, setShoppingListCache } from '../../utils/shoppingListCache';
import { setShoppingListLoading } from '../../utils/shoppingListLoading';
import { toast } from 'sonner';

type ShoppingView = 'items' | 'trip';

const SHOPPING_TABS = [
  { id: 'items' as const, label: 'My items' },
  { id: 'trip' as const, label: 'Shopping trip' },
];

export const GlobalShoppingListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const preferredCurrency = getProfilePreferredCurrency(profile);
  const currencyCodes = useMemo(() => {
    const selected = (profile?.selected_currencies || []).filter(Boolean);
    return selected.length ? selected : [preferredCurrency];
  }, [profile?.selected_currencies, preferredCurrency]);
  const currencyOptions = useMemo(
    () => currencyCodes.map((c) => ({ value: c, label: c })),
    [currencyCodes]
  );

  const [quickCurrency, setQuickCurrency] = useState(() => getShoppingQuickCurrency(preferredCurrency));
  const fmtAmount = useCallback<ExpenseNoteFmtAmount>(
    (n, cur) => formatCurrency(n, cur || preferredCurrency),
    [preferredCurrency]
  );
  const fmtQuickAmount = useCallback<ExpenseNoteFmtAmount>(
    (n, cur) => formatCurrency(n, cur || quickCurrency),
    [quickCurrency]
  );

  const [categories, setCategories] = useState<ExpenseNoteCategory[]>([]);
  const [items, setItems] = useState<ExpenseNoteItem[]>([]);
  const [recentEntries, setRecentEntries] = useState<ExpenseNoteEntrySummary[]>([]);
  const [purchaseDates, setPurchaseDates] = useState<Map<string, string[]>>(new Map());
  const [filterCategory, setFilterCategory] = useState('');
  const [search, setSearch] = useState('');
  const [quickAdd, setQuickAdd] = useState('');
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [detail, setDetail] = useState<ExpenseNoteItemDetail | null>(null);
  const [savingItem, setSavingItem] = useState(false);
  const [mergingItem, setMergingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);
  const [itemsPage, setItemsPage] = useState(1);
  const [view, setView] = useState<ShoppingView>('items');
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currencyCodes.includes(quickCurrency)) {
      const next = getShoppingQuickCurrency(preferredCurrency);
      setQuickCurrency(currencyCodes.includes(next) ? next : currencyCodes[0]!);
    }
  }, [currencyCodes, preferredCurrency, quickCurrency]);

  const parsed = useMemo(() => parseExpenseNoteText(quickAdd), [quickAdd]);
  const lineTotal = useMemo(() => sumExpenseNoteLines(parsed), [parsed]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    const [cats, rows, recent, dates] = await Promise.all([
      fetchExpenseNoteCategories(user.id),
      fetchGlobalShoppingItems(user.id),
      fetchRecentNoteEntries(user.id),
      fetchItemPurchaseDates(user.id),
    ]);
    const snap = { categories: cats, items: rows, recentEntries: recent, purchaseDates: dates };
    setShoppingListCache(user.id, snap);
    setCategories(cats);
    setItems(rows);
    setRecentEntries(recent);
    setPurchaseDates(dates);
  }, [user?.id]);

  useEffect(() => {
    setShoppingListLoading(importing);
    return () => setShoppingListLoading(false);
  }, [importing]);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    const cached = getShoppingListCache(user.id);
    if (cached) {
      setCategories(cached.categories);
      setItems(cached.items);
      setRecentEntries(cached.recentEntries);
      setPurchaseDates(cached.purchaseDates);
    }

    (async () => {
      const cold = !cached;
      if (cold) setImporting(true);
      try {
        await load();
      } catch {
        if (!cancelled && cold) toast.error('Failed to load shopping list');
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
    let list = items;
    if (filterCategory) list = list.filter((i) => i.category_id === filterCategory);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) => i.display_name.toLowerCase().includes(q) || i.name_normalized.includes(q)
      );
    }
    return list;
  }, [items, filterCategory, search]);

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

  const handleDelete = async () => {
    if (!user?.id || !detail) return;
    setDeletingItem(true);
    try {
      await deleteCatalogItem(user.id, detail.item.id);
      setDetail(null);
      await load();
      toast.success('Item deleted');
    } catch {
      toast.error('Failed to delete item');
    } finally {
      setDeletingItem(false);
    }
  };

  const handleQuickSave = async () => {
    if (!user?.id || !quickAdd.trim()) return;
    setSaving(true);
    try {
      setShoppingQuickCurrency(quickCurrency);
      await saveQuickAddNote(user.id, { rawText: quickAdd.trim(), lines: parsed }, quickCurrency);
      setQuickAdd('');
      await load();
      toast.success('Items saved to your global list');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onQuickCurrencyChange = (c: string) => {
    setQuickCurrency(c);
    setShoppingQuickCurrency(c);
  };

  const handleMarkPurchased = async (item: ExpenseNoteItem) => {
    if (!user?.id) return;
    setMarkingId(item.id);
    try {
      await markCatalogItemPurchased(user.id, item.id);
      await load();
      toast.success(`${item.display_name} marked purchased`);
    } catch {
      toast.error('Failed to update item');
    } finally {
      setMarkingId(null);
    }
  };

  const openItemDetail = async (id: string) => {
    if (!user?.id) return;
    setDetail(await fetchItemDetail(user.id, id));
  };

  return (
    <div className="w-full max-w-full m-0 min-w-0">
      <UnderlineTabBar
        tabs={SHOPPING_TABS}
        value={view}
        onChange={(id) => setView(id as ShoppingView)}
        className="mb-3"
      />

      {view === 'trip' ? (
        <ShoppingSuggestionsPanel
          items={items}
          purchaseDates={purchaseDates}
          markingId={markingId}
          fmtAmount={fmtAmount}
          onMarkPurchased={handleMarkPurchased}
          onSelectItem={openItemDetail}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5 items-start md:items-stretch">
          <ExpenseNoteSection title="Recent notes" collapseOnMobile equalHeightDesktop className="order-2 md:order-1">
            {recentEntries.length > 0 ? (
              <ExpenseNoteRecentTable entries={recentEntries} onOpenTransaction={openTransaction} />
            ) : (
              <p className={`${EXPENSE_NOTE_EMPTY} flex-1 flex items-center justify-center`}>
                Add items in transaction notes like &quot;Egg 12 138&quot;
              </p>
            )}
          </ExpenseNoteSection>

          <ExpenseNoteSection title="Quick add" equalHeightDesktop panelClassName="md:overflow-y-auto" className="order-1 md:order-2">
            <ExpenseNoteQuickAddField
              value={quickAdd}
              onChange={setQuickAdd}
              userId={user?.id}
              disabled={saving || importing}
              placeholder="Toast 43, Egg 12 138, Potato 2kg 40"
            />
            <ExpenseNoteParseHint lines={parsed} />
            <ExpenseNoteParsedPreviewTable lines={parsed} lineTotal={lineTotal} fmtAmount={fmtQuickAmount} />
            <div className="flex items-center gap-2">
              <div className="shrink-0">
                <CustomDropdown
                  options={currencyOptions}
                  value={quickCurrency}
                  onChange={onQuickCurrencyChange}
                  disabled={saving || importing}
                  placeholder="Currency"
                  fullWidth={false}
                  className="!h-8 !min-h-0 !px-2 !pr-1.5 !py-0 !text-xs"
                />
              </div>
              <button
                type="button"
                disabled={saving || !quickAdd.trim() || importing}
                onClick={handleQuickSave}
                className="h-8 px-3 text-xs text-white bg-gradient-primary rounded-lg disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? 'Saving…' : 'Save to list'}
              </button>
            </div>
          </ExpenseNoteSection>

          <ExpenseNoteSection title="All items" titleInPanel className="order-3 md:col-span-2">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:items-center min-w-0">
              <div className="relative w-full sm:flex-1 sm:min-w-[140px]">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full pl-7 pr-7 py-1.5 sm:py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                />
                {search && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
                  onSelect={openItemDetail}
                  onMarkPurchased={handleMarkPurchased}
                  markingId={markingId}
                  fmtAmount={fmtAmount}
                />
                <ListPager
                  page={pagedItems.page}
                  totalPages={pagedItems.totalPages}
                  total={pagedItems.total}
                  start={pagedItems.start}
                  end={pagedItems.end}
                  onPage={setItemsPage}
                />
              </>
            ) : (
              !importing && <p className={EXPENSE_NOTE_EMPTY}>No items yet — use quick add</p>
            )}
          </ExpenseNoteSection>
        </div>
      )}

      {detail && (
        <ExpenseNoteItemDetailPanel
          detail={detail}
          categories={categories}
          mergeCandidates={mergeCandidates}
          saving={savingItem}
          merging={mergingItem}
          deleting={deletingItem}
          onSave={handleCatalogSave}
          onMerge={handleMerge}
          onDelete={handleDelete}
          onOpenTransaction={openTransaction}
          onClose={() => setDetail(null)}
          fmtAmount={fmtAmount}
        />
      )}
    </div>
  );
};
