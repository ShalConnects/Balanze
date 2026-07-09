import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BusinessInvestmentTracker } from '../components/Dashboard/BusinessInvestmentTracker';
import { InvestmentsTabs } from '../components/Investments/InvestmentsTabs';
import { PrizeBondView } from '../components/PrizeBonds/PrizeBondView';
import { isInvestmentsBondsTab } from '../lib/investmentsNav';

export const BusinessInvestments: React.FC = () => {
  const [params] = useSearchParams();
  const bonds = isInvestmentsBondsTab(params.get('tab'));

  return (
    <div className="w-full min-w-0 max-w-[1800px] mx-auto box-border space-y-3">
      <InvestmentsTabs />
      {bonds ? <PrizeBondView /> : <BusinessInvestmentTracker />}
    </div>
  );
};
