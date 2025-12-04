import React from 'react';
import { NotificationPreferences } from '../../lib/notificationPreferences';
import { Mail, Monitor, Settings as SettingsIcon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface NotificationSettingsProps {
  preferences: NotificationPreferences | null;
  onPreferenceChange: (
    category: keyof NotificationPreferences,
    key: string,
    value: boolean | string
  ) => void;
  dirty: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  preferences,
  onPreferenceChange,
  dirty
}) => {
  const { user } = useAuthStore();

  if (!preferences) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        Loading notification settings...
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* All Notification Settings - Unified Block */}
      <div>
        {/* Financial Notifications */}
        <div className="mb-5 sm:mb-6">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <span className="text-sm">💰</span>
            </div>
            Financial Notifications
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {Object.entries(preferences.financial).map(([key, value]) => (
              <div key={key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                      {key === 'overdue_payments' && 'Bills past due date'}
                      {key === 'due_soon_reminders' && 'Bills due within 3 days'}
                      {key === 'low_balance_alerts' && 'Account balance is low'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('financial', key, e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 ml-2"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* System & Activity Notifications */}
        <div className="mb-5 sm:mb-6">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <SettingsIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            </div>
            System & Activity
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* System Notifications */}
            {Object.entries(preferences.system).map(([key, value]) => (
              <div key={key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                      New features and improvements
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('system', key, e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 ml-2"
                  />
                </label>
              </div>
            ))}

            {/* Activity Notifications */}
            {Object.entries(preferences.activity).map(([key, value]) => (
              <div key={key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                      Changes to your accounts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('activity', key, e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 ml-2"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="mb-5 sm:mb-6">
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <span className="text-sm">📱</span>
            </div>
            Communication Channels
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center min-w-0 flex-1">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">In-App Notifications</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Show notifications in app</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.communication.in_app_notifications}
                  onChange={(e) => onPreferenceChange('communication', 'in_app_notifications', e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 ml-2"
                />
              </label>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center min-w-0 flex-1">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">Email Notifications</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Send emails for alerts</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.communication.email_notifications}
                  onChange={(e) => onPreferenceChange('communication', 'email_notifications', e.target.checked)}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 ml-2"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Notification Frequency */}
        <div>
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <span className="text-sm">⏰</span>
            </div>
            Notification Frequency
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {Object.entries(preferences.frequency).map(([key, value]) => (
              <div key={key} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-gray-200/50 dark:border-gray-600/50 hover:shadow-md transition-all duration-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block">
                      {key === 'real_time' && 'Immediate notifications as they happen'}
                      {key === 'daily_digest' && 'Summary at end of each day'}
                      {key === 'weekly_summary' && 'Weekly roundup of activity'}
                      {key === 'monthly_report' && 'Comprehensive monthly insights'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('frequency', key, e.target.checked)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 ml-2"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="mt-3 sm:mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 You can enable multiple frequency options. Higher priority options take precedence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

