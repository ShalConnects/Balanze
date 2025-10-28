import React from 'react';
import { Trash2, Heart, User } from 'lucide-react';
import { format } from 'date-fns';

interface Quote {
  id: string;
  quote: string;
  author: string;
  category?: string;
  createdAt: string;
}

interface QuoteMobileViewProps {
  quotes: Quote[];
  onRemoveQuote: (quoteId: string) => Promise<void>;
  getCategoryIcon: (category?: string) => string;
  getCategoryColor: (category?: string) => string;
}

export const QuoteMobileView: React.FC<QuoteMobileViewProps> = React.memo(({
  quotes,
  onRemoveQuote,
  getCategoryIcon,
  getCategoryColor
}) => {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-12 h-12 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No quotes found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
          Try adjusting your search terms or filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-2.5">
      {/* Quote Cards */}
      <div className="space-y-3">
        {quotes.map((quote) => (
          <div
            key={quote.id}
            id={`quote-${quote.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-all duration-200"
          >
            {/* Quote Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{getCategoryIcon(quote.category)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(quote.category)}`}>
                  {quote.category || 'General'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {format(new Date(quote.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <button
                onClick={async () => await onRemoveQuote(quote.id)}
                className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                title="Remove from favorites"
              >
                <Trash2 className="w-4 h-4 text-red-500 hover:text-red-600" />
              </button>
            </div>

            {/* Quote Content */}
            <blockquote className="text-gray-900 dark:text-white text-sm font-medium mb-3 leading-relaxed break-words max-w-full">
              "{quote.quote}"
            </blockquote>

            {/* Author */}
            <div className="flex items-center gap-1">
              <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <cite className="text-gray-600 dark:text-gray-300 font-medium not-italic text-sm break-words max-w-full">
                — {quote.author}
              </cite>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
});

QuoteMobileView.displayName = 'QuoteMobileView';
