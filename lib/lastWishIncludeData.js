/** Last Wish `include_data` defaults + merge (server + client). */
export const DEFAULT_INCLUDE_DATA = {
  accounts: true,
  transactions: true,
  purchases: true,
  lendBorrow: true,
  savings: true,
  analytics: true,
  investments: true,
  businessInvestments: true,
};

export function normalizeIncludeData(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_INCLUDE_DATA };
  const r = raw;
  return {
    accounts: r.accounts !== false,
    transactions: r.transactions !== false,
    purchases: r.purchases !== false,
    lendBorrow: r.lendBorrow !== false,
    savings: r.savings !== false,
    analytics: r.analytics !== false,
    investments: r.investments !== false,
    businessInvestments: r.businessInvestments !== false,
  };
}
