import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HabitGarden } from '../Habits/HabitGarden';
import { CoursesList } from '../Learning/CoursesList';
import { FavoriteQuotes } from '../../pages/FavoriteQuotes';
import Achievements from '../../pages/Achievements';
import { UnderlineTabBar } from '../common/UnderlineTabBar';

const PERSONAL_GROWTH_TABS = [
  { id: 'habits', label: 'Habits' },
  { id: 'learning', label: 'Learning' },
  { id: 'favorite-quotes', label: 'Favorite Quotes' },
  { id: 'achievements', label: 'Achievements' },
] as const;

type PersonalGrowthTab = (typeof PERSONAL_GROWTH_TABS)[number]['id'];

const isPersonalGrowthTab = (tab: string | null): tab is PersonalGrowthTab =>
  PERSONAL_GROWTH_TABS.some((t) => t.id === tab);

export const PersonalGrowth: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: PersonalGrowthTab = useMemo(() => {
    const tab = searchParams.get('tab');
    return isPersonalGrowthTab(tab) ? tab : 'habits';
  }, [searchParams]);

  return (
    <div className="w-full min-w-0 max-w-[1800px] mx-auto box-border space-y-3">
      <UnderlineTabBar
        tabs={PERSONAL_GROWTH_TABS}
        value={activeTab}
        onChange={(id) => setSearchParams({ tab: id }, { replace: true })}
      />
      {activeTab === 'habits' && <HabitGarden />}
      {activeTab === 'learning' && <CoursesList />}
      {activeTab === 'favorite-quotes' && <FavoriteQuotes />}
      {activeTab === 'achievements' && <Achievements />}
    </div>
  );
};
