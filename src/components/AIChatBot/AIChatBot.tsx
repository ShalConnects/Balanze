import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageCircle, X, Send, Loader2, Copy, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useFinanceStore } from '../../store/useFinanceStore';
import { getAIResponse } from '../../lib/aiChatService';
import { useMobileDetection } from '../../hooks/useMobileDetection';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatBotProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialQuery?: string;
  showFloatingButton?: boolean;
}

export const AIChatBot: React.FC<AIChatBotProps> = ({ 
  isOpen: externalIsOpen, 
  onOpenChange,
  initialQuery,
  showFloatingButton = true
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = useMemo(() => {
    return onOpenChange ? (open: boolean) => onOpenChange(open) : setInternalIsOpen;
  }, [onOpenChange]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I\'m Balanzo, your intelligent financial assistant! 💰\n\nI can help you understand and manage your finances in many ways:\n\n📊 **Account & Balance Management**\n• Check your account balances across all currencies\n• View total balance and individual account details\n• Multi-currency breakdown and analysis\n\n📈 **Income & Expense Tracking**\n• View your total income and expenses\n• Track spending by category with percentages\n• See top spending categories\n• Analyze spending patterns over time\n\n📅 **Time-Based Analysis**\n• Monthly, weekly, and yearly spending analysis\n• Compare this month vs last month\n• Spending trends and comparisons\n• Historical spending data (last 6 months)\n\n💵 **Budget Management**\n• Check if you\'re over or under budget\n• View budget status by category\n• See remaining budget amounts\n• Get alerts when approaching budget limits\n\n🎯 **Savings Goals**\n• Track progress on your savings goals\n• See how much you\'ve saved vs your target\n• Calculate days remaining to reach goals\n• Get recommendations to meet your targets\n\n📈 **Investment Portfolio**\n• View your total portfolio value\n• Check investment returns and gains/losses\n• Analyze cost basis vs current value\n• Track performance across all assets\n\n🔮 **Predictive Insights**\n• Spending forecasts for the month\n• Projected month-end spending\n• Burn rate analysis (how long until balance runs out)\n• Spending velocity and pace tracking\n\n🚨 **Smart Detection**\n• Detect unusual spending patterns\n• Identify category spending spikes\n• Alert you to anomalies in your finances\n\n💡 **Personalized Recommendations**\n• Get actionable financial advice\n• Suggestions to improve your financial health\n• Tips based on your spending patterns\n• Recommendations for budget optimization\n\n🤝 **Lend & Borrow Tracking**\n• See who owes you money\n• Track who you owe money to\n• Monitor overdue payments\n• Get summaries of all active loans\n\n💸 **Purchase Management**\n• View your purchase history\n• Track planned vs completed purchases\n• Analyze purchase patterns\n\n\n**Try asking me:**\n• "What\'s my balance?"\n• "How much did I spend this month?"\n• "Am I over budget?"\n• "Spending forecast"\n• "Give me recommendations"\n• "Compare this month vs last month"\n• "What\'s my portfolio value?"\n• "Any unusual spending?"\n• "Burn rate"\n• "How are my savings goals?"\n\nI\'m here 24/7 to help you make better financial decisions! 🚀',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const { accounts, transactions } = useFinanceStore();
  const { isMobile, isBrowser } = useMobileDetection();
  // Detect Android for proper bottom offset
  const isAndroid = typeof window !== 'undefined' && /Android/i.test(navigator.userAgent);

  const scrollToBottom = useCallback(() => {
    // Use setTimeout to ensure DOM is updated
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Small delay to ensure smooth animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSendWithQuery = useCallback(async (query: string) => {
    if (!query.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAIResponse(query.trim(), user.id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error && error.message
          ? `❌ Error: ${error.message}\n\nPlease try again or rephrase your question.`
          : '❌ Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, user]);

  // Handle initial query when chat opens
  useEffect(() => {
    if (isOpen && initialQuery && messages.length <= 1) {
      const timer = setTimeout(() => {
        handleSendWithQuery(initialQuery);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialQuery, handleSendWithQuery, messages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        setIsOpen(false);
      }
      // Focus input with / key
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAIResponse(query, user.id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error && error.message
          ? `❌ Error: ${error.message}\n\nPlease try again or rephrase your question.`
          : '❌ Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, user]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Ctrl/Cmd + K to clear input
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setInput('');
    }
  }, [handleSend]);

  const handleCopyMessage = useCallback(async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const formatMessageContent = useCallback((content: string) => {
    // Split by lines and format
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Format bullet points
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="text-lg leading-none mt-0.5">•</span>
            <span className="flex-1">{line.replace(/^[•-]\s*/, '')}</span>
          </div>
        );
      }
      // Format numbered lists
      if (/^\d+\.\s/.test(line.trim())) {
        return (
          <div key={index} className="flex items-start gap-2 my-1">
            <span className="font-semibold">{line.match(/^\d+\./)?.[0]}</span>
            <span className="flex-1">{line.replace(/^\d+\.\s*/, '')}</span>
          </div>
        );
      }
      // Format headers (lines with emojis followed by text)
      if (/^[📊💰📈📉💵🎯🔥⚡🚨💡🌍✅⚠️🕐🤝📅💸🏦📝📋]/.test(line.trim()) && line.length > 5) {
        return (
          <div key={index} className="font-semibold mt-3 mb-1 text-base">
            {line}
          </div>
        );
      }
      // Regular lines
      if (line.trim()) {
        return <div key={index} className="my-1">{line}</div>;
      }
      // Empty lines
      return <div key={index} className="h-2" />;
    });
  }, []);

  const handleQuickAction = async (question: string) => {
    if (isLoading || !user) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getAIResponse(question, user.id);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error && error.message
          ? `❌ Error: ${error.message}\n\nPlease try again or rephrase your question.`
          : '❌ Sorry, I encountered an error. Please try again later.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = useMemo(() => [
    "What's my balance?",
    "Show spending by category",
    "How much did I spend this month?",
    "What's my financial summary?",
    "Show recent transactions",
    "What are my top spending categories?",
    "How much did I spend last month?",
    "What's my income?",
  ], []);

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && showFloatingButton && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-40 p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 right-4 sm:right-6"
          style={{
            bottom: isMobile
              ? isAndroid && !isBrowser
                ? `max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))`
                : `max(5rem, calc(5rem + env(safe-area-inset-bottom, 0px)))`
              : `max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))`
          }}
          aria-label="Open AI chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col border border-gray-200 dark:border-gray-700 transition-all ${
          isMobile 
            ? 'inset-0 rounded-none' 
            : 'bottom-6 right-6 w-96 h-[600px] max-h-[calc(100vh-3rem)]'
        }`}>
          {/* Header */}
          <div className={`flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white ${
            isMobile ? 'p-3' : 'p-4 rounded-t-lg'
          }`}>
            <div className="flex items-center gap-2">
              <MessageCircle className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <h3 className={`font-semibold ${isMobile ? 'text-sm' : ''}`}>Balanzo</h3>
            </div>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <span className="text-xs opacity-75 hidden sm:inline">Press ESC to close</span>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Close chat"
              >
                <X className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto space-y-4 ${isMobile ? 'p-3' : 'p-4'} scroll-smooth`} style={{ scrollBehavior: 'smooth' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} group`}
              >
                <div
                  className={`rounded-lg relative ${
                    isMobile ? 'max-w-[85%] px-3 py-2' : 'max-w-[80%] px-4 py-2.5'
                  } ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  } ${message.content.startsWith('❌') ? 'border-l-4 border-red-500' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => handleCopyMessage(message.content, message.id)}
                      className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${
                        isMobile ? 'opacity-100' : ''
                      }`}
                      aria-label="Copy message"
                    >
                      {copiedMessageId === message.id ? (
                        <Check className={`text-green-600 dark:text-green-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      ) : (
                        <Copy className={`text-gray-500 dark:text-gray-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                      )}
                    </button>
                  )}
                  <div className={`${isMobile ? 'text-xs' : 'text-sm'} leading-relaxed ${message.role === 'assistant' ? 'pr-6' : ''}`}>
                    {message.role === 'assistant' ? formatMessageContent(message.content) : message.content}
                  </div>
                  <p className={`mt-2 opacity-70 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`bg-gray-100 dark:bg-gray-700 rounded-lg ${isMobile ? 'px-3 py-2' : 'px-4 py-2'} flex items-center gap-2`}>
                  <Loader2 className={`animate-spin text-blue-600 dark:text-blue-400 ${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span className={`text-gray-600 dark:text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {!input.trim() && !isLoading && messages.length <= 1 && (
            <div className={`pt-2 pb-2 border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'px-3' : 'px-4'}`}>
              <p className={`text-gray-500 dark:text-gray-400 mb-2 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>💡 Suggested questions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.slice(0, isMobile ? 2 : 4).map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(question)}
                    className={`bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800 ${
                      isMobile ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'
                    }`}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className={`border-t border-gray-200 dark:border-gray-700 ${isMobile ? 'p-3' : 'p-4'}`}>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isMobile ? "Ask me anything..." : "Ask me anything... (Press / to focus)"}
                className={`flex-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all ${
                  isMobile ? 'px-3 py-2 text-sm' : 'px-4 py-2'
                }`}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  isMobile ? 'p-2' : 'p-2'
                }`}
                aria-label="Send message"
              >
                {isLoading ? (
                  <Loader2 className={`animate-spin ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                ) : (
                  <Send className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

