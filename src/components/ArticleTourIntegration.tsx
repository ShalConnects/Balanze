// src/components/ArticleTourIntegration.tsx
import React, { useState } from 'react';
import { Play, BookOpen, Clock, Users } from 'lucide-react';
import ArticleBasedTour from './ArticleBasedTour';

interface ArticleTourIntegrationProps {
  articleSlug: string;
  articleTitle: string;
  estimatedReadTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  className?: string;
}

export default function ArticleTourIntegration({
  articleSlug,
  articleTitle,
  estimatedReadTime = '5 min',
  difficulty = 'beginner',
  className = ''
}: ArticleTourIntegrationProps) {
  const [showTour, setShowTour] = useState(false);

  const handleStartTour = () => {
    setShowTour(true);
  };

  const handleCloseTour = () => {
    setShowTour(false);
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

  return (
    <>
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Interactive Tour Available
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Experience this guide as an interactive tour
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {estimatedReadTime}
          </span>
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Interactive
          </span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleStartTour}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Start Interactive Tour
          </button>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Read Article
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Tip:</strong> The interactive tour will guide you through the actual interface while you follow along with this article.
          </p>
        </div>
      </div>

      {/* Article-Based Tour */}
      {showTour && (
        <ArticleBasedTour
          articleSlug={articleSlug}
          isOpen={showTour}
          onClose={handleCloseTour}
        />
      )}
    </>
  );
}
