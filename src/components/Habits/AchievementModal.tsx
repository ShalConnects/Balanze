import React from 'react';
import { X, Trophy } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { AchievementBadge } from './AchievementBadge';
import Modal from 'react-modal';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose }) => {
  const { achievements, unclaimedAchievements, claimAchievement } = useHabitStore();

  const claimedAchievements = achievements.filter(a => a.claimed_at);
  const sortedClaimed = [...claimedAchievements].sort((a, b) => {
    const dateA = a.claimed_at ? new Date(a.claimed_at).getTime() : 0;
    const dateB = b.claimed_at ? new Date(b.claimed_at).getTime() : 0;
    return dateB - dateA;
  });

  const handleClaim = async (achievementId: string) => {
    await claimAchievement(achievementId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      overlayClassName="fixed inset-0"
      contentLabel="Achievements"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-gradient-primary rounded-lg flex-shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Achievements</h2>
              {unclaimedAchievements.length > 0 && (
                <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-0.5">
                  {unclaimedAchievements.length} new achievement{unclaimedAchievements.length !== 1 ? 's' : ''} to claim!
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg p-1 sm:p-1.5 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          {/* Unclaimed Achievements */}
          {unclaimedAchievements.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
                New Achievements
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {unclaimedAchievements.map((achievement) => (
                  <div key={achievement.id} className="relative">
                    <AchievementBadge achievement={achievement} size="md" />
                    <button
                      onClick={() => handleClaim(achievement.id)}
                      className="mt-1.5 sm:mt-2 w-full px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-gradient-primary hover:bg-gradient-primary-hover rounded-lg transition-colors"
                    >
                      Claim
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Claimed Achievements */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2 sm:mb-3">
              {unclaimedAchievements.length > 0 ? 'Your Achievements' : 'All Achievements'}
            </h3>
            {sortedClaimed.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                {sortedClaimed.map((achievement) => (
                  <AchievementBadge key={achievement.id} achievement={achievement} size="md" />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm sm:text-base px-4">No achievements yet. Complete habits to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

