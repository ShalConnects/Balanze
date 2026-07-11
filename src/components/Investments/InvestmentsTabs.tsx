import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INVESTMENTS_PAGE_TABS } from '../../lib/investmentsNav';
import { UnderlineTabBar } from '../common/UnderlineTabBar';

export const InvestmentsTabs: React.FC = () => {
  const { t } = useTranslation();
  const [params, setSearchParams] = useSearchParams();
  const activeTab = params.get('tab') || '';

  return (
    <UnderlineTabBar
      tabs={INVESTMENTS_PAGE_TABS.map(({ tab, labelKey }) => ({
        id: tab ?? '',
        label: t(labelKey),
      }))}
      value={activeTab}
      onChange={(id) => setSearchParams(id ? { tab: id } : {}, { replace: true })}
    />
  );
};
