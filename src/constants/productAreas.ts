/** Product areas — shared by feature.md, live demo widgets, and pricing cross-reference. */

export type DemoStat = {
  title: string;
  value: string;
  color?: 'blue' | 'green' | 'red' | 'gray' | 'yellow' | 'purple' | 'orange';
};

export type ProductArea = {
  id: string;
  title: string;
  summary: string;
  /** Minimum plan for full access. */
  tier: 'free' | 'premium';
  inLiveDemo: boolean;
  demoStats?: DemoStat[];
};

export const PRODUCT_AREAS: ProductArea[] = [
  {
    id: 'currencies',
    title: 'Multi-currency balances',
    summary: 'Separate overview per currency (USD, BDT, and more on Premium).',
    tier: 'free',
    inLiveDemo: true,
  },
  {
    id: 'donations',
    title: 'Donations & savings',
    summary: 'Track charitable giving and savings alongside everyday spending.',
    tier: 'free',
    inLiveDemo: true,
  },
  {
    id: 'purchases',
    title: 'Purchases',
    summary: 'Plan purchases, track what you bought, and see planned spend.',
    tier: 'free',
    inLiveDemo: true,
  },
  {
    id: 'lend-borrow',
    title: 'Lent & borrow',
    summary: 'Who owes you and what you owe — per person and currency.',
    tier: 'premium',
    inLiveDemo: true,
  },
  {
    id: 'transfers',
    title: 'Transfers',
    summary: 'Move money between accounts, including currency and DPS transfers.',
    tier: 'free',
    inLiveDemo: true,
    demoStats: [
      { title: 'This month', value: '9', color: 'blue' },
      { title: 'Moved between accounts', value: '$2,150', color: 'purple' },
    ],
  },
  {
    id: 'clients',
    title: 'Clients',
    summary: 'Light CRM: clients, tasks, orders, and invoices.',
    tier: 'free',
    inLiveDemo: true,
    demoStats: [
      { title: 'Active clients', value: '5', color: 'blue' },
      { title: 'Open invoices', value: '$1,840', color: 'yellow' },
      { title: 'Orders (Oct)', value: '6', color: 'green' },
    ],
  },
  {
    id: 'investments',
    title: 'Investments',
    summary: 'Portfolio assets, transactions, goals, and performance.',
    tier: 'free',
    inLiveDemo: true,
    demoStats: [
      { title: 'Portfolio', value: '$24,800', color: 'green' },
      { title: 'Positions', value: '4', color: 'blue' },
    ],
  },
  {
    id: 'prize-bonds',
    title: 'Prize bonds',
    summary: 'Holdings and face value tracking.',
    tier: 'free',
    inLiveDemo: true,
    demoStats: [
      { title: 'Bonds held', value: '32', color: 'blue' },
      { title: 'Face value', value: '৳36,000', color: 'purple' },
    ],
  },
  {
    id: 'recurring',
    title: 'Recurring bills',
    summary: 'Automate repeating income and expenses.',
    tier: 'premium',
    inLiveDemo: true,
    demoStats: [
      { title: 'Active', value: '7', color: 'blue' },
      { title: 'Monthly total', value: '$892', color: 'yellow' },
    ],
  },
  {
    id: 'analytics',
    title: 'Analytics',
    summary: 'Spending trends, budgets, and currency-level insight.',
    tier: 'premium',
    inLiveDemo: true,
    demoStats: [
      { title: 'Spend (30 days)', value: '$3,240', color: 'red' },
      { title: 'vs last month', value: '−8%', color: 'green' },
    ],
  },
  {
    id: 'habits',
    title: 'Habit garden',
    summary: 'Streaks and habits inside Personal Growth.',
    tier: 'free',
    inLiveDemo: true,
    demoStats: [
      { title: 'Current streak', value: '11 days', color: 'green' },
      { title: 'Tracking', value: '4 habits', color: 'purple' },
    ],
  },
  {
    id: 'learning',
    title: 'Learning',
    summary: 'Courses and modules for financial literacy.',
    tier: 'free',
    inLiveDemo: true,
    demoStats: [
      { title: 'Courses', value: '2 enrolled', color: 'blue' },
      { title: 'Last opened', value: 'Budget basics', color: 'yellow' },
    ],
  },
  {
    id: 'last-wish',
    title: 'Last Wish',
    summary: 'Digital time capsule with scheduled check-ins and delivery.',
    tier: 'premium',
    inLiveDemo: true,
  },
  {
    id: 'notes',
    title: 'Notes & todos',
    summary: 'Notes, diary entries, and task lists on the dashboard.',
    tier: 'free',
    inLiveDemo: true,
  },
  {
    id: 'transactions',
    title: 'Recent transactions',
    summary: 'Latest activity across accounts and categories.',
    tier: 'free',
    inLiveDemo: true,
  },
];

export const LAST_WISH_PRODUCT = PRODUCT_AREAS.find((a) => a.id === 'last-wish')!;

export const DEMO_OVERVIEW_WIDGETS = PRODUCT_AREAS.filter(
  (a) => a.inLiveDemo && a.demoStats
).map((a) => ({ id: a.id, title: a.title, stats: a.demoStats! }));

export const LIVE_DEMO_AREA_LABELS = PRODUCT_AREAS.filter((a) => a.inLiveDemo).map(
  (a) => a.title
);
