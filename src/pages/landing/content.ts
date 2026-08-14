import { Globe, Handshake, PiggyBank, type LucideIcon } from 'lucide-react';

export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.balanze.app';
export const DEMO_PATH = '/dashboard-demo-only';
export const PRODUCT_HUNT_URL =
  'https://www.producthunt.com/products/balanze?embed=true&utm_source=badge-featured&utm_medium=badge&utm_source=badge-balanze';
export const PRODUCT_HUNT_BADGE =
  'https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1033754&theme=light&t=1762271112892';

export const SEO = {
  title: 'Balanze Finance - Personal Finance Management',
  description:
    'Track spending, manage budgets, lend & borrow, and hit savings goals — with multi-currency support on web and Android.',
  url: 'https://balanze.cash',
  image: 'https://balanze.cash/main-dashboard.png',
} as const;

export const NAV_LINKS = [
  { id: 'outcomes', label: 'Features' },
  { id: 'pricing', label: 'Pricing' },
  { path: '/help-center', label: 'Help Center' },
] as const;

export const PROOF_ITEMS = [
  'Free plan — no card to sign up',
  'USD, BDT, and more currencies',
  'Works on web and Android',
  'Screenshots show the real signed-in UI',
] as const;

export const OUTCOMES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: PiggyBank,
    title: 'Know what left the account',
    description: 'Spending and budgets by category, so you can spot drift early.',
  },
  {
    icon: Handshake,
    title: 'Stop losing track of IOUs',
    description: 'Lent & borrow shows who still owes you — and what you owe back.',
  },
  {
    icon: Globe,
    title: 'Run more than one currency',
    description: 'Separate views per currency when your life isn’t all in one wallet.',
  },
];

export const HERO_SHOT = {
  src: '/main-dashboard.png',
  alt: 'Balanze dashboard overview',
  title: 'Dashboard',
  caption: 'Balances, cashflow, and the widgets you actually use.',
} as const;

export const PRODUCT_SHOTS = [
  HERO_SHOT,
  {
    src: '/info-feature-1.png',
    alt: 'Lent and borrow tracking',
    title: 'Lent & borrow',
    caption: 'Outstanding amounts per person, not a messy notes app.',
  },
  {
    src: '/info-feature-2.png',
    alt: 'Multi-currency details',
    title: 'Per-currency detail',
    caption: 'USD and BDT side by side when you need both.',
  },
] as const;

export type BillingCycle = 'monthly' | 'one-time';

export const PRICES = { monthly: 7.99, lifetime: 199.99 } as const;

export const LAST_WISH_LANDING = {
  subtitle: 'A digital time capsule for the people who matter — delivered only when you stop checking in.',
  points: [
    'Set a check-in schedule you control',
    'Trusted contacts receive your message if you miss check-ins',
    'Messages, notes, and attachments in one secure capsule',
  ],
  sampleCheckIn: '11 days',
} as const;

export const FAQS = [
  {
    question: 'Is there a free plan?',
    answer:
      'Yes. Free stays free with clear limits (3 accounts, 1 currency, 25 transactions a month). Premium removes those caps and adds lend & borrow, exports, Last Wish, and more.',
  },
  {
    question: 'Do I need a card to sign up?',
    answer: 'No. Creating an account is free and doesn’t require a card.',
  },
  {
    question: 'Can I cancel Premium?',
    answer: 'Yes, anytime. Lifetime is a one-time payment — no renewal.',
  },
  {
    question: 'Is my data secure?',
    answer: 'We use industry-standard encryption and the same security practices you’d expect for financial data.',
  },
  {
    question: 'Can I export my data?',
    answer: 'On Premium: CSV, Excel, and PDF whenever you need a backup or spreadsheet.',
  },
] as const;
