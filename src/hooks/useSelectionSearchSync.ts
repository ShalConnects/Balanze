import { useEffect, useRef } from 'react';
import { normalizeSearchText } from '../utils/searchText';

interface UseSelectionSearchSyncOptions<T> {
  hasSelection?: boolean;
  isFromSearch?: boolean;
  selectedId?: string | null;
  selectedRecord?: T | null;
  searchValue: string;
  onSearchChange: (value: string) => void;
  clearSelection?: () => void;
  getSelectedSearchValue: (record: T) => string | undefined | null;
}

export function useSelectionSearchSync<T>({
  hasSelection,
  isFromSearch,
  selectedId,
  selectedRecord,
  searchValue,
  onSearchChange,
  clearSelection,
  getSelectedSearchValue,
}: UseSelectionSearchSyncOptions<T>) {
  const appliedSelectionKeyRef = useRef<string | null>(null);

  const selectedSearchValue = selectedRecord ? (getSelectedSearchValue(selectedRecord) || '').trim() : '';
  const normalizedSelectedSearchValue = normalizeSearchText(selectedSearchValue);

  useEffect(() => {
    if (!hasSelection || !isFromSearch || !selectedSearchValue) return;
    const selectionKey = selectedId || selectedSearchValue;
    if (appliedSelectionKeyRef.current === selectionKey) return;
    if (searchValue !== selectedSearchValue) {
      onSearchChange(selectedSearchValue);
    }
    appliedSelectionKeyRef.current = selectionKey;
  }, [hasSelection, isFromSearch, selectedId, selectedSearchValue, searchValue, onSearchChange]);

  useEffect(() => {
    if (!hasSelection || !isFromSearch || !clearSelection || !selectedSearchValue) return;
    const normalizedSearch = normalizeSearchText(searchValue);
    if (!normalizedSearch || normalizedSearch !== normalizedSelectedSearchValue) {
      clearSelection();
    }
  }, [hasSelection, isFromSearch, selectedSearchValue, normalizedSelectedSearchValue, searchValue, clearSelection]);
}
