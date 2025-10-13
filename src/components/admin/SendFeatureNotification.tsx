import React, { useState } from 'react';
import { Bell, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { notifyUsersAboutReorderingFeature, notifyUsersAboutNewFeature } from '../../lib/sendFeatureNotification';

export const SendFeatureNotification: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    usersNotified: number;
    errors: string[];
  } | null>(null);

  const handleSendReorderingNotification = async () => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const result = await notifyUsersAboutReorderingFeature();
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        usersNotified: 0,
        errors: [`Failed to send notification: ${error}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCustomNotification = async () => {
    const featureName = prompt('Enter feature name:');
    const description = prompt('Enter feature description:');
    const instructions = prompt('Enter usage instructions (optional):');
    
    if (!featureName || !description) {
      alert('Feature name and description are required!');
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    try {
      const result = await notifyUsersAboutNewFeature(featureName, description, instructions);
      setResult(result);
    } catch (error) {
      setResult({
        success: false,
        usersNotified: 0,
        errors: [`Failed to send notification: ${error}`]
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Send Feature Notification
        </h2>
      </div>

      <div className="space-y-4">
        {/* Re-ordering Feature Notification */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            🎉 Drag & Drop Account Reordering
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Send notification to all users about the new drag-and-drop account reordering feature.
          </p>
          <button
            onClick={handleSendReorderingNotification}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Re-ordering Notification
          </button>
        </div>

        {/* Custom Feature Notification */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">
            📢 Custom Feature Notification
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Send a custom feature notification to all users.
          </p>
          <button
            onClick={handleSendCustomNotification}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Custom Notification
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className={`border rounded-lg p-4 ${
            result.success 
              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
              : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`font-medium ${
                result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {result.success ? 'Notification Sent Successfully!' : 'Failed to Send Notification'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Users notified: <span className="font-medium">{result.usersNotified}</span>
            </p>

            {result.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Errors ({result.errors.length}):
                </p>
                <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                  {result.errors.map((error, index) => (
                    <li key={index} className="ml-4">• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
