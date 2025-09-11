import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { supabase } from '../../lib/supabase';

interface HelpLayoutProps {
  children: React.ReactNode;
}

export const HelpLayout: React.FC<HelpLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const userName = profile?.fullName || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userPicUrl = profile?.profilePicture ? 
    supabase.storage.from('avatars').getPublicUrl(profile.profilePicture).data.publicUrl : null;

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Home Icon & Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-200 rounded-full shadow-sm hover:shadow-md"
              title="Go to Home"
            >
              <div className="w-5 h-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style={{stopColor: '#3B82F6'}} />
                      <stop offset="100%" style={{stopColor: '#8B5CF6'}} />
                    </linearGradient>
                  </defs>
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
              </div>
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Help & Documentation
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Complete guide to using Balanze
              </p>
            </div>
          </div>

          {/* Right Section - Theme Toggle & Profile Card */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 border border-gray-300/50 dark:border-gray-600/50 rounded-full hover:bg-gray-50/50 dark:hover:bg-gray-700/50"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
              <div className="flex items-center space-x-3">
                {userPicUrl ? (
                  <img
                    src={userPicUrl}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-blue-500"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {userName}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {userEmail}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
        {children}
      </main>
    </div>
  );
}; 