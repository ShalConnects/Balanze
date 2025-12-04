/**
 * Granular Loading States Utility
 * Provides detailed loading state management for complex operations
 */

export interface LoadingStep {
  id: string;
  name: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  progress: number; // 0-100
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface LoadingState {
  isActive: boolean;
  overallProgress: number; // 0-100
  currentStep?: string;
  steps: LoadingStep[];
  errors: string[];
  startTime?: number;
  endTime?: number;
  totalDuration?: number;
}

export class LoadingStateManager {
  private state: LoadingState = {
    isActive: false,
    overallProgress: 0,
    steps: [],
    errors: []
  };
  private listeners: Array<(state: LoadingState) => void> = [];

  /**
   * Initialize loading state with steps
   */
  initialize(steps: Array<{ id: string; name: string }>): void {
    this.state = {
      isActive: true,
      overallProgress: 0,
      currentStep: steps[0]?.id,
      steps: steps.map(step => ({
        ...step,
        status: 'pending' as const,
        progress: 0
      })),
      errors: [],
      startTime: Date.now()
    };
    this.notifyListeners();
  }

  /**
   * Start a specific step
   */
  startStep(stepId: string): void {
    const step = this.state.steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'loading';
      step.startTime = Date.now();
      this.state.currentStep = stepId;
      this.updateOverallProgress();
      this.notifyListeners();
    }
  }

  /**
   * Update progress for a specific step
   */
  updateStepProgress(stepId: string, progress: number): void {
    const step = this.state.steps.find(s => s.id === stepId);
    if (step && step.status === 'loading') {
      step.progress = Math.min(100, Math.max(0, progress));
      this.updateOverallProgress();
      this.notifyListeners();
    }
  }

  /**
   * Complete a step successfully
   */
  completeStep(stepId: string): void {
    const step = this.state.steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'success';
      step.progress = 100;
      step.endTime = Date.now();
      this.updateOverallProgress();
      this.notifyListeners();
    }
  }

  /**
   * Mark a step as failed
   */
  failStep(stepId: string, error: string): void {
    const step = this.state.steps.find(s => s.id === stepId);
    if (step) {
      step.status = 'error';
      step.error = error;
      step.endTime = Date.now();
      this.state.errors.push(`${step.name}: ${error}`);
      this.updateOverallProgress();
      this.notifyListeners();
    }
  }

  /**
   * Complete the entire loading process
   */
  complete(): void {
    this.state.isActive = false;
    this.state.endTime = Date.now();
    this.state.totalDuration = this.state.endTime - (this.state.startTime || 0);
    this.notifyListeners();
  }

  /**
   * Reset the loading state
   */
  reset(): void {
    this.state = {
      isActive: false,
      overallProgress: 0,
      steps: [],
      errors: []
    };
    this.notifyListeners();
  }

  /**
   * Get current state
   */
  getState(): LoadingState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: LoadingState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update overall progress based on step progress
   */
  private updateOverallProgress(): void {
    if (this.state.steps.length === 0) {
      this.state.overallProgress = 0;
      return;
    }

    const totalProgress = this.state.steps.reduce((sum, step) => {
      return sum + step.progress;
    }, 0);

    this.state.overallProgress = Math.round(totalProgress / this.state.steps.length);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getState());
      } catch (error) {
        console.error('Error in loading state listener:', error);
      }
    });
  }
}

/**
 * React hook for granular loading states
 */
export const useGranularLoading = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isActive: false,
    overallProgress: 0,
    steps: [],
    errors: []
  });

  const manager = useMemo(() => new LoadingStateManager(), []);

  useEffect(() => {
    const unsubscribe = manager.subscribe(setLoadingState);
    return unsubscribe;
  }, [manager]);

  const initialize = useCallback((steps: Array<{ id: string; name: string }>) => {
    manager.initialize(steps);
  }, [manager]);

  const startStep = useCallback((stepId: string) => {
    manager.startStep(stepId);
  }, [manager]);

  const updateStepProgress = useCallback((stepId: string, progress: number) => {
    manager.updateStepProgress(stepId, progress);
  }, [manager]);

  const completeStep = useCallback((stepId: string) => {
    manager.completeStep(stepId);
  }, [manager]);

  const failStep = useCallback((stepId: string, error: string) => {
    manager.failStep(stepId, error);
  }, [manager]);

  const complete = useCallback(() => {
    manager.complete();
  }, [manager]);

  const reset = useCallback(() => {
    manager.reset();
  }, [manager]);

  return {
    loadingState,
    initialize,
    startStep,
    updateStepProgress,
    completeStep,
    failStep,
    complete,
    reset
  };
};

// Import React hooks
import { useState, useEffect, useMemo, useCallback } from 'react';
