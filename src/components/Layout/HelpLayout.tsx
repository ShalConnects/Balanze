import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { getUserReadingHistory, ArticleReadingHistory, getUserArticleStats } from '../../lib/articleHistory';
import { X, BookOpen, Clock, ExternalLink, ThumbsUp, ThumbsDown, BarChart3, TrendingUp, TrendingDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HelpLayoutProps {
  children: React.ReactNode;
}

interface FloatingUserIconProps {
  userName: string;
  userEmail: string;
  userPicUrl: string | null;
}

const FloatingUserIcon: React.FC<FloatingUserIconProps> = ({ userName, userEmail, userPicUrl }) => {
  const [showModal, setShowModal] = useState(false);
  const [readingHistory, setReadingHistory] = useState<ArticleReadingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [articleStats, setArticleStats] = useState({
    totalReads: 0,
    helpfulCount: 0,
    notHelpfulCount: 0,
    noFeedbackCount: 0,
    helpfulRate: 0,
    totalTimeSpent: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Generate initials from user name
  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const initials = getInitials(userName);

  // Load reading history and article stats when modal opens
  useEffect(() => {
    if (showModal) {
      setLoadingHistory(true);
      setLoadingStats(true);
      
      // Load reading history
      getUserReadingHistory(5).then(history => {
        setReadingHistory(history);
        setLoadingHistory(false);
      }).catch(error => {
        console.error('Error loading reading history:', error);
        setLoadingHistory(false);
      });
      
      // Load article statistics
      getUserArticleStats().then(stats => {
        setArticleStats(stats);
        setLoadingStats(false);
      }).catch(error => {
        console.error('Error loading article stats:', error);
        setLoadingStats(false);
      });
    }
  }, [showModal]);

  const formatTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const formatTotalTimeSpent = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

  const formatReadDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      {/* Floating User Icon */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-lg font-bold z-50"
        title="User Profile"
      >
        {userPicUrl ? (
          <img
            src={userPicUrl}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
            onError={e => { 
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <span className={userPicUrl ? 'hidden' : ''}>{initials}</span>
      </button>

      {/* User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Profile</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              {userPicUrl ? (
                <img
                  src={userPicUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                  onError={e => { 
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold text-white ${userPicUrl ? 'hidden' : ''}`}>
                {initials}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{userName}</h3>
                <p className="text-gray-600 dark:text-gray-400">{userEmail}</p>
              </div>
            </div>
            
            {/* Article Statistics Section */}
            <div className="mb-6">
              
              {loadingStats ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {/* Total Reads */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Reads</span>
                    </div>
                    <div className="text-xl font-bold text-blue-900 dark:text-blue-100">{articleStats.totalReads}</div>
                  </div>
                  
                  {/* Helpful Rate */}
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">Helpful Rate</span>
                    </div>
                    <div className="text-xl font-bold text-green-900 dark:text-green-100">
                      {articleStats.helpfulRate > 0 ? `${Math.round(articleStats.helpfulRate)}%` : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Helpful Count */}
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-2 mb-1">
                      <ThumbsUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Helpful</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-900 dark:text-emerald-100">{articleStats.helpfulCount}</div>
                  </div>
                  
                  {/* Total Time */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Time Spent</span>
                    </div>
                    <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
                      {formatTotalTimeSpent(articleStats.totalTimeSpent)}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Reading History Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Recently Read Articles
              </h3>
              
              {loadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : readingHistory.length > 0 ? (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {readingHistory.map((item) => (
                    <Link
                      key={item.id}
                      to={`/kb/${item.article_slug}`}
                      onClick={() => setShowModal(false)}
                      className="block p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-sm line-clamp-2">
                          {item.article_title}
                        </h4>
                        <ExternalLink className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2 mt-0.5" />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeSpent(item.time_spent_seconds)}
                        </span>
                        <span>•</span>
                        <span>{formatReadDate(item.read_at)}</span>
                        {item.article_category && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">
                              {item.article_category}
                            </span>
                          </>
                        )}
                        {item.feedback !== null && (
                          <>
                            <span>•</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                              item.feedback 
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            }`}>
                              {item.feedback ? (
                                <>
                                  <ThumbsUp className="w-3 h-3" />
                                  Helpful
                                </>
                              ) : (
                                <>
                                  <ThumbsDown className="w-3 h-3" />
                                  Needs improvement
                                </>
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No articles read yet. Start exploring our help center!
                  </p>
                  <Link
                    to="/help"
                    onClick={() => setShowModal(false)}
                    className="inline-block mt-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Browse Help Center
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gradient-primary hover:bg-gradient-primary-hover text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const HelpLayout: React.FC<HelpLayoutProps> = ({ children }) => {
  const { user, profile } = useAuthStore();

  const userName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userPicUrl = profile?.profilePicture ? 
    supabase.storage.from('avatars').getPublicUrl(profile.profilePicture).data.publicUrl : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content */}
        <main className="py-4 sm:py-6 lg:py-8">
          {children}
        </main>
      </div>
      
      {/* Floating User Icon */}
      <FloatingUserIcon 
        userName={userName}
        userEmail={userEmail}
        userPicUrl={userPicUrl}
      />
    </div>
  );
}; 