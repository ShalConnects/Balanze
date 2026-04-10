import React, { useState, useEffect, useRef } from 'react';
import { Quote, RefreshCw, Heart, Bookmark, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore } from '../../store/notificationStore';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import { MotivationalQuoteSkeleton } from './MotivationalQuoteSkeleton';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { getDailyInspirationQuote, inferDailyInspirationCategory } from '../../utils/dailyInspiration';
import { OverflowMarquee } from '../common/OverflowMarquee';

interface QuoteData {
  q: string;
  a: string;
}

interface MotivationalQuoteProps {
  hideHeader?: boolean;
  enableExternalLink?: boolean;
}

export const MotivationalQuote: React.FC<MotivationalQuoteProps> = ({ hideHeader = false, enableExternalLink = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [quote, setQuote] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { 
    addFavoriteQuote, 
    removeFavoriteQuoteByContent, 
    isQuoteFavorited, 
    favoriteQuotes,
    loadFavoriteQuotes,
    setCurrentUserId 
  } = useNotificationStore();
  
  // Check if quote widget is hidden
  const [showQuoteWidget, setShowQuoteWidget] = useState(() => {
    const saved = localStorage.getItem('showQuoteWidget');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Hover state for cross icon
  const [isHovered, setIsHovered] = useState(false);
  const [showCrossTooltip, setShowCrossTooltip] = useState(false);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isMobile } = useMobileDetection();

  // Handle hover events for cross icon (desktop only)
  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsHovered(true);
      setShowCrossTooltip(true);
      
      // Clear any existing timeout
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      
      // Hide tooltip after 1 second
      tooltipTimeoutRef.current = setTimeout(() => {
        setShowCrossTooltip(false);
      }, 1000);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsHovered(false);
      setShowCrossTooltip(false);
      
      // Clear timeout when mouse leaves
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
        tooltipTimeoutRef.current = null;
      }
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Save quote widget visibility preference to localStorage
  useEffect(() => {
    localStorage.setItem('showQuoteWidget', JSON.stringify(showQuoteWidget));
  }, [showQuoteWidget]);

  const fetchQuote = async () => {
    setLoading(true);
    setError(false);
    
    try {
      setQuote(await getDailyInspirationQuote());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Load favorite quotes and set current user ID when user changes
  useEffect(() => {
    if (user?.id) {
      setCurrentUserId(user.id);
      loadFavoriteQuotes(user.id);
    } else {
      setCurrentUserId(null);
    }
  }, [user?.id, setCurrentUserId, loadFavoriteQuotes]);

  // Fetch quote on component mount
  useEffect(() => {
    fetchQuote();
  }, []);

  // Auto-refresh quote every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchQuote();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, []);

  if (!quote) {
    return <MotivationalQuoteSkeleton />;
  }

  // Don't render if widget is hidden
  if (!showQuoteWidget) {
    return null;
  }

  return (
    <div 
      className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 relative overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Close button - hover on desktop, always visible on mobile */}
      {(isHovered || isMobile) && (
        <button
          onClick={() => setShowQuoteWidget(false)}
          className="absolute top-2 right-2 p-1 text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors z-20"
          aria-label="Close Quote Widget"
        >
          <X className="w-4 h-4" />
          {/* Tooltip - only on desktop */}
          {showCrossTooltip && !isMobile && (
            <div className="absolute top-full right-0 mt-1 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded shadow-lg whitespace-nowrap z-30">
              Click to hide this widget
              <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
            </div>
          )}
        </button>
      )}
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
        <Quote className="w-full h-full text-purple-600 dark:text-purple-400" />
      </div>
      
      <div className="relative z-10">
        {!hideHeader && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                Daily Inspiration
              </span>
            </div>
          </div>
        )}
        
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <Quote className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <blockquote className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed italic">
              <OverflowMarquee text={`"${quote.q}"`} />
            </blockquote>
            
            <div className="flex items-center justify-between mt-2">
              <cite className="text-purple-600 dark:text-purple-400 text-xs font-medium not-italic">
                — {quote.a}
              </cite>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={fetchQuote}
                  disabled={loading}
                  className="p-1 rounded-full hover:bg-purple-100 dark:hover:bg-purple-800/30 transition-colors group"
                  title={t('dashboard.getNewQuote')}
                >
                  <RefreshCw className={`w-4 h-4 text-purple-600 dark:text-purple-400 ${
                    loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'
                  }`} />
                </button>
                
                <button
                  onClick={async () => {
                    if (quote) {
                      if (isQuoteFavorited(quote.q, quote.a)) {
                        // Remove the favorite quote by content
                        await removeFavoriteQuoteByContent(quote.q, quote.a);
                      } else {
                        await addFavoriteQuote({
                          quote: quote.q,
                          author: quote.a,
                          category: inferDailyInspirationCategory(quote.q)
                        });
                      }
                    }
                  }}
                  className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors group"
                  title={isQuoteFavorited(quote?.q || '', quote?.a || '') ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart 
                    className={`w-4 h-4 transition-colors ${
                      isQuoteFavorited(quote?.q || '', quote?.a || '') 
                        ? 'text-red-600 fill-red-600' 
                        : 'text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400'
                    }`} 
                  />
                </button>
                
                {enableExternalLink ? (
                  <button
                    onClick={() => {
                      // Navigate to favorite quotes page
                      navigate('/personal-growth?tab=favorite-quotes');
                    }}
                    className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors group"
                    title="View favorite quotes"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400" />
                  </button>
                ) : (
                  <div
                    className="p-1 rounded-full cursor-not-allowed opacity-50"
                    title="Demo mode - feature disabled"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle animation */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-400 opacity-20"></div>
    </div>
  );
}; 

