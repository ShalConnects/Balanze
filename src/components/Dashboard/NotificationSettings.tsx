import React from 'react';
import { NotificationPreferences } from '../../lib/notificationPreferences';
import { Mail, Monitor } from 'lucide-react';
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
    <div className="space-y-6">
      {/* All Notification Settings - Unified Block */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 border border-blue-200 dark:border-gray-600">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            🔔 Notification Settings
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Configure all your notification preferences in one place
          </p>
        </div>

        {/* Financial Notifications */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(preferences.financial).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {key === 'overdue_payments' && 'Bills past due date'}
                      {key === 'due_soon_reminders' && 'Bills due within 3 days'}
                      {key === 'low_balance_alerts' && 'Account balance is low'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('financial', key, e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* System & Activity Notifications */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* System Notifications */}
            {Object.entries(preferences.system).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      New features and improvements
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('system', key, e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>
              </div>
            ))}

            {/* Activity Notifications */}
            {Object.entries(preferences.activity).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Changes to your accounts
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => onPreferenceChange('activity', key, e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded-full text-xs mr-2">📱</span>
            Communication Channels
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Monitor className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">In-App Notifications</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Show notifications in app</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.communication.in_app_notifications}
                  onChange={(e) => onPreferenceChange('communication', 'in_app_notifications', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-500" />
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">Email Notifications</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Send emails for alerts</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.communication.email_notifications}
                  onChange={(e) => onPreferenceChange('communication', 'email_notifications', e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Notification Frequency */}
        <div>
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full text-xs mr-2">⏰</span>
            Notification Frequency
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(preferences.frequency).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white block">
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
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
                    className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 You can enable multiple frequency options. Higher priority options take precedence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
