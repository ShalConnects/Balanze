import React, { useMemo } from 'react';
import { ListPageFilterSelect } from './listPage/ListPageFilterSelect';

export type ListPagerProps = {
  page: number;
  totalPages: number;
  total: number;
  start: number;
  end: number;
  onPage: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
};

const btn =
  'px-2 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-xs disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800';

export const ListPager: React.FC<ListPagerProps> = ({
  page,
  totalPages,
  total,
  start,
  end,
  onPage,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  itemLabel,
}) => {
  const showNav = totalPages > 1;
  const showPageSize = !!(pageSizeOptions?.length && pageSize != null && onPageSizeChange);
  const pageSizeSelectOptions = useMemo(
    () => pageSizeOptions?.map((n) => ({ value: String(n), label: `${n} per page` })) ?? [],
    [pageSizeOptions],
  );

  if (!total || (!showNav && !showPageSize)) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
      <span>
        {start + 1}–{end} of {total}
        {itemLabel ? ` ${itemLabel}` : ''}
      </span>
      <div className="flex items-center gap-2">
        {showPageSize && (
          <ListPageFilterSelect
            value={String(pageSize)}
            onChange={(v) => onPageSizeChange(Number(v))}
            options={pageSizeSelectOptions}
            highlight={false}
            dropUp
            ariaLabel="Items per page"
          />
        )}
        {showNav && (
          <>
            <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
              Prev
            </button>
            <span className="px-1 tabular-nums">
              {page} / {totalPages}
            </span>
            <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
              Next
            </button>
          </>
        )}
      </div>
    </div>
  );
};
