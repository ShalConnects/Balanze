/**
 * Enhanced Gesture Recognition
 * Provides advanced touch gesture recognition for mobile devices
 */

export interface GestureState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
  velocity: number;
  direction: 'up' | 'down' | 'left' | 'right' | 'none';
  isAtTop: boolean;
  isAtBottom: boolean;
  isHorizontal: boolean;
  isVertical: boolean;
}

export interface GestureConfig {
  minVelocity?: number;
  minDistance?: number;
  maxDistance?: number;
  velocityThreshold?: number;
  directionThreshold?: number;
}

export class GestureRecognizer {
  private static instance: GestureRecognizer;
  private config: Required<GestureConfig> = {
    minVelocity: 0.5,
    minDistance: 10,
    maxDistance: 300,
    velocityThreshold: 1.0,
    directionThreshold: 0.7
  };
  private gestureState: GestureState = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    direction: 'none',
    isAtTop: false,
    isAtBottom: false,
    isHorizontal: false,
    isVertical: false
  };
  private touchStartTime = 0;
  private lastTouchTime = 0;
  private listeners: Array<(state: GestureState) => void> = [];

  private constructor() {}

  public static getInstance(): GestureRecognizer {
    if (!GestureRecognizer.instance) {
      GestureRecognizer.instance = new GestureRecognizer();
    }
    return GestureRecognizer.instance;
  }

  /**
   * Initialize gesture recognition
   */
  public initialize(config: Partial<GestureConfig> = {}): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle touch start
   */
  public handleTouchStart(e: TouchEvent): void {
    const touch = e.touches[0];
    this.touchStartTime = Date.now();
    this.lastTouchTime = this.touchStartTime;
    
    this.gestureState.startX = touch.clientX;
    this.gestureState.startY = touch.clientY;
    this.gestureState.currentX = touch.clientX;
    this.gestureState.currentY = touch.clientY;
    this.gestureState.deltaX = 0;
    this.gestureState.deltaY = 0;
    this.gestureState.velocity = 0;
    this.gestureState.direction = 'none';
    
    // Check scroll position
    const rootElement = document.getElementById('root');
    if (rootElement) {
      this.gestureState.isAtTop = rootElement.scrollTop === 0;
      this.gestureState.isAtBottom = rootElement.scrollTop + rootElement.clientHeight >= rootElement.scrollHeight;
    }
    
    this.notifyListeners();
  }

  /**
   * Handle touch move
   */
  public handleTouchMove(e: TouchEvent): void {
    const touch = e.touches[0];
    const currentTime = Date.now();
    const timeDelta = currentTime - this.lastTouchTime;
    
    this.gestureState.currentX = touch.clientX;
    this.gestureState.currentY = touch.clientY;
    this.gestureState.deltaX = this.gestureState.currentX - this.gestureState.startX;
    this.gestureState.deltaY = this.gestureState.currentY - this.gestureState.startY;
    
    // Calculate velocity
    if (timeDelta > 0) {
      const distance = Math.sqrt(
        Math.pow(this.gestureState.currentX - (this.gestureState.currentX - this.gestureState.deltaX), 2) +
        Math.pow(this.gestureState.currentY - (this.gestureState.currentY - this.gestureState.deltaY), 2)
      );
      this.gestureState.velocity = distance / timeDelta;
    }
    
    // Determine direction
    this.gestureState.direction = this.calculateDirection();
    
    // Determine gesture type
    this.gestureState.isHorizontal = Math.abs(this.gestureState.deltaX) > Math.abs(this.gestureState.deltaY);
    this.gestureState.isVertical = Math.abs(this.gestureState.deltaY) > Math.abs(this.gestureState.deltaX);
    
    this.lastTouchTime = currentTime;
    this.notifyListeners();
  }

  /**
   * Handle touch end
   */
  public handleTouchEnd(e: TouchEvent): void {
    const touchDuration = Date.now() - this.touchStartTime;
    
    // Calculate final velocity
    const totalDistance = Math.sqrt(
      Math.pow(this.gestureState.deltaX, 2) + Math.pow(this.gestureState.deltaY, 2)
    );
    this.gestureState.velocity = touchDuration > 0 ? totalDistance / touchDuration : 0;
    
    this.notifyListeners();
  }

  /**
   * Check if gesture should trigger refresh
   */
  public shouldTriggerRefresh(): boolean {
    const { deltaY, velocity, direction, isAtTop } = this.gestureState;
    
    return (
      isAtTop &&
      direction === 'down' &&
      deltaY > this.config.minDistance &&
      deltaY < this.config.maxDistance &&
      velocity > this.config.velocityThreshold
    );
  }

  /**
   * Check if gesture is valid for refresh
   */
  public isValidRefreshGesture(): boolean {
    const { deltaY, direction, isAtTop, isVertical } = this.gestureState;
    
    return (
      isAtTop &&
      direction === 'down' &&
      isVertical &&
      deltaY > 0 &&
      deltaY < this.config.maxDistance
    );
  }

  /**
   * Get current gesture state
   */
  public getGestureState(): GestureState {
    return { ...this.gestureState };
  }

  /**
   * Subscribe to gesture state changes
   */
  public subscribe(listener: (state: GestureState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Calculate gesture direction
   */
  private calculateDirection(): 'up' | 'down' | 'left' | 'right' | 'none' {
    const { deltaX, deltaY } = this.gestureState;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX < this.config.minDistance && absY < this.config.minDistance) {
      return 'none';
    }
    
    if (absX > absY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getGestureState());
      } catch (error) {
        console.error('Error in gesture recognition listener:', error);
      }
    });
  }
}

/**
 * React hook for gesture recognition
 */
export const useGestureRecognition = (config: Partial<GestureConfig> = {}) => {
  const [gestureState, setGestureState] = useState<GestureState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    velocity: 0,
    direction: 'none',
    isAtTop: false,
    isAtBottom: false,
    isHorizontal: false,
    isVertical: false
  });

  const recognizer = useMemo(() => GestureRecognizer.getInstance(), []);

  useEffect(() => {
    recognizer.initialize(config);
    
    const unsubscribe = recognizer.subscribe(setGestureState);
    
    return unsubscribe;
  }, [recognizer, config]);

  const shouldTriggerRefresh = useCallback(() => {
    return recognizer.shouldTriggerRefresh();
  }, [recognizer]);

  const isValidRefreshGesture = useCallback(() => {
    return recognizer.isValidRefreshGesture();
  }, [recognizer]);

  return {
    gestureState,
    shouldTriggerRefresh,
    isValidRefreshGesture
  };
};

// Import React hooks
import { useState, useEffect, useMemo, useCallback } from 'react';
