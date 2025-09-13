import React from 'react';
import { NotificationPreferences } from '../../lib/notificationPreferences';
import { Clock, Smartphone, Mail, Monitor } from 'lucide-react';

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
  if (!preferences) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        Loading notification settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* First Row: Activity Notifications + System Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Notifications */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            📊 Activity Notifications
          </h4>
          <div className="space-y-3">
            {Object.entries(preferences.activity).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onPreferenceChange('activity', key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            ))}
          </div>
        </div>

        {/* System Notifications */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            ⚙️ System Notifications
          </h4>
          <div className="space-y-3">
            {Object.entries(preferences.system).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onPreferenceChange('system', key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Communication Preferences + Notification Frequency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communication Preferences */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            📱 Communication Preferences
          </h4>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">In-App Notifications</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.communication.in_app_notifications}
                onChange={(e) => onPreferenceChange('communication', 'in_app_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Email Notifications</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.communication.email_notifications}
                onChange={(e) => onPreferenceChange('communication', 'email_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Push Notifications</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.communication.push_notifications}
                onChange={(e) => onPreferenceChange('communication', 'push_notifications', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </label>

            {/* Quiet Hours */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
              <label className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Quiet Hours</span>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.communication.quiet_hours_enabled}
                  onChange={(e) => onPreferenceChange('communication', 'quiet_hours_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
              
              {preferences.communication.quiet_hours_enabled && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>From:</span>
                  <input
                    type="time"
                    value={preferences.communication.quiet_hours_start}
                    onChange={(e) => onPreferenceChange('communication', 'quiet_hours_start', e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <span>To:</span>
                  <input
                    type="time"
                    value={preferences.communication.quiet_hours_end}
                    onChange={(e) => onPreferenceChange('communication', 'quiet_hours_end', e.target.value)}
                    className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notification Frequency */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
            ⏰ Notification Frequency
          </h4>
          <div className="space-y-3">
            {Object.entries(preferences.frequency).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => onPreferenceChange('frequency', key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
