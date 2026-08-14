/** Plan feature lines — shared by in-app Plans and landing pricing. */
export type PlanFeatureLine = {
  text: string;
  included: boolean;
  highlight?: boolean;
};

export const FREE_PLAN_FEATURES: PlanFeatureLine[] = [
  { text: 'Basic financial tracking', included: true },
  { text: 'Up to 3 accounts', included: true },
  { text: '1 currency only', included: true },
  { text: '25 transactions per month', included: true },
  { text: '50 purchases (lifetime)', included: true },
  { text: '5 clients limit', included: true },
  { text: 'Personal Growth (Habits & Learning)', included: true },
  { text: 'Basic reports', included: true },
  { text: 'Email support (24–48h response)', included: true },
  { text: 'Basic analytics', included: true },
  { text: 'Custom categories', included: false },
  { text: 'Recurring transactions', included: false },
  { text: 'Lend & borrow tracking', included: false },
  { text: 'Data export', included: false },
  { text: 'Last Wish — digital time capsule', included: false, highlight: true },
];

export const PREMIUM_PLAN_FEATURES: PlanFeatureLine[] = [
  { text: 'Everything in Free', included: true },
  { text: 'Unlimited accounts', included: true },
  { text: 'Unlimited currencies', included: true },
  { text: 'Unlimited transactions', included: true },
  { text: 'Unlimited purchases', included: true },
  { text: 'Unlimited clients', included: true },
  { text: 'Personal Growth (Habits & Learning)', included: true },
  { text: 'Advanced analytics', included: true },
  { text: 'Priority email support (4–8h response)', included: true },
  { text: 'Custom categories', included: true },
  { text: 'Recurring transactions', included: true },
  { text: 'Lend & borrow tracking', included: true },
  { text: 'Advanced reporting', included: true },
  { text: 'Data export (CSV, Excel, PDF)', included: true },
  { text: 'Last Wish — digital time capsule', included: true, highlight: true },
];

/** At-a-glance limits for landing comparison table. */
export const PRICING_LIMIT_ROWS = [
  { label: 'Accounts', free: 'Up to 3', premium: 'Unlimited' },
  { label: 'Currencies', free: '1', premium: 'Unlimited' },
  { label: 'Transactions', free: '25 / month', premium: 'Unlimited' },
  { label: 'Purchases', free: '50 total', premium: 'Unlimited' },
  { label: 'Clients', free: '5', premium: 'Unlimited' },
] as const;

export const LANDING_PLAN_META = {
  free: {
    name: 'Free',
    description: 'Enough to run a small setup.',
    cta: 'Get started free',
  },
  premium: {
    name: 'Premium',
    description: 'Unlimited usage, lend & borrow, exports, and Last Wish.',
    monthlyNote: '14-day trial · first month 50% off',
    lifetimeNote: 'One payment, no renewal',
    ctaMonthly: 'Start free trial',
    ctaLifetime: 'Get lifetime access',
  },
} as const;

/** Short bullets for landing pricing cards. */
export const LANDING_FREE_HIGHLIGHTS = [
  '3 accounts · 1 currency',
  '25 transactions per month',
  'Basic analytics & reports',
  'Habits & learning',
] as const;

export const LANDING_PREMIUM_HIGHLIGHTS = [
  'Unlimited accounts, currencies & transactions',
  'Lend & borrow · recurring bills',
  'Advanced analytics & export',
  'Priority support (4–8h)',
] as const;

/** Paddle checkout modal — premium-only highlights. */
export const PREMIUM_CHECKOUT_FEATURES = [
  'Unlimited accounts',
  'Unlimited currencies',
  'Unlimited transactions',
  'Advanced analytics',
  'Priority email support (4-8h response)',
  'Custom categories',
  'Recurring transactions',
  'Lent & borrow tracking',
  'Data export (PDF/CSV)',
  'Last Wish - Digital Time Capsule',
] as const;
