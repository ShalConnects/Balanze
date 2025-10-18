import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Search, User } from 'lucide-react';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export const FavoriteQuotes: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { favoriteQuotes, removeFavoriteQuote, loadFavoriteQuotes, setCurrentUserId } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Load favorite quotes and set current user ID when user changes
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      loadFavoriteQuotes(user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [user?.id, setCurrentUserId, loadFavoriteQuotes]);

  // Filter quotes based on search
  const filteredQuotes = favoriteQuotes
    .filter(quote => {
      const matchesSearch = quote.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.author.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'financial':
        return '💰';
      case 'motivation':
        return '💪';
      case 'success':
        return '🎯';
      case 'wisdom':
        return '🧠';
      default:
        return '💭';
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'financial':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'motivation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'success':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'wisdom':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (favoriteQuotes.length === 0) {
    return (
      <div className="w-full py-6 sm:py-8">
        <div className="max-w-4xl mx-auto px-2 sm:px-3 lg:px-4 xl:px-6">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-3 sm:mb-4">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
              No Favorite Quotes Yet
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-4">
              Start collecting your favorite motivational quotes by clicking the heart icon on any quote you love!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-4xl mx-auto px-2 sm:px-3 lg:px-4 xl:px-6">
        {/* Compact Header - Mobile Optimized */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
              Favorite Quotes
            </h1>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
              {filteredQuotes.length}/{favoriteQuotes.length}
            </span>
          </div>
        </div>

        {/* Sticky Search - Always Visible */}
        <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 pb-2 sm:pb-3 mb-3 sm:mb-4 -mx-2 sm:-mx-3 lg:-mx-4 xl:-mx-6 px-2 sm:px-3 lg:px-4 xl:px-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search quotes or authors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base shadow-sm"
            />
          </div>
        </div>

        {/* Simple Quote List - Responsive */}
        <div className="space-y-3 sm:space-y-4">
          {filteredQuotes.map((quote) => (
            <div
              key={quote.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                    <span className="text-sm sm:text-base">{getCategoryIcon(quote.category)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>
                      {quote.category || 'General'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <blockquote className="text-gray-900 dark:text-white text-sm sm:text-base font-medium mb-2 sm:mb-3 leading-relaxed">
                    "{quote.quote}"
                  </blockquote>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <cite className="text-gray-600 dark:text-gray-300 font-medium not-italic text-xs sm:text-sm">
                      — {quote.author}
                    </cite>
                  </div>
                </div>
                <button
                  onClick={async () => await removeFavoriteQuote(quote.id)}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex-shrink-0 touch-manipulation"
                  title="Remove from favorites"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State for Filtered Results - Responsive */}
        {filteredQuotes.length === 0 && favoriteQuotes.length > 0 && (
          <div className="text-center py-6 sm:py-8">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1 sm:mb-2">
              No quotes found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
              Try adjusting your search terms
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 

