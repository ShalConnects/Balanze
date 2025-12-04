import { useEffect, useRef, useCallback } from 'react';
import { useState } from 'react';

interface UseKeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (direction: 'forward' | 'backward') => void;
  trapFocus?: boolean;
  focusableSelectors?: string;
}

export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const containerRef = useRef<HTMLElement>(null);
  const {
    onEscape,
    onEnter,
    onTab,
    trapFocus = false,
    focusableSelectors = 'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  } = options;

  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll(focusableSelectors)
    ) as HTMLElement[];
  }, [focusableSelectors]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const { key, shiftKey, target } = event;

    // Handle Escape key
    if (key === 'Escape' && onEscape) {
      event.preventDefault();
      onEscape();
      return;
    }

    // Handle Enter key
    if (key === 'Enter' && onEnter) {
      event.preventDefault();
      onEnter();
      return;
    }

    // Handle Tab key for focus trapping
    if (key === 'Tab' && trapFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (shiftKey) {
        // Shift + Tab: move backward
        if (target === firstElement) {
          event.preventDefault();
          lastElement.focus();
          onTab?.('backward');
        }
      } else {
        // Tab: move forward
        if (target === lastElement) {
          event.preventDefault();
          firstElement.focus();
          onTab?.('forward');
        }
      }
    }
  }, [onEscape, onEnter, onTab, trapFocus, getFocusableElements]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  const focusLastElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
    getFocusableElements
  };
};

// Hook for managing focus in modals
export const useModalFocus = (isOpen: boolean) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length > 0) {
          (focusableElements[0] as HTMLElement).focus();
        } else {
          modalRef.current.focus();
        }
      }
    } else {
      // Restore focus when modal closes
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  return modalRef;
};

// Hook for managing focus in lists
export const useListNavigation = <T>(
  items: T[],
  onSelect?: (item: T, index: number) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (items.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev < items.length - 1 ? prev + 1 : 0
        );
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => 
          prev > 0 ? prev - 1 : items.length - 1
        );
        break;
      
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (focusedIndex >= 0 && onSelect) {
          onSelect(items[focusedIndex], focusedIndex);
        }
        break;
      
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
      
      case 'End':
        event.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
    }
  }, [items, focusedIndex, onSelect]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    list.addEventListener('keydown', handleKeyDown);
    return () => list.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const focusItem = useCallback((index: number) => {
    setFocusedIndex(index);
    if (listRef.current) {
      const itemElement = listRef.current.children[index] as HTMLElement;
      if (itemElement) {
        itemElement.focus();
      }
    }
  }, []);

  return {
    listRef,
    focusedIndex,
    focusItem,
    setFocusedIndex
  };
}; 

