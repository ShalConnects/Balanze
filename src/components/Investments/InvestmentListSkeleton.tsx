import React from 'react';
import { LP } from '../common/listPage/listPageLayout';
import {
  ClientCardSkeleton,
  ClientFiltersSkeleton,
  ClientSummaryCardsSkeleton,
  ClientTableSkeleton
} from '../Clients/ClientSkeleton';

/** Loading shell aligned with ClientList / list-page layout; reuses client skeleton building blocks. */
export const InvestmentListSkeleton: React.FC = () => (
  <div className={`${LP.stack} animate-fade-in`}>
    <div className={`${LP.card} relative overflow-hidden pb-[13px] lg:pb-0`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className={`${LP.filterHeader} relative z-10`}>
        <ClientFiltersSkeleton />
      </div>
      <div className="p-4 relative z-10">
        <ClientSummaryCardsSkeleton />
      </div>
      <div className="hidden md:block p-4 relative z-10">
        <ClientTableSkeleton rows={6} />
      </div>
      <div className="md:hidden relative z-10">
        <ClientCardSkeleton count={4} />
      </div>
    </div>
  </div>
);
