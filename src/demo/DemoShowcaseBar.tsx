import React from 'react';
import { LIVE_DEMO_AREA_LABELS } from '../constants/productAreas';

export const DemoShowcaseBar: React.FC = () => (
  <div className="mb-6 rounded-lg border border-blue-200/60 bg-blue-50/80 px-3 py-3 dark:border-blue-800/50 dark:bg-blue-900/20">
    <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
      Sample dashboard — scroll to explore each area
    </p>
    <div className="flex flex-wrap gap-1.5">
      {LIVE_DEMO_AREA_LABELS.map((label) => (
        <span
          key={label}
          className="rounded-md bg-white/90 px-2 py-0.5 text-[11px] text-gray-700 dark:bg-gray-800/90 dark:text-gray-300"
        >
          {label}
        </span>
      ))}
    </div>
  </div>
);
