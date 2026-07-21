import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

type EntityFlags = {
  hasDpsTransfers: boolean;
  hasLendBorrowRecords: boolean;
  hasInvestmentContracts: boolean;
  hasPrizeBonds: boolean;
};

const EMPTY: EntityFlags = {
  hasDpsTransfers: false,
  hasLendBorrowRecords: false,
  hasInvestmentContracts: false,
  hasPrizeBonds: false,
};

async function exists(
  table: string,
  filters: Record<string, string>
): Promise<boolean> {
  let q = supabase.from(table).select('id', { count: 'exact', head: true });
  for (const [col, val] of Object.entries(filters)) {
    q = q.eq(col, val);
  }
  const { count, error } = await q;
  if (error) {
    console.error(`Error checking ${table}:`, error);
    return false;
  }
  return (count || 0) > 0;
}

/**
 * Parallel head-count checks for dashboard widget availability.
 * User-scoped flags refresh on user/premium; currency-scoped on currency.
 */
export function useDashboardEntityFlags(
  userId: string | undefined,
  isPremium: boolean,
  currency: string
): EntityFlags {
  const [flags, setFlags] = useState<EntityFlags>(EMPTY);
  const baseRef = useRef({ hasDpsTransfers: false, hasLendBorrowRecords: false });

  useEffect(() => {
    if (!userId) {
      baseRef.current = { hasDpsTransfers: false, hasLendBorrowRecords: false };
      setFlags(EMPTY);
      return;
    }
    let cancelled = false;
    void (async () => {
      const [hasDpsTransfers, hasLendBorrowRecords] = await Promise.all([
        exists('dps_transfers', {}),
        isPremium ? exists('lend_borrow', { user_id: userId }) : Promise.resolve(false),
      ]);
      if (cancelled) return;
      baseRef.current = { hasDpsTransfers, hasLendBorrowRecords };
      setFlags((prev) => ({ ...prev, hasDpsTransfers, hasLendBorrowRecords }));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, isPremium]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const [hasInvestmentContracts, hasPrizeBonds] = await Promise.all([
        currency
          ? exists('business_investment_contracts', { user_id: userId, currency })
          : Promise.resolve(false),
        currency === 'BDT' ? exists('prize_bonds', { user_id: userId }) : Promise.resolve(false),
      ]);
      if (cancelled) return;
      setFlags({
        ...baseRef.current,
        hasInvestmentContracts,
        hasPrizeBonds,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, currency]);

  return flags;
}
