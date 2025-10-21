// src/components/ArticleTourManager.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play, Target, Users, TrendingUp, Settings } from 'lucide-react';
import ArticleBasedTour from './ArticleBasedTour';
import { MOCK_ARTICLES } from '../pages/KBArticlePage';
import { TOPIC_CLUSTERS } from '../data/articles';

interface ArticleTourManagerProps {
  className?: string;
}

interface TourOption {
  id: string;
  title: string;
  description: string;
  articleSlug: string;
  icon: React.ReactNode;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
}

// Generate tour options from help center articles
function generateTourOptions(): TourOption[] {
  console.log('ArticleTourManager: Generating tour options...');
  const options: TourOption[] = [];
  
  // Getting Started tours
  if (MOCK_ARTICLES['getting-started-guide']) {
    console.log('ArticleTourManager: Found getting-started-guide article');
    options.push({
      id: 'getting-started',
      title: 'Getting Started with Balanze',
      description: 'Learn the basics of setting up your account and tracking finances',
      articleSlug: 'getting-started-guide',
      icon: <BookOpen className="w-5 h-5" />,
      category: 'Getting Started',
      difficulty: 'beginner',
      estimatedTime: '5-10 min'
    });
  } else {
    console.log('ArticleTourManager: getting-started-guide article NOT found');
  }

  // Account Management tours
  if (MOCK_ARTICLES['create-first-account']) {
    options.push({
      id: 'account-setup',
      title: 'Account Setup Guide',
      description: 'Step-by-step guide to creating and managing your accounts',
      articleSlug: 'create-first-account',
      icon: <Target className="w-5 h-5" />,
      category: 'Account Management',
      difficulty: 'beginner',
      estimatedTime: '3-5 min'
    });
  }

  // Transaction tours
  if (MOCK_ARTICLES['create-first-transaction']) {
    options.push({
      id: 'transaction-basics',
      title: 'Transaction Basics',
      description: 'Learn how to add and manage your financial transactions',
      articleSlug: 'create-first-transaction',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'Transactions',
      difficulty: 'beginner',
      estimatedTime: '4-6 min'
    });
  }

  // Analytics tours
  if (MOCK_ARTICLES['analytics-overview']) {
    options.push({
      id: 'analytics-tour',
      title: 'Understanding Analytics',
      description: 'Explore your financial insights and reporting features',
      articleSlug: 'analytics-overview',
      icon: <Users className="w-5 h-5" />,
      category: 'Analytics',
      difficulty: 'intermediate',
      estimatedTime: '6-8 min'
    });
  }

  // Settings tours
  if (MOCK_ARTICLES['settings-page-comprehensive-guide']) {
    options.push({
      id: 'settings-tour',
      title: 'Settings & Preferences',
      description: 'Customize your Balanze experience with settings and preferences',
      articleSlug: 'settings-page-comprehensive-guide',
      icon: <Settings className="w-5 h-5" />,
      category: 'Settings',
      difficulty: 'beginner',
      estimatedTime: '3-5 min'
    });
  }

  console.log('ArticleTourManager: Generated', options.length, 'tour options:', options);
  return options;
}

export default function ArticleTourManager({ className = '' }: ArticleTourManagerProps) {
  console.log('ArticleTourManager: Component rendering...');
  const [selectedTour, setSelectedTour] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourOptions] = useState<TourOption[]>(generateTourOptions());
  const navigate = useNavigate();

  console.log('ArticleTourManager: Tour options state:', tourOptions);

  const handleStartTour = (tourId: string) => {
    console.log('ArticleTourManager: Starting tour', tourId);
    const tour = tourOptions.find(t => t.id === tourId);
    console.log('ArticleTourManager: Tour details', tour);
    setSelectedTour(tourId);
    setShowTour(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
    setSelectedTour(null);
  };

  const handleViewArticle = (articleSlug: string) => {
    navigate(`/kb/${articleSlug}`);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'Getting Started': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Account Management': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Transactions': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Analytics': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Settings': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Interactive Tours
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Learn Balanze through guided, interactive experiences based on our help center articles
        </p>
      </div>

      {/* Tour Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tourOptions.map((tour) => (
          <div
            key={tour.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  {tour.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {tour.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {tour.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(tour.category)}`}>
                {tour.category}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tour.difficulty)}`}>
                {tour.difficulty}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                {tour.estimatedTime}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleStartTour(tour.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Start Tour
              </button>
              <button
                onClick={() => handleViewArticle(tour.articleSlug)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Read Article
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Article-Based Tour Component */}
      {showTour && selectedTour && (
        <>
          {console.log('ArticleTourManager: Rendering ArticleBasedTour with:', {
            showTour,
            selectedTour,
            articleSlug: tourOptions.find(t => t.id === selectedTour)?.articleSlug
          })}
          <ArticleBasedTour
            articleSlug={tourOptions.find(t => t.id === selectedTour)?.articleSlug}
            isOpen={showTour}
            onClose={handleCloseTour}
          />
        </>
      )}
    </div>
  );
}
