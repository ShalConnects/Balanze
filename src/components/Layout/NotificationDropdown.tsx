import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink, Sparkles, Zap, Bug, Megaphone, Lightbulb, Trophy } from 'lucide-react';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'feature':
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    case 'improvement':
      return <Zap className="w-4 h-4 text-blue-500" />;
    case 'bugfix':
      return <Bug className="w-4 h-4 text-green-500" />;
    case 'announcement':
      return <Megaphone className="w-4 h-4 text-orange-500" />;
    case 'tip':
      return <Lightbulb className="w-4 h-4 text-yellow-500" />;
    case 'success':
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'feature':
      return 'border-l-purple-500 bg-purple-50 dark:bg-purple-900/10';
    case 'improvement':
      return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
    case 'bugfix':
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
    case 'announcement':
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
    case 'tip':
      return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
    case 'success':
      return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10';
    default:
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
  }
};

const formatTimeAgo = (date: Date | string) => {
  // Ensure date is a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
  } = useNotificationsStore();

  // Fetch notifications when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'unread') {
      return !notification.is_read;
    }
    return true; // Show all notifications for 'all' tab
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notification: any) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Handle achievement notifications (success type with trophy title)
    if (notification.type === 'success' && notification.title.includes('Achievement')) {
      navigate('/achievements');
      onClose();
      return;
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
      onClose();
    }
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-start pt-16">
      <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
      
      {/* Mobile: centered, Desktop: right-aligned */}
      <div className="w-full flex justify-center md:justify-end px-4 md:px-0 md:pr-4">
        <div
          ref={dropdownRef}
          className="relative w-full max-w-sm md:w-96 max-h-[80vh] bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('notifications.title', 'Notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  {t('notifications.markAllRead', 'Mark all read')}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('notifications.all', 'All')}
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'unread'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('notifications.unread', 'Unread')}
              {unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {activeTab === 'unread' 
                    ? t('notifications.noUnread', 'No unread notifications')
                    : t('notifications.noNotifications', 'No notifications yet')
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 ${
                      !notification.is_read ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500' : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.icon ? (
                          <span className="text-lg">{notification.icon}</span>
                        ) : (
                          getNotificationIcon(notification.type)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.is_read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => handleDismiss(e, notification.id)}
                            className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.body}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(new Date(notification.created_at))}
                          </span>
                          
                          {notification.action_text && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {notification.action_text}
                              </span>
                              <ExternalLink className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearAllNotifications}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {t('notifications.clearAll', 'Clear all notifications')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 

