export interface LastWishIncludeData {
  accounts: boolean;
  transactions: boolean;
  purchases: boolean;
  lendBorrow: boolean;
  savings: boolean;
  analytics: boolean;
  investments: boolean;
  businessInvestments: boolean;
}

export const DEFAULT_INCLUDE_DATA: LastWishIncludeData;
export function normalizeIncludeData(data: unknown): LastWishIncludeData;
