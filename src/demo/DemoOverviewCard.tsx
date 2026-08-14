import React from 'react';
import { ArrowRight } from 'lucide-react';
import { StatCard } from '../components/Dashboard/StatCard';
import type { DemoStat } from './demoOverviewWidgets';

export const DemoOverviewCard: React.FC<{ title: string; stats: DemoStat[] }> = ({
  title,
  stats,
}) => (
  <div className="w-full rounded-xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 shadow-sm dark:border-blue-800/50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 lg:p-5">
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
      <span className="flex items-center gap-1 text-sm text-gray-400">
        View all <ArrowRight className="h-4 w-4" />
      </span>
    </div>
    <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 lg:gap-4">
      {stats.map((s) => (
        <StatCard key={s.title} title={s.title} value={s.value} color={s.color || 'blue'} />
      ))}
    </div>
  </div>
);
