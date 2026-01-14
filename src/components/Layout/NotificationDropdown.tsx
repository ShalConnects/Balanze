import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ExternalLink, Sparkles, Zap, Bug, Megaphone, Lightbulb, Trophy } from 'lucide-react';
import { useNotificationsStore } from '../../store/notificationsStore';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: Notification['type'], title?: string) => {
  // Check for achievement notifications by title
  if (type === 'success' && title?.includes('Achievement')) {
    return <Trophy className="w-4 h-4 text-yellow-500" />;
  }
  
  // Map database notification types to icons
  switch (type) {
    case 'success':
      return <Trophy className="w-4 h-4 text-yellow-500" />;
    case 'error':
      return <Bell className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <Bell className="w-4 h-4 text-orange-500" />;
    case 'info':
    default:
      return <Bell className="w-4 h-4 text-gray-500" />;
  }
};

const getNotificationColor = (type: Notification['type'], isRead: boolean) => {
  // Unread notifications get blue highlight
  if (!isRead) {
    return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
  }
  
  // Map database notification types to colors
  switch (type) {
    case 'success':
      return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
    case 'error':
      return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
    case 'warning':
      return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
    case 'info':
    default:
      return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
  }
};

const formatTimeAgo = (date: Date | string | null | undefined) => {
  if (!date) return 'Unknown';
  
  // Ensure date is a Date object
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) {
    return 'Just now';
  }

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

// Remove technical IDs from notification body for display
const cleanNotificationBody = (body: string | null | undefined): string => {
  if (!body) return '';
  // Remove [ID:...] pattern and any surrounding whitespace
  return body.replace(/\s*\[ID:[^\]]+\]\s*/g, '').trim();
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    fetchNotifications,
  } = useNotificationsStore();

  // Fetch notifications when dropdown opens (with debounce to avoid multiple calls)
  useEffect(() => {
    if (isOpen && !isLoading) {
      fetchNotifications();
    }
  }, [isOpen]); // Removed fetchNotifications from deps to avoid re-fetching on every render

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

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Handle achievement notifications (success type with trophy title)
    if (notification.type === 'success' && notification.title?.includes('Achievement')) {
      navigate('/personal-growth?tab=achievements');
      onClose();
      return;
    }
    
    // Handle urgent notifications - navigate to lent/borrow page
    if (notification.title?.includes('URGENT:') || notification.title?.includes('DUE SOON:') || notification.title?.includes('UPCOMING:') || 
        notification.title?.includes('owes you') || notification.title?.includes('you owe')) {
      // Extract record ID from notification body if present
      const idMatch = notification.body?.match(/\[ID:lend_borrow_([^\]]+)\]/);
      const recordId = idMatch ? idMatch[1] : null;
      
      if (recordId) {
        // Navigate with selected parameter to highlight the specific record
        navigate(`/lent-borrow?selected=${recordId}&from=notification`);
      } else {
        // Fallback: just navigate to the page
        navigate('/lent-borrow');
      }
      onClose();
      return;
    }
    
    // Handle action_url if present (for future use)
    if ((notification as any).action_url) {
      navigate((notification as any).action_url);
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
          role="dialog"
          aria-modal="true"
          aria-label={t('notifications.title', 'Notifications')}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('notifications.title', 'Notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  aria-label={t('notifications.markAllRead', 'Mark all read')}
                >
                  {t('notifications.markAllRead', 'Mark all read')}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('notifications.close', 'Close notifications')}
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
              aria-label={t('notifications.all', 'All notifications')}
              aria-pressed={activeTab === 'all'}
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
              aria-label={t('notifications.unread', 'Unread notifications')}
              aria-pressed={activeTab === 'unread'}
            >
              {t('notifications.unread', 'Unread')}
              {unreadCount > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full" aria-hidden="true">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('notifications.loading', 'Loading notifications...')}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                <Bell className="w-12 h-12 text-red-400 dark:text-red-500 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  {t('notifications.error', 'Failed to load notifications')}
                </p>
                <button
                  onClick={() => fetchNotifications()}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('notifications.retry', 'Retry')}
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
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
                    className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 border-l-4 ${getNotificationColor(notification.type, notification.is_read)}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    aria-label={`${notification.title}${notification.body ? `: ${cleanNotificationBody(notification.body)}` : ''}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {(notification as any).icon ? (
                          <span className="text-lg">{(notification as any).icon}</span>
                        ) : (
                          getNotificationIcon(notification.type, notification.title)
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium flex-1 ${
                            !notification.is_read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h4>
                          <button
                            onClick={(e) => handleDismiss(e, notification.id)}
                            className="flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            aria-label={t('notifications.dismiss', 'Dismiss notification')}
                            title={t('notifications.dismiss', 'Dismiss notification')}
                          >
                            <X className="w-3 h-3 text-gray-400" />
                          </button>
                        </div>
                        
                        {notification.body && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 break-words">
                            {cleanNotificationBody(notification.body)}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2 gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500 flex-shrink-0">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          {(notification as any).action_text && (
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {(notification as any).action_text}
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
                aria-label={t('notifications.clearAll', 'Clear all notifications')}
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

