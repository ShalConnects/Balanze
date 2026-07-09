import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { INVESTMENTS_PAGE_TABS } from '../../lib/investmentsNav';

const TAB_BTN =
  'px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors';
const TAB_ACTIVE = 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400';
const TAB_IDLE =
  'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200';

export const InvestmentsTabs: React.FC = () => {
  const { t } = useTranslation();
  const [params, setSearchParams] = useSearchParams();
  const activeTab = params.get('tab');

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {INVESTMENTS_PAGE_TABS.map(({ tab, labelKey }) => {
        const active = tab ? activeTab === tab : !activeTab;
        return (
          <button
            key={labelKey}
            type="button"
            onClick={() => setSearchParams(tab ? { tab } : {}, { replace: true })}
            className={`${TAB_BTN} ${active ? TAB_ACTIVE : TAB_IDLE}`}
          >
            {t(labelKey)}
          </button>
        );
      })}
    </div>
  );
};
