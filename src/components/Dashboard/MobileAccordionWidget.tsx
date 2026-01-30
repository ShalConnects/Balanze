import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Calendar, FileText, TrendingUp, Sparkles } from 'lucide-react';
import { LastWishCountdownWidget } from './LastWishCountdownWidget';
// NotesWidget and TodosWidget loaded dynamically to reduce initial bundle size
// import { NotesWidget } from './NotesWidget';
// import { TodosWidget } from './TodosWidget';
import { MotivationalQuote } from './MotivationalQuote';
import { RecentTransactions } from './RecentTransactions';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { HabitGardenWidget } from '../Habits/HabitGardenWidget';
import { WidgetConfig } from './WidgetSettingsPanel';

interface MobileAccordionWidgetProps {
  isDemo?: boolean;
  MockLastWishCountdownWidget?: React.ComponentType;
  MockRecentTransactions?: React.ComponentType;
  widgetConfig?: WidgetConfig[];
}

export const MobileAccordionWidget: React.FC<MobileAccordionWidgetProps> = ({ 
  isDemo = false, 
  MockLastWishCountdownWidget,
  MockRecentTransactions,
  widgetConfig = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { profile } = useAuthStore();
  const [NotesWidget, setNotesWidget] = useState<React.ComponentType | null>(null);
  const [TodosWidget, setTodosWidget] = useState<React.ComponentType | null>(null);

  // Lazy load NotesWidget and TodosWidget when accordion is expanded and widget is visible
  useEffect(() => {
    const notesVisible = widgetConfig.length === 0 || (widgetConfig.find(w => w.id === 'notes')?.visible ?? true);
    if (isExpanded && !NotesWidget && notesVisible) {
      import('./NotesWidget').then((module) => {
        setNotesWidget(() => module.NotesWidget);
      }).catch(() => {
        // Silently fail if widget can't be loaded
      });
    }
  }, [isExpanded, NotesWidget, widgetConfig]);

  useEffect(() => {
    const todosVisible = widgetConfig.length === 0 || (widgetConfig.find(w => w.id === 'todos')?.visible ?? true);
    if (isExpanded && !TodosWidget && todosVisible) {
      import('./TodosWidget').then((module) => {
        setTodosWidget(() => module.TodosWidget);
      }).catch(() => {
        // Silently fail if widget can't be loaded
      });
    }
  }, [isExpanded, TodosWidget, widgetConfig]);
  
  // Check if user has Premium plan for Last Wish
  const isPremium = profile?.subscription?.plan === 'premium';

  // Helper function to check if a widget is visible
  const isWidgetVisible = (widgetId: string): boolean => {
    if (widgetConfig.length === 0) return true; // Default to visible if no config
    const widget = widgetConfig.find(w => w.id === widgetId);
    return widget ? widget.visible : true; // Default to visible if not found
  };

  // Get visible widgets sorted by order
  const visibleWidgets = useMemo(() => {
    const widgets = [];
    const addedIds = new Set<string>(); // Track added widget IDs to prevent duplicates
    
    // Only include last-wish if user is premium/demo AND widget is visible
    if ((isDemo || isPremium) && isWidgetVisible('last-wish') && !addedIds.has('last-wish')) {
      widgets.push({ id: 'last-wish', visible: true, order: widgetConfig.find(w => w.id === 'last-wish')?.order ?? 0 });
      addedIds.add('last-wish');
    }
    
    if (isWidgetVisible('habit-garden') && !addedIds.has('habit-garden')) {
      widgets.push({ id: 'habit-garden', visible: true, order: widgetConfig.find(w => w.id === 'habit-garden')?.order ?? 2 });
      addedIds.add('habit-garden');
    }
    
    if (isWidgetVisible('notes') && !addedIds.has('notes')) {
      widgets.push({ id: 'notes', visible: true, order: widgetConfig.find(w => w.id === 'notes')?.order ?? 4 });
      addedIds.add('notes');
    }
    
    if (isWidgetVisible('todos') && !addedIds.has('todos')) {
      widgets.push({ id: 'todos', visible: true, order: widgetConfig.find(w => w.id === 'todos')?.order ?? 5 });
      addedIds.add('todos');
    }
    
    return widgets.sort((a, b) => a.order - b.order);
  }, [widgetConfig, isDemo, isPremium]);

  // Generate description text based on visible widgets
  const getAccordionDescription = (): string => {
    const parts: string[] = [];
    
    if ((isDemo || isPremium) && isWidgetVisible('last-wish')) {
      parts.push('Last Wish');
    }
    
    parts.push('Daily Inspiration');
    
    if (isWidgetVisible('notes')) {
      parts.push('Notes');
    }
    
    if (isWidgetVisible('todos')) {
      parts.push('Todos');
    }
    
    if (isWidgetVisible('habit-garden')) {
      parts.push('Habits');
    }
    
    return parts.join(' • ');
  };

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Recent Transactions - Outside Accordion */}
      <div className="w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 lg:p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-blue-200/50 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700 transaction-list-mobile">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h2>
          {!isDemo && (
            <Link 
              to="/transactions" 
              className="text-sm font-medium flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          {isDemo && (
            <div className="text-sm font-medium flex items-center space-x-1 text-gray-400 cursor-not-allowed">
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          )}
        </div>
        {isDemo && MockRecentTransactions ? (
          <MockRecentTransactions />
        ) : (
          <RecentTransactions />
        )}
      </div>

      {/* Today's Overview Accordion */}
      <div className="mobile-accordion">
        {/* Accordion Header */}
        <div className="mobile-accordion-header" onClick={toggleAccordion}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Extras
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getAccordionDescription()}
              </p>
            </div>
          </div>
          <ChevronDown 
            className={`mobile-accordion-chevron w-5 h-5 text-gray-500 ${
              isExpanded ? 'rotated' : ''
            }`} 
          />
        </div>

        {/* Accordion Content */}
        <div className={`mobile-accordion-content ${isExpanded ? 'expanded' : 'collapsed'}`}>
          <div className="space-y-0">
            {/* Render widgets in order based on widgetConfig */}
            {visibleWidgets.map((widget, index) => {
              // Check if this is the last widget before Motivational Quote
              const isLastWidget = index === visibleWidgets.length - 1;
              const borderClass = isLastWidget ? '' : 'border-b border-gray-200 dark:border-gray-700';
              
              if (widget.id === 'last-wish') {
                return (
                  <div key={widget.id} className={borderClass}>
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
                      {isDemo && MockLastWishCountdownWidget ? (
                        <MockLastWishCountdownWidget />
                      ) : (
                        <LastWishCountdownWidget />
                      )}
                    </div>
                  </div>
                );
              }
              
              if (widget.id === 'habit-garden') {
                return (
                  <div key={widget.id} className={borderClass}>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                      <HabitGardenWidget />
                    </div>
                  </div>
                );
              }
              
              if (widget.id === 'notes') {
                return (
                  <div key={widget.id} className={borderClass}>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      {NotesWidget ? <NotesWidget /> : null}
                    </div>
                  </div>
                );
              }
              
              if (widget.id === 'todos') {
                return (
                  <div key={widget.id} className={borderClass}>
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                      {TodosWidget ? <TodosWidget /> : null}
                    </div>
                  </div>
                );
              }
              
              return null;
            })}

            {/* Daily Inspiration Section - Always visible */}
            <div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <MotivationalQuote />
              </div>
            </div>

            {/* Premium Upgrade Prompt for Free Users - Only show if Last Wish is not visible */}
            {!isDemo && !isPremium && !isWidgetVisible('last-wish') && (
              <div>
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Last Wish Feature</h4>
                  </div>
                  <div className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                    Set up automatic data sharing for your loved ones with our Last Wish feature.
                  </div>
                  <Link 
                    to="/settings?tab=last-wish" 
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 text-sm font-medium shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
