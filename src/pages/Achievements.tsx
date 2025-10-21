// Achievements Page
// Main page for viewing and managing achievement badges

import React, { useEffect } from 'react';
import { useAchievementStore } from '../store/achievementStore';
import { useAuthStore } from '../store/authStore';
import { BadgeCollection } from '../components/Achievements/BadgeCollection';
import { Trophy, Star, Award, Crown, Sparkles, TrendingUp } from 'lucide-react';

const Achievements: React.FC = () => {
  const { 
    userAchievements, 
    summary, 
    loading, 
    error,
    fetchUserAchievements,
    fetchAchievementSummary 
  } = useAchievementStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      fetchUserAchievements(user.id);
      fetchAchievementSummary(user.id);
    }
  }, [user, fetchUserAchievements, fetchAchievementSummary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Trophy className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Achievements
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => user && fetchUserAchievements(user.id)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section - Split Layout */}
        <div className="glassmorphism-container rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 dark:border-gray-700/50 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
            {/* Left Side - Title & Description */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-gradient-primary rounded-xl shadow-lg">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                  Achievement Badges
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                Unlock badges by using Balanze features and building good financial habits.
                Each badge represents a milestone in your financial journey.
              </p>
            </div>

            {/* Right Side - Stats & Progress */}
            {summary && (
              <div className="flex-1 lg:max-w-md">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-primary">{summary.total_achievements}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Badges Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gradient-primary">{summary.total_points}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Points</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                      {summary.total_achievements}/31 badges
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 sm:h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min((summary.total_achievements / 31) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                      {Math.round((summary.total_achievements / 31) * 100)}% Complete
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* Badge Collection */}
        <div className="glassmorphism-container rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/20 dark:border-gray-700/50 mb-6 sm:mb-8">
          <BadgeCollection
            achievements={userAchievements}
            showProgress={true}
          />
        </div>

      </div>
    </div>
  );
};

export default Achievements;
