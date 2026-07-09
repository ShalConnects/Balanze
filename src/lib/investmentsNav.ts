export const INVESTMENTS_BONDS_TAB = 'bonds';

export const INVESTMENTS_PAGE_TABS = [
  { tab: null, labelKey: 'navigation.investments' },
  { tab: INVESTMENTS_BONDS_TAB, labelKey: 'navigation.bonds' },
] as const;

export function isInvestmentsBondsTab(tab: string | null): boolean {
  return tab === INVESTMENTS_BONDS_TAB;
}

export function investmentsBondsPath(): string {
  return `/investments?tab=${INVESTMENTS_BONDS_TAB}`;
}
