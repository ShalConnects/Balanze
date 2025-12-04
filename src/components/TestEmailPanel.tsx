import React, { useState, useEffect } from 'react';
import { mockEmailService } from '../lib/mockEmailService';

const TestEmailPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [emailLog, setEmailLog] = useState(mockEmailService.getEmailLog());

  useEffect(() => {
    const interval = setInterval(() => {
      setEmailLog(mockEmailService.getEmailLog());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClearLog = () => {
    mockEmailService.clearEmailLog();
    setEmailLog([]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-blue-600"
      >
        📧 Email Log
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-md z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">📧 Email Testing Log</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {emailLog.length} email(s) sent
          </span>
          <button
            onClick={handleClearLog}
            className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
          >
            Clear Log
          </button>
        </div>

        {emailLog.length === 0 ? (
          <div className="text-gray-500 text-sm italic">
            No emails sent yet
          </div>
        ) : (
          <div className="space-y-2">
            {emailLog.map((email, index) => (
              <div key={index} className="border border-gray-200 rounded p-3 bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    {email.subject}
                  </span>
                  <span className="text-xs text-gray-500">
                    {email.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-1">
                  To: {email.to}
                </div>
                <div className="text-xs text-gray-700 line-clamp-2">
                  {email.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>This shows mock emails sent during testing.</p>
        <p>Real emails are bypassed in development.</p>
      </div>
    </div>
  );
};

export default TestEmailPanel; 

