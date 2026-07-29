/**
 * Last Wish delivery domains (PDF/CSV + UI "What will be sent").
 * Legacy keys remain on the object for stored-settings compat but are always off.
 */
export const DEFAULT_INCLUDE_DATA = {
  accounts: true,
  lendBorrow: true,
  businessInvestments: true,
  transactions: false,
  purchases: false,
  savings: false,
  analytics: false,
  investments: false,
};

export function normalizeIncludeData(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    accounts: r.accounts !== false,
    lendBorrow: r.lendBorrow !== false,
    businessInvestments: r.businessInvestments !== false,
    transactions: false,
    purchases: false,
    savings: false,
    analytics: false,
    investments: false,
  };
}
