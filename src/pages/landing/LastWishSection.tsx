import React from 'react';
import { Clock, Heart } from 'lucide-react';
import { THEME_BRAND_GRADIENT_TEXT_CLASS } from '../../constants/appThemeClasses';
import { LAST_WISH_PRODUCT } from '../../constants/productAreas';
import { LAST_WISH_LANDING } from './content';
import { scrollToId } from './hooks';
import { GhostButton, HighlightList, Section, SectionHeader } from './ui';

export const LandingLastWish: React.FC = () => (
  <Section
    id="last-wish"
    className="bg-gradient-to-br from-blue-50 via-purple-50/80 to-white dark:from-gray-900 dark:via-purple-950/30 dark:to-gray-900"
  >
    <SectionHeader
      title={LAST_WISH_PRODUCT.title}
      subtitle={LAST_WISH_LANDING.subtitle}
    />
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      <div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{LAST_WISH_PRODUCT.summary}</p>
        <HighlightList items={LAST_WISH_LANDING.points} />
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-purple-700 dark:text-purple-300">
          Premium only · included with every Premium plan
        </p>
        <GhostButton className="mt-6" onClick={() => scrollToId('pricing')}>
          See Premium pricing
        </GhostButton>
      </div>

      <div className="relative rounded-2xl border-2 border-purple-200/80 bg-white/90 p-5 shadow-lg dark:border-purple-800 dark:bg-gray-800/90">
        <div className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-primary opacity-10 blur-2xl" />
        <div className="relative flex items-start gap-3 mb-4">
          <div className="rounded-lg bg-gradient-primary p-2 text-white">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <p className={`font-semibold ${THEME_BRAND_GRADIENT_TEXT_CLASS}`}>Last Wish capsule</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sample dashboard widget</p>
          </div>
        </div>
        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-4 dark:border-purple-900/50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="flex items-center gap-2 text-sm text-purple-800 dark:text-purple-200">
            <Clock className="h-4 w-4" />
            Next check-in
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {LAST_WISH_LANDING.sampleCheckIn}
          </p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Check in on schedule to keep your capsule private until you&apos;re ready.
          </p>
        </div>
      </div>
    </div>
  </Section>
);
