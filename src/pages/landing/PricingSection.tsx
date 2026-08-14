import React, { useState } from 'react';
import { Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { THEME_BRAND_GRADIENT_TEXT_CLASS } from '../../constants/appThemeClasses';
import {
  LANDING_FREE_HIGHLIGHTS,
  LANDING_PLAN_META,
  LANDING_PREMIUM_HIGHLIGHTS,
  PRICING_LIMIT_ROWS,
} from '../../constants/planCatalog';
import { BillingCycle, PRICES } from './content';
import { HighlightList, PrimaryButton, Section, SectionHeader } from './ui';

const BillingToggle: React.FC<{
  cycle: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
}> = ({ cycle, onChange }) => (
  <div className="flex justify-center mb-8">
    <div className="flex w-full max-w-sm rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
      {([
        ['monthly', 'Monthly'],
        ['one-time', 'One-time'],
      ] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            cycle === value
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {label}
          {value === 'one-time' && (
            <span className="ml-1 text-xs text-green-700 dark:text-green-300">Lifetime</span>
          )}
        </button>
      ))}
    </div>
  </div>
);

const LimitsCompare: React.FC = () => (
  <div className="mb-8 max-w-3xl mx-auto overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80">
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/50">
          <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Limit</th>
          <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Free</th>
          <th className="px-4 py-3 text-left font-medium text-purple-700 dark:text-purple-300">Premium</th>
        </tr>
      </thead>
      <tbody>
        {PRICING_LIMIT_ROWS.map((row) => (
          <tr key={row.label} className="border-b border-gray-100 dark:border-gray-700/80 last:border-0">
            <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">{row.label}</td>
            <td className="px-4 py-2.5 text-gray-900 dark:text-white">{row.free}</td>
            <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{row.premium}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const LandingPricing: React.FC<{ onPremium: (cycle: BillingCycle) => void }> = ({
  onPremium,
}) => {
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const navigate = useNavigate();
  const price = cycle === 'one-time' ? PRICES.lifetime : PRICES.monthly;
  const period = cycle === 'one-time' ? 'lifetime' : 'month';
  const { free, premium } = LANDING_PLAN_META;

  return (
    <Section id="pricing" className="bg-gradient-to-b from-white to-gray-50/80 dark:from-gray-900 dark:to-gray-800/50">
      <SectionHeader title="Pricing" subtitle="Simple limits on Free. Premium removes caps and unlocks every module." />
      <BillingToggle cycle={cycle} onChange={setCycle} />
      <LimitsCompare />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{free.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{free.description}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            $0<span className="text-base font-normal text-gray-500">/forever</span>
          </p>
          <HighlightList items={LANDING_FREE_HIGHLIGHTS} />
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Last Wish and other Premium modules not included.</p>
          <PrimaryButton variant="solid" className="mt-6 w-full" onClick={() => navigate('/auth')}>
            {free.cta}
          </PrimaryButton>
        </div>

        <div className="relative rounded-xl border-2 border-purple-500 dark:border-purple-400 bg-white dark:bg-gray-800 p-6 flex flex-col shadow-lg">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-700">
            <Zap className="w-3.5 h-3.5" /> Includes Last Wish
          </span>
          <h3 className={`text-xl font-semibold mb-1 ${THEME_BRAND_GRADIENT_TEXT_CLASS}`}>{premium.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{premium.description}</p>
          <p className={`text-3xl font-bold mb-1 ${THEME_BRAND_GRADIENT_TEXT_CLASS}`}>
            ${price}
            <span className="text-base font-normal text-purple-600 dark:text-purple-400">/{period}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {cycle === 'monthly' ? premium.monthlyNote : premium.lifetimeNote}
          </p>
          <HighlightList items={LANDING_PREMIUM_HIGHLIGHTS} variant="premium" />
          <PrimaryButton className="mt-6 w-full" onClick={() => onPremium(cycle)}>
            {cycle === 'one-time' ? premium.ctaLifetime : premium.ctaMonthly}
          </PrimaryButton>
        </div>
      </div>
    </Section>
  );
};
