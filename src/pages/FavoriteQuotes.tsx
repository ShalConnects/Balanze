import React, { useState, useEffect } from 'react';
import { Heart, Trash2, Search, Filter, Bookmark, Calendar, User, Eye, Quote, ChevronDown, ChevronUp, Grid, List } from 'lucide-react';
import { useNotificationStore, FavoriteQuote } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CustomDropdown } from '../components/Purchases/CustomDropdown';
import { ShowOnDashboardBanner } from '../components/common/ShowOnDashboardBanner';

export const FavoriteQuotes: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { favoriteQuotes, removeFavoriteQuote, loadFavoriteQuotes, setCurrentUserId } = useNotificationStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'author' | 'category'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Load favorite quotes and set current user ID when user changes
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      loadFavoriteQuotes(user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [user?.id, setCurrentUserId, loadFavoriteQuotes]);

  // Check if Quote Widget is hidden on dashboard
  const [showQuoteWidget, setShowQuoteWidget] = useState(() => {
    const saved = localStorage.getItem('showQuoteWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Filter quotes based on search and category
  const filteredQuotes = favoriteQuotes
    .filter(quote => {
      const matchesSearch = quote.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           quote.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || quote.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'author':
          return a.author.localeCompare(b.author);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'financial', label: 'Financial' },
    { value: 'motivation', label: 'Motivation' },
    { value: 'success', label: 'Success' },
    { value: 'wisdom', label: 'Wisdom' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Sort by Date' },
    { value: 'author', label: 'Sort by Author' },
    { value: 'category', label: 'Sort by Category' }
  ];

  const handleShowQuoteWidget = () => {
    setShowQuoteWidget(true);
    localStorage.setItem('showQuoteWidget', 'true');
    navigate('/dashboard');
  };

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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ShowOnDashboardBanner
            isVisible={!showQuoteWidget}
            onShow={handleShowQuoteWidget}
            title="Quote Widget Hidden"
            description="The Quote widget is currently hidden on your dashboard."
            buttonText="Show on Dashboard"
            icon={Quote}
            className="mb-6"
          />

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Favorite Quotes Yet
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start collecting your favorite motivational quotes by clicking the heart icon on any quote you love!
            </p>
            <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700 max-w-sm mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  How to add favorites
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Visit your dashboard and click the heart icon next to any quote that inspires you. 
                Your favorites will appear here for easy access.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Action Buttons */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' 
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <ShowOnDashboardBanner
                isVisible={!showQuoteWidget}
                onShow={handleShowQuoteWidget}
                title="Quote Widget Hidden"
                description="The Quote widget is currently hidden on your dashboard."
                buttonText="Show on Dashboard"
                icon={Quote}
                className="!mb-0 !p-3"
              />
            </div>
          </div>
          
          {/* Collapsible Stats */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-3">
            <button
              onClick={() => setShowStats(!showStats)}
              className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="font-medium text-gray-900 dark:text-white">Quick Stats</span>
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showStats && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Bookmark className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">Total:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{favoriteQuotes.length}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-green-500" />
                    <span className="text-gray-600 dark:text-gray-400">This Month:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {favoriteQuotes.filter(q => {
                        const quoteDate = new Date(q.createdAt);
                        const now = new Date();
                        return quoteDate.getMonth() === now.getMonth() && 
                               quoteDate.getFullYear() === now.getFullYear();
                      }).length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-600 dark:text-gray-400">Authors:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Set(favoriteQuotes.map(q => q.author)).size}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Filter className="w-4 h-4 text-orange-500" />
                    <span className="text-gray-600 dark:text-gray-400">Categories:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {new Set(favoriteQuotes.map(q => q.category).filter(Boolean)).size}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="font-medium text-gray-900 dark:text-white">Filters & Search</span>
              {(searchTerm || selectedCategory !== 'all') && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showFilters && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search quotes or authors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Category Filter */}
                <CustomDropdown
                  options={categories}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Select category"
                  fullWidth={true}
                />

                {/* Sort */}
                <CustomDropdown
                  options={sortOptions}
                  value={sortBy}
                  onChange={(value) => setSortBy(value as 'date' | 'author' | 'category')}
                  placeholder="Sort by"
                  fullWidth={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredQuotes.length} of {favoriteQuotes.length} favorite quotes
          </p>
        </div>

        {/* Quotes Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
              >
                {/* Quote Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getCategoryIcon(quote.category)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>
                      {quote.category || 'General'}
                    </span>
                  </div>
                  <button
                    onClick={async () => await removeFavoriteQuote(quote.id)}
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-3 h-3 text-red-500 hover:text-red-600" />
                  </button>
                </div>

                {/* Quote Text */}
                <blockquote className="text-gray-900 dark:text-white text-sm font-medium mb-3 leading-relaxed line-clamp-4">
                  "{quote.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <cite className="text-gray-600 dark:text-gray-300 font-medium not-italic text-sm">
                      — {quote.author}
                    </cite>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(quote.createdAt), 'MMM d')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredQuotes.map((quote) => (
              <div
                key={quote.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{getCategoryIcon(quote.category)}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>
                        {quote.category || 'General'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <blockquote className="text-gray-900 dark:text-white text-sm font-medium mb-2 leading-relaxed">
                      "{quote.quote}"
                    </blockquote>
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <cite className="text-gray-600 dark:text-gray-300 font-medium not-italic text-sm">
                        — {quote.author}
                      </cite>
                    </div>
                  </div>
                  <button
                    onClick={async () => await removeFavoriteQuote(quote.id)}
                    className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                    title="Remove from favorites"
                  >
                    <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State for Filtered Results */}
        {filteredQuotes.length === 0 && favoriteQuotes.length > 0 && (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No quotes found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Try adjusting your search terms or category filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 

