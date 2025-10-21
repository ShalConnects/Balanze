// Badge Collection Component
// Displays a collection of achievement badges with filtering and organization

import React, { useState, useEffect } from 'react';
import { BadgeCollectionProps, AchievementCategory, AchievementRarity } from '../../types/achievement';
import { Badge } from './Badge';
import { Filter, Trophy, Star, Award, Crown, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  achievements,
  showProgress = true,
  filterByCategory,
  filterByRarity
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');

  const categories: { value: AchievementCategory | 'all'; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Trophy className="w-4 h-4" /> },
    { value: 'tracking', label: 'Tracking', icon: <Award className="w-4 h-4" /> },
    { value: 'accounts', label: 'Accounts', icon: <Trophy className="w-4 h-4" /> },
    { value: 'savings', label: 'Savings', icon: <Crown className="w-4 h-4" /> },
    { value: 'lend_borrow', label: 'Lend & Borrow', icon: <Award className="w-4 h-4" /> },
    { value: 'purchases', label: 'Purchases', icon: <Trophy className="w-4 h-4" /> },
    { value: 'analytics', label: 'Analytics', icon: <Award className="w-4 h-4" /> },
    { value: 'donations', label: 'Donations', icon: <Crown className="w-4 h-4" /> },
    { value: 'consistency', label: 'Consistency', icon: <Sparkles className="w-4 h-4" /> },
    { value: 'premium', label: 'Premium', icon: <Star className="w-4 h-4" /> }
  ];

  const rarities: { value: AchievementRarity | 'all'; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'text-gray-500' },
    { value: 'bronze', label: 'Bronze', color: 'text-yellow-600' },
    { value: 'silver', label: 'Silver', color: 'text-gray-600' },
    { value: 'gold', label: 'Gold', color: 'text-yellow-500' },
    { value: 'diamond', label: 'Diamond', color: 'text-blue-600' },
    { value: 'rainbow', label: 'Rainbow', color: 'text-purple-600' }
  ];

  // Cache for achievements by category
  const [achievementsCache, setAchievementsCache] = useState<Record<string, any[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  
  // Fetch achievements for a specific category
  const fetchAchievementsForCategory = async (category: string) => {
    if (achievementsCache[category] || loadingCategories.has(category)) {
      return; // Already cached or loading
    }
    
    setLoadingCategories(prev => new Set(prev).add(category));
    
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      setAchievementsCache(prev => ({
        ...prev,
        [category]: data || []
      }));
    } catch (error) {
      console.error(`Error fetching achievements for category ${category}:`, error);
    } finally {
      setLoadingCategories(prev => {
        const newSet = new Set(prev);
        newSet.delete(category);
        return newSet;
      });
    }
  };

  // Get achievements for the active tab
  const getAchievementsForActiveTab = () => {
    if (activeTab === 'all') {
      // For 'all' tab, combine all cached achievements
      const allCached = Object.values(achievementsCache).flat();
      // If we don't have all achievements cached yet, return empty array
      // The useEffect will fetch them
      return allCached;
    }
    return achievementsCache[activeTab] || [];
  };

  const currentAchievements = getAchievementsForActiveTab();

  // Fetch achievements when active tab changes
  useEffect(() => {
    if (activeTab === 'all') {
      // For 'all' tab, fetch all achievements at once
      const fetchAllAchievements = async () => {
        try {
          const { data, error } = await supabase
            .from('achievements')
            .select('*')
            .eq('is_active', true)
            .order('category', { ascending: true });
          
          if (error) throw error;
          
          // Group by category and cache
          const grouped = data?.reduce((groups, achievement) => {
            const category = achievement.category || 'other';
            if (!groups[category]) {
              groups[category] = [];
            }
            groups[category].push(achievement);
            return groups;
          }, {} as Record<string, any[]>) || {};
          
          setAchievementsCache(grouped);
        } catch (error) {
          console.error('Error fetching all achievements:', error);
        }
      };
      fetchAllAchievements();
    } else {
      // For specific category, fetch only that category
      fetchAchievementsForCategory(activeTab);
    }
  }, [activeTab]);

  // Create a map of user's earned achievements for quick lookup
  const earnedAchievementIds = new Set(achievements.map(a => a.achievement?.id));

  // Generate progress text for unearned badges
  const getProgressText = (achievement: any) => {
    const requirements = achievement.requirements;
    
    // Handle different achievement types with fallbacks for undefined values
    if (requirements.action === 'create_account') {
      return `0/${requirements.count || 1} accounts`;
    } else if (requirements.action === 'create_transaction') {
      return `0/${requirements.count || 1} transactions`;
    } else if (requirements.action === 'daily_tracking') {
      // Check if this is a high-streak achievement (30+ days) vs regular (7 days)
      const isHighStreak = achievement.name?.toLowerCase().includes('consistent') || 
                          achievement.name?.toLowerCase().includes('power') ||
                          achievement.rarity === 'gold' || achievement.rarity === 'diamond';
      return `0/${requirements.streak || (isHighStreak ? 30 : 7)} days`;
    } else if (requirements.action === 'savings_amount') {
      return `$0 / $${requirements.amount || 100}`;
    } else if (requirements.action === 'multi_currency') {
      return `0/${requirements.currencies || 2} currencies`;
    } else if (requirements.action === 'create_lend_record') {
      return `0/${requirements.count || 1} loans`;
    } else if (requirements.action === 'create_borrow_record') {
      return `0/${requirements.count || 1} borrows`;
    } else if (requirements.action === 'create_donation') {
      return `0/${requirements.count || 1} donations`;
    } else if (requirements.action === 'donation_total') {
      return `$0 / $${requirements.amount || 100}`;
    } else if (requirements.action === 'daily_login') {
      // Check if this is a high-streak achievement (30+ days) vs regular (3-7 days)
      const isHighStreak = achievement.name?.toLowerCase().includes('power') || 
                          achievement.name?.toLowerCase().includes('loyal') ||
                          achievement.rarity === 'diamond';
      const isVeryHighStreak = achievement.name?.toLowerCase().includes('100') ||
                              (achievement.rarity === 'diamond' && achievement.name?.toLowerCase().includes('consecutive'));
      return `0/${requirements.streak || (isVeryHighStreak ? 100 : isHighStreak ? 30 : 7)} days`;
    } else if (requirements.action === 'view_analytics') {
      return `0/${requirements.count || 5} views`;
    } else if (requirements.action === 'create_investment') {
      return `0/${requirements.count || 1} investments`;
    } else if (requirements.action === 'upload_attachment') {
      return `0/${requirements.count || 3} attachments`;
    } else if (requirements.action === 'settle_loan') {
      return `0/${requirements.count || 3} settlements`;
    } else if (requirements.action === 'complete_goal') {
      return `0/${requirements.count || 1} goals`;
    } else if (requirements.action === 'use_premium_feature') {
      return `0/${requirements.count || 1} features`;
    } else if (requirements.action === 'create_last_wish') {
      return `0/${requirements.count || 1} wishes`;
    } else {
      return 'Not started';
    }
  };


  return (
    <div className="space-y-8">



      {/* Tab Content - Badge Grid */}
      {currentAchievements.length > 0 ? (
        <div className="space-y-6">
          <div className="space-y-6">
            
            {/* Badge Cards Grid - Minimal */}
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {currentAchievements
                .sort((a, b) => {
                  const aEarned = earnedAchievementIds.has(a.id);
                  const bEarned = earnedAchievementIds.has(b.id);
                  
                  // Show earned badges first
                  if (aEarned && !bEarned) return -1;
                  if (!aEarned && bEarned) return 1;
                  
                  // If both earned or both unearned, sort by name
                  return a.name.localeCompare(b.name);
                })
                .map((achievement) => {
                const isEarned = earnedAchievementIds.has(achievement.id);
                
                return (
                      <div
                        key={achievement.id}
                        className={`rounded-xl p-3 sm:p-4 border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                          isEarned
                            ? 'border-blue-400 dark:border-blue-500 bg-blue-50/80 dark:bg-blue-900/20 hover:shadow-blue-200 dark:hover:shadow-blue-800'
                            : 'border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/40 hover:shadow-gray-200 dark:hover:shadow-gray-700'
                        }`}
                        style={isEarned ? { background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)' } : {}}
                      >
                    <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3">
                      {/* Badge Icon */}
                      <div className={`p-2 sm:p-3 rounded-xl shadow-sm ${
                        isEarned 
                          ? 'bg-gradient-to-r from-blue-100/60 to-purple-100/60 shadow-blue-50' 
                          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 shadow-gray-100 dark:shadow-gray-600'
                      }`}>
                        <div className={`text-lg sm:text-xl ${
                          isEarned 
                            ? 'text-blue-600 dark:text-blue-400' 
                            : 'text-white'
                        }`}>
                          {achievement.icon}
                        </div>
                      </div>
                      
                      {/* Badge Info - Enhanced */}
                      <div className="space-y-1 sm:space-y-2">
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight text-xs sm:text-sm">
                          {achievement.name}
                        </h4>

                        {/* How to Earn Hint */}
                        <div className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                          {achievement.description}
                        </div>

                        {/* Rarity Badge */}
                        <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                          achievement.rarity === 'bronze' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          achievement.rarity === 'silver' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                          achievement.rarity === 'gold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
                          achievement.rarity === 'diamond' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                        }`}>
                          {achievement.rarity?.toUpperCase()}
                        </div>

                        {/* Progress Status */}
                        {isEarned ? (
                          <div className="flex items-center justify-center space-x-1 sm:space-x-2 text-blue-600 dark:text-blue-400">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                            <span className="text-xs sm:text-sm font-semibold">Earned!</span>
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 font-medium text-xs">
                            {getProgressText(achievement)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="glassmorphism-container rounded-2xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            No badges found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Try adjusting your filters to see more badges, or start using Balanze features to earn your first badge!
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>Adjust filters above to see more badges</span>
          </div>
        </div>
      )}
    </div>
  );
};
