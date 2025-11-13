/**
 * Example: How to integrate AI Chat Bot into your components
 * 
 * This file demonstrates various integration patterns
 */

import React, { useState } from 'react';
import { AIChatBot } from './AIChatBot';
import { AIChatButton } from './AIChatButton';
import { useAIChatIntegration } from '../../hooks/useAIChatIntegration';

/**
 * Example 1: Basic integration with floating button
 */
export const BasicChatIntegration: React.FC = () => {
  return (
    <AIChatBot 
      showFloatingButton={true}
    />
  );
};

/**
 * Example 2: Controlled chat with pre-filled query
 */
export const ControlledChatWithQuery: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState<string>('');

  const handleOpenWithQuery = (q: string) => {
    setQuery(q);
    setIsOpen(true);
  };

  return (
    <>
      <button onClick={() => handleOpenWithQuery("What's my balance?")}>
        Check Balance
      </button>
      <AIChatBot 
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        initialQuery={query}
        showFloatingButton={false}
      />
    </>
  );
};

/**
 * Example 3: Context-aware integration using the hook
 */
export const ContextAwareChat: React.FC<{ page: string }> = ({ page }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getContextualQueries, generateContextualQuery } = useAIChatIntegration();
  
  const queries = getContextualQueries({ page });
  const defaultQuery = generateContextualQuery({ action: 'analyze' });

  return (
    <>
      <div className="flex gap-2">
        {queries.slice(0, 3).map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsOpen(true);
              // Query will be sent via initialQuery prop
            }}
            className="px-3 py-1 text-sm bg-blue-100 rounded"
          >
            {q}
          </button>
        ))}
      </div>
      <AIChatBot 
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        initialQuery={defaultQuery}
        showFloatingButton={false}
      />
    </>
  );
};

/**
 * Example 4: Header/Navigation integration
 */
export const HeaderChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AIChatButton 
        onClick={() => setIsOpen(true)}
        showBadge={true}
      />
      <AIChatBot 
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        showFloatingButton={false}
      />
    </>
  );
};

/**
 * Example 5: Context-specific integration (e.g., from a category page)
 */
export const CategoryPageChat: React.FC<{ category: string }> = ({ category }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { generateContextualQuery } = useAIChatIntegration();

  const query = generateContextualQuery({
    action: 'analyze',
    category: category
  });

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Ask AI about {category}
      </button>
      <AIChatBot 
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        initialQuery={query}
        showFloatingButton={false}
      />
    </>
  );
};

