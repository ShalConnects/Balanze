import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, Square, X, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PomodoroTimerBar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    // Restore expanded state from localStorage
    const saved = localStorage.getItem('pomodoroTimerExpanded');
    return saved ? JSON.parse(saved) : false; // Default to minimized
  });
  
  const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState<boolean>(false);

  const [pomodoroTimer, setPomodoroTimer] = useState<{
    taskId: string | null;
    timeRemaining: number;
    isRunning: boolean;
    endTime: number | null;
  } | null>(null);
  const [taskName, setTaskName] = useState<string>('');

  // Initialize timer state from localStorage (same as All Tasks modal)
  useEffect(() => {
    const saved = localStorage.getItem('pomodoroTimerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.endTime && parsed.isRunning) {
          const now = Date.now();
          const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
          if (timeRemaining <= 0) {
            localStorage.removeItem('pomodoroTimerState');
            setPomodoroTimer(null);
          } else {
            setPomodoroTimer({ ...parsed, timeRemaining });
          }
        } else {
          setPomodoroTimer(parsed);
        }
      } catch (e) {
        setPomodoroTimer(null);
      }
    }
  }, []);

  // Listen for timer state changes from All Tasks modal (same pattern)
  useEffect(() => {
    const handleTimerStateChange = () => {
      const saved = localStorage.getItem('pomodoroTimerState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.endTime && parsed.isRunning) {
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
            if (timeRemaining <= 0) {
              setPomodoroTimer(null);
              return;
            }
            setPomodoroTimer({ ...parsed, timeRemaining });
          } else {
            setPomodoroTimer(parsed);
          }
        } catch (e) {
          // Error handling
        }
      } else {
        setPomodoroTimer(null);
      }
    };
    
    window.addEventListener('pomodoroTimerStateChange', handleTimerStateChange);
    return () => {
      window.removeEventListener('pomodoroTimerStateChange', handleTimerStateChange);
    };
  }, []);

  // Save timer state to localStorage whenever it changes (same as All Tasks modal)
  useEffect(() => {
    if (pomodoroTimer) {
      localStorage.setItem('pomodoroTimerState', JSON.stringify(pomodoroTimer));
    } else {
      localStorage.removeItem('pomodoroTimerState');
    }
  }, [pomodoroTimer]);

  // Timer countdown - update every second when running (same as All Tasks modal)
  useEffect(() => {
    if (!pomodoroTimer || !pomodoroTimer.isRunning || !pomodoroTimer.endTime) return;

    const interval = setInterval(() => {
      setPomodoroTimer(prev => {
        if (!prev || !prev.isRunning || !prev.endTime) return prev;
        
        // Calculate time remaining from endTime (same as All Tasks modal)
        const now = Date.now();
        const timeRemaining = Math.max(0, Math.floor((prev.endTime - now) / 1000));
        
        if (timeRemaining <= 0) {
          return { ...prev, timeRemaining: 0, isRunning: false, endTime: null };
        }
        
        return { ...prev, timeRemaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pomodoroTimer?.isRunning, pomodoroTimer?.endTime]);

  // Check if All Tasks modal is open
  useEffect(() => {
    const loadTimerState = () => {
      const saved = localStorage.getItem('pomodoroTimerState');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.endTime && parsed.isRunning) {
            const now = Date.now();
            const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
            if (timeRemaining <= 0) {
              setPomodoroTimer(null);
              return;
            }
            setPomodoroTimer({ ...parsed, timeRemaining });
          } else {
            setPomodoroTimer(parsed);
          }
        } catch (e) {
          // Error handling
        }
      } else {
        setPomodoroTimer(null);
      }
    };

    const checkModalState = () => {
      const saved = localStorage.getItem('showAllTasksModal');
      const isOpen = saved === 'true';
      const wasOpen = isAllTasksModalOpen;
      setIsAllTasksModalOpen(isOpen);
      
      // When modal closes (was open, now closed), reset to minimized and reload timer state
      if (wasOpen && !isOpen) {
        setIsExpanded(false);
        localStorage.setItem('pomodoroTimerExpanded', 'false');
        // Reload timer state from localStorage to ensure sync
        loadTimerState();
      }
    };
    
    // Initialize - if no value exists, assume modal is closed
    if (!localStorage.getItem('showAllTasksModal')) {
      localStorage.setItem('showAllTasksModal', 'false');
    }
    
    checkModalState();
    // Check for modal state changes (reduced frequency to avoid flooding)
    const interval = setInterval(checkModalState, 500);
    // Listen for storage events (fires when localStorage changes in other tabs/windows)
    window.addEventListener('storage', checkModalState);
    
    // Also listen for custom events (for same-tab updates)
    const handleModalStateChange = () => {
      checkModalState();
    };
    window.addEventListener('pomodoroModalStateChange', handleModalStateChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', checkModalState);
      window.removeEventListener('pomodoroModalStateChange', handleModalStateChange);
    };
  }, [isAllTasksModalOpen]);

  // Fetch task name when taskId changes
  useEffect(() => {
    if (pomodoroTimer?.taskId) {
      const fetchTaskName = async () => {
        try {
          const { data } = await supabase
            .from('tasks')
            .select('text')
            .eq('id', pomodoroTimer.taskId)
            .single();
          if (data) {
            setTaskName(data.text);
          }
        } catch (e) {
          setTaskName('Task');
        }
      };
      fetchTaskName();
    } else {
      setTaskName('');
    }
  }, [pomodoroTimer?.taskId]);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage (for progress bar)
  const getProgress = (): number => {
    if (!pomodoroTimer || !pomodoroTimer.taskId) return 0;
    const saved = localStorage.getItem('pomodoroTimerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Get original duration from task duration settings
        const taskDurations = localStorage.getItem('taskPomodoroDurations');
        const defaultDuration = parseInt(localStorage.getItem('pomodoroDuration') || '20', 10);
        let duration = defaultDuration;
        if (taskDurations) {
          const durations = JSON.parse(taskDurations);
          if (durations[parsed.taskId]) {
            duration = durations[parsed.taskId];
          }
        }
        const totalSeconds = duration * 60;
        const remaining = pomodoroTimer.timeRemaining;
        return Math.max(0, Math.min(100, ((totalSeconds - remaining) / totalSeconds) * 100));
      } catch (e) {
        return 0;
      }
    }
    return 0;
  };

  // Timer control functions
  const handlePauseResume = () => {
    if (!pomodoroTimer) return;
    const saved = localStorage.getItem('pomodoroTimerState');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isRunning) {
          // Pause
          const now = Date.now();
          const timeRemaining = Math.max(0, Math.floor((parsed.endTime - now) / 1000));
          parsed.isRunning = false;
          parsed.endTime = null;
          parsed.timeRemaining = timeRemaining;
        } else {
          // Resume
          parsed.endTime = Date.now() + (parsed.timeRemaining * 1000);
          parsed.isRunning = true;
        }
        localStorage.setItem('pomodoroTimerState', JSON.stringify(parsed));
        setPomodoroTimer(parsed);
        // Dispatch event to notify NotesAndTodosWidget
        window.dispatchEvent(new CustomEvent('pomodoroTimerStateChange'));
      } catch (e) {
        console.error('Error in handlePauseResume:', e);
      }
    }
  };

  const handleStop = () => {
    localStorage.removeItem('pomodoroTimerState');
    setPomodoroTimer(null);
    // Dispatch event to notify NotesAndTodosWidget
    window.dispatchEvent(new CustomEvent('pomodoroTimerStateChange'));
  };

  const toggleExpand = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    localStorage.setItem('pomodoroTimerExpanded', JSON.stringify(newState));
  };

  if (!pomodoroTimer || isAllTasksModalOpen) return null;

  const progress = getProgress();

  // Minimized badge view
  if (!isExpanded) {
    
    return (
      <div className="fixed bottom-12 left-4 z-50">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer group">
          <button
            onClick={toggleExpand}
            className="flex items-center gap-2 px-4 py-3 text-white"
            title="Expand timer"
          >
            <Timer className="w-5 h-5" />
            <span className="font-bold text-sm">
              {formatTime(pomodoroTimer.timeRemaining)}
            </span>
            <Maximize2 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded modal view
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-300">
      {/* Progress Bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Expanded Timer Content */}
      <div className="px-2 py-1.5 max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <span className="font-semibold text-base text-gray-900 dark:text-white">
              {formatTime(pomodoroTimer.timeRemaining)}
            </span>
            {taskName && (
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {taskName}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handlePauseResume}
              className="px-2.5 py-1.5 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-md transition-all flex items-center gap-1 text-xs font-medium"
              title={pomodoroTimer.isRunning ? 'Pause' : 'Resume'}
            >
              {pomodoroTimer.isRunning ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleStop}
              className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md transition-colors"
              title="Stop"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleExpand}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

