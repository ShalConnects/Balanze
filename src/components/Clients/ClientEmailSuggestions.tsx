import React, { useState, useMemo } from 'react';
import { Mail, Copy, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { Client, Order, Invoice, Task } from '../../types/client';
import { getClientEmailSuggestions } from '../../lib/clientEmailService';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';

interface ClientEmailSuggestionsProps {
  client: Client;
  orders: Order[];
  invoices: Invoice[];
  tasks: Task[];
}

export const ClientEmailSuggestions: React.FC<ClientEmailSuggestionsProps> = ({
  client,
  orders,
  invoices,
  tasks
}) => {
  console.log('[ClientEmailSuggestions] Component function called with:', { clientId: client?.id, clientEmail: client?.email });
  
  const { profile } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  // Generate suggestions for all clients
  const suggestions = useMemo(() => {
    console.log('[ClientEmailSuggestions] Generating suggestions for client:', {
      clientId: client.id,
      clientName: client.name,
      clientEmail: client.email,
      ordersCount: orders.length,
      invoicesCount: invoices.length,
      tasksCount: tasks.length,
      hasProfile: !!profile
    });
    
    try {
      const result = getClientEmailSuggestions(client, orders, invoices, tasks, profile);
      console.log('[ClientEmailSuggestions] Generated suggestions:', result.length, result);
      return result;
    } catch (error) {
      console.error('[ClientEmailSuggestions] Error generating suggestions:', error);
      return [];
    }
  }, [client, orders, invoices, tasks, profile]);

  const handleCopyEmail = async (email: string, type: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success(`${type} email copied to clipboard`);
    } catch (error) {
      toast.error('Failed to copy email');
    }
  };

  const getEmailTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'follow-up': 'Follow-up',
      're-connect': 'Re-connect',
      'thank-you': 'Thank You',
      'check-in': 'Check-in',
      'payment-reminder': 'Payment Reminder',
      'project-update': 'Project Update',
      'proposal': 'Proposal'
    };
    return labels[type] || type;
  };

  console.log('[ClientEmailSuggestions] Rendering component:', {
    hasEmail: !!client.email,
    suggestionsCount: suggestions.length,
    isOpen,
    clientId: client.id
  });

  // Always render the component (show suggestions for all clients)
  console.log('[ClientEmailSuggestions] About to render JSX, suggestions:', suggestions.length);

  return (
    <div 
      className="space-y-2 sm:space-y-3 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200 dark:border-gray-700"
      data-testid="client-email-suggestions"
    >
      {/* Warning if no email address */}
      {!client.email && (
        <div className="mb-2 flex items-center gap-2 text-xs sm:text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-md p-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Note: This client doesn't have an email address. You can still use these email templates and add the email later.</span>
        </div>
      )}
      
      <div className="flex items-center justify-between mb-1.5 sm:mb-2 gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
          <h4 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            AI Email Suggestions
          </h4>
          {suggestions.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] sm:text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium">
              {suggestions.length}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors whitespace-nowrap"
        >
          <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden sm:inline">{isOpen ? 'Hide' : 'Show'} Suggestions</span>
          <span className="sm:hidden">{isOpen ? 'Hide' : 'Show'}</span>
          {isOpen ? (
            <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          ) : (
            <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-2 sm:space-y-3">
          {suggestions.length === 0 ? (
            <div className="text-xs sm:text-sm text-gray-400 italic p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md">
              No email suggestions available at this time.
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.type}-${index}`}
                className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden bg-white dark:bg-gray-800/50"
              >
                {/* Suggestion Header */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedSuggestion(
                      expandedSuggestion === suggestion.type ? null : suggestion.type
                    );
                  }}
                  className="w-full flex items-center justify-between p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                        {getEmailTypeLabel(suggestion.type)}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                        {suggestion.context}
                      </div>
                    </div>
                  </div>
                  {expandedSuggestion === suggestion.type ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </button>

                {/* Email Preview */}
                {expandedSuggestion === suggestion.type && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="mb-3">
                      <div className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                        Email Preview:
                      </div>
                      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 sm:p-3 text-xs sm:text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {suggestion.email}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyEmail(suggestion.email, getEmailTypeLabel(suggestion.type));
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                    >
                      <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Copy Email
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
