import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, Square, X, Minimize2, Maximize2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const PomodoroTimerBar: React.FC = () => {
  // Detect Android device
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    // Restore expanded state from localStorage
    const saved = localStorage.getItem('pomodoroTimerExpanded');
    return saved ? JSON.parse(saved) : false; // Default to minimized
  });
  
  const [isAllTasksModalOpen, setIsAllTasksModalOpen] = useState<boolean>(false);
  
  // Timer position state (for draggable functionality)
  // Position is stored as { x: left, y: bottom } for desktop, { x: left, y: top } for Android
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const saved = localStorage.getItem('pomodoroTimerPosition');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate position is within reasonable bounds
        if (parsed.x >= 0 && parsed.y >= 0 && parsed.x < window.innerWidth && parsed.y < window.innerHeight) {
          return parsed;
        }
      } catch (e) {
        // Fallback to default position
      }
    }
    // Default: bottom-left (left-4, bottom-12 or bottom with safe area)
    if (isAndroid) {
      return { x: 16, y: 24 }; // top: 24px, left: 16px
    } else {
      return { x: 16, y: 48 }; // bottom: 48px, left: 16px
    }
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const buttonDimensionsRef = useRef<{ width: number; height: number }>({ width: 200, height: 48 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    const saved = localStorage.getItem('pomodoroTimerHidden');
    return saved ? JSON.parse(saved) : false;
  });

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
          // For paused timers, validate they have a taskId and valid timeRemaining
          if (parsed.taskId && parsed.timeRemaining >= 0) {
            setPomodoroTimer(parsed);
          } else {
            // Invalid timer state, clear it
            localStorage.removeItem('pomodoroTimerState');
            setPomodoroTimer(null);
          }
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
            // For paused timers, validate they have a taskId and valid timeRemaining
            if (parsed.taskId && parsed.timeRemaining >= 0) {
              setPomodoroTimer(parsed);
            } else {
              // Invalid timer state, clear it
              localStorage.removeItem('pomodoroTimerState');
              setPomodoroTimer(null);
            }
          }
        } catch (e) {
          // Error handling
          setPomodoroTimer(null);
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
            // For paused timers, validate they have a taskId and valid timeRemaining
            if (parsed.taskId && parsed.timeRemaining >= 0) {
              setPomodoroTimer(parsed);
            } else {
              // Invalid timer state, clear it
              localStorage.removeItem('pomodoroTimerState');
              setPomodoroTimer(null);
            }
          }
        } catch (e) {
          // Error handling
          setPomodoroTimer(null);
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
        // Reset hidden state so timer reappears when modal closes
        setIsHidden(false);
        localStorage.setItem('pomodoroTimerHidden', JSON.stringify(false));
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

  // Sync isExpanded state with localStorage changes (only on mount and storage events)
  useEffect(() => {
    const checkExpandedState = () => {
      const saved = localStorage.getItem('pomodoroTimerExpanded');
      if (saved) {
        const parsed = JSON.parse(saved);
        setIsExpanded(parsed);
      }
    };
    
    // Check immediately on mount
    checkExpandedState();
    
    // Listen for storage events (from other tabs)
    window.addEventListener('storage', checkExpandedState);
    
    return () => {
      window.removeEventListener('storage', checkExpandedState);
    };
  }, []); // Only run on mount

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Handle long-press for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimerRef.current = setTimeout(() => {
      setContextMenuPosition({ x: touch.clientX, y: touch.clientY });
      setShowContextMenu(true);
    }, 500); // 500ms for long press
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Close context menu on click outside or ESC
  useEffect(() => {
    if (!showContextMenu) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowContextMenu(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-timer-container]')) {
        setShowContextMenu(false);
      }
    };

    window.addEventListener('keydown', handleEsc);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      window.removeEventListener('click', handleClickOutside);
    };
  }, [showContextMenu]);

  // Handle hide timer (hide button but don't stop timer)
  const handleHideTimer = () => {
    setIsHidden(true);
    localStorage.setItem('pomodoroTimerHidden', JSON.stringify(true));
  };

  // Save hidden state to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroTimerHidden', JSON.stringify(isHidden));
  }, [isHidden]);

  // Save position to localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroTimerPosition', JSON.stringify(position));
  }, [position]);

  // Snap to grid/corners function
  const snapPosition = (x: number, y: number, windowWidth: number, windowHeight: number) => {
    const snapThreshold = 50; // pixels
    const buttonWidth = 120; // approximate button width
    const buttonHeight = 48; // approximate button height
    
    // Convert y coordinate based on coordinate system
    // For desktop: y is from bottom, for Android: y is from top
    let actualY: number;
    if (isAndroid) {
      actualY = y; // y is already from top
    } else {
      actualY = windowHeight - y - buttonHeight; // convert from bottom to top
    }
    
    // Define snap points (corners and edges) - all in top-left coordinate system
    const snapPoints = [
      { x: 16, y: 16, label: 'top-left' }, // top-left
      { x: windowWidth - buttonWidth - 16, y: 16, label: 'top-right' }, // top-right
      { x: 16, y: windowHeight - buttonHeight - (isAndroid ? 24 : 48), label: 'bottom-left' }, // bottom-left
      { x: windowWidth - buttonWidth - 16, y: windowHeight - buttonHeight - (isAndroid ? 24 : 48), label: 'bottom-right' }, // bottom-right
      { x: (windowWidth - buttonWidth) / 2, y: 16, label: 'top-center' }, // top-center
      { x: (windowWidth - buttonWidth) / 2, y: windowHeight - buttonHeight - (isAndroid ? 24 : 48), label: 'bottom-center' }, // bottom-center
      { x: 16, y: (windowHeight - buttonHeight) / 2, label: 'left-center' }, // left-center
      { x: windowWidth - buttonWidth - 16, y: (windowHeight - buttonHeight) / 2, label: 'right-center' }, // right-center
    ];
    
    // Find closest snap point
    let closestSnap = snapPoints[0];
    let minDistance = Infinity;
    
    for (const snap of snapPoints) {
      const distance = Math.sqrt(Math.pow(x - snap.x, 2) + Math.pow(actualY - snap.y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        closestSnap = snap;
      }
    }
    
    // Snap if within threshold
    if (minDistance < snapThreshold) {
      if (isAndroid) {
        return { x: closestSnap.x, y: closestSnap.y };
      } else {
        // Convert back to bottom coordinate system
        return { x: closestSnap.x, y: windowHeight - closestSnap.y - buttonHeight };
      }
    }
    
    // Keep current position if not close to any snap point, but constrain to viewport
    const constrainedX = Math.max(0, Math.min(x, windowWidth - buttonWidth));
    if (isAndroid) {
      const constrainedY = Math.max(0, Math.min(actualY, windowHeight - buttonHeight));
      return { x: constrainedX, y: constrainedY };
    } else {
      const constrainedY = Math.max(0, Math.min(y, windowHeight - buttonHeight));
      return { x: constrainedX, y: constrainedY };
    }
  };

  // Drag handlers for mouse (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    // Cache button dimensions once at drag start to avoid forced reflows
    const buttonElement = document.querySelector('[data-timer-container]') as HTMLElement;
    if (buttonElement) {
      buttonDimensionsRef.current = {
        width: buttonElement.offsetWidth,
        height: buttonElement.offsetHeight,
      };
    }
    setIsDragging(true);
    setHasDragged(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    let rafId: number | null = null;
    let pendingPosition: { x: number; y: number } | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      setHasDragged(true);
      
      // Use cached dimensions to avoid forced reflows
      const buttonWidth = buttonDimensionsRef.current.width;
      const buttonHeight = buttonDimensionsRef.current.height;
      
      const newX = e.clientX - dragOffset.x;
      
      let newY: number;
      if (isAndroid) {
        // For Android, y is from top
        newY = e.clientY - dragOffset.y;
      } else {
        // For desktop, y is from bottom
        const windowHeight = window.innerHeight;
        newY = windowHeight - (e.clientY - dragOffset.y) - buttonHeight;
      }
      
      // Store pending position
      pendingPosition = { x: newX, y: newY };
      
      // Batch layout reads/writes with requestAnimationFrame
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          if (pendingPosition) {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            
            // Constrain to viewport - ensure button stays fully visible
            const constrainedX = Math.max(0, Math.min(pendingPosition.x, windowWidth - buttonWidth));
            const constrainedY = Math.max(0, Math.min(pendingPosition.y, windowHeight - buttonHeight));
            
            setPosition({ x: constrainedX, y: constrainedY });
            pendingPosition = null;
          }
          rafId = null;
        });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      
      // Snap on release - use requestAnimationFrame to batch layout reads
      requestAnimationFrame(() => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Use cached dimensions to avoid forced reflows
        const buttonWidth = buttonDimensionsRef.current.width;
        const buttonHeight = buttonDimensionsRef.current.height;
        
        // Ensure position is within bounds before snapping
        const constrainedPosition = {
          x: Math.max(0, Math.min(position.x, windowWidth - buttonWidth)),
          y: Math.max(0, Math.min(position.y, windowHeight - buttonHeight))
        };
        
        const snapped = snapPosition(constrainedPosition.x, constrainedPosition.y, windowWidth, windowHeight);
        setPosition(snapped);
        setIsDragging(false);
        // Reset hasDragged after a short delay to allow click handler to check it
        setTimeout(() => setHasDragged(false), 100);
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, position, isAndroid]);

  // Drag handlers for touch (mobile) - separate from long press
  const handleTouchStartDrag = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
    setIsDragging(true);
    setHasDragged(false);
    // Clear long press timer if dragging starts
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.preventDefault();
      setHasDragged(true);
      const touch = e.touches[0];
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Get actual button dimensions from the DOM
      const buttonElement = document.querySelector('[data-timer-container]') as HTMLElement;
      const buttonWidth = buttonElement ? buttonElement.offsetWidth : 200; // fallback to 200px
      const buttonHeight = buttonElement ? buttonElement.offsetHeight : 48; // fallback to 48px
      
      const newX = touch.clientX - dragOffset.x;
      
      // For Android, y is from top
      const newY = touch.clientY - dragOffset.y;
      
      // Constrain to viewport - ensure button stays fully visible
      const constrainedX = Math.max(0, Math.min(newX, windowWidth - buttonWidth));
      const constrainedY = Math.max(0, Math.min(newY, windowHeight - buttonHeight));
      
      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Snap on release
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      
      // Get actual button dimensions for final constraint check
      const buttonElement = document.querySelector('[data-timer-container]') as HTMLElement;
      const buttonWidth = buttonElement ? buttonElement.offsetWidth : 200;
      const buttonHeight = buttonElement ? buttonElement.offsetHeight : 48;
      
      // Ensure position is within bounds before snapping
      const constrainedPosition = {
        x: Math.max(0, Math.min(position.x, windowWidth - buttonWidth)),
        y: Math.max(0, Math.min(position.y, windowHeight - buttonHeight))
      };
      
      const snapped = snapPosition(constrainedPosition.x, constrainedPosition.y, windowWidth, windowHeight);
      setPosition(snapped);
      setIsDragging(false);
      // Reset hasDragged after a short delay to allow click handler to check it
      setTimeout(() => setHasDragged(false), 100);
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragOffset, position, isAndroid]);

  if (!pomodoroTimer || isAllTasksModalOpen) return null;

  // Validate timer state - only show if there's a valid task and time remaining
  // Hide if timer has ended (timeRemaining === 0 and isRunning === false)
  if (!pomodoroTimer.taskId || pomodoroTimer.timeRemaining < 0 || (pomodoroTimer.timeRemaining === 0 && !pomodoroTimer.isRunning)) return null;

  // Hide if user manually hid the timer (timer continues running in background)
  if (isHidden) return null;

  const progress = getProgress();

  // Use React state directly (more reliable for immediate updates)
  const currentExpanded = isExpanded;

  return (
    <>
      {/* Timer button with inline controls */}
      <div 
        data-timer-container
        className={`fixed z-[9998] transition-all duration-300 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{
          left: `${position.x}px`,
          ...(isAndroid 
            ? { top: `${position.y}px` }
            : { bottom: `${position.y}px` }
          ),
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {/* Timer button with controls */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all group">
          <div className="flex items-center gap-1 px-3 py-2.5">
            <button
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStartDrag}
              onContextMenu={handleContextMenu}
              onTouchStartCapture={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="flex items-center gap-2 text-white touch-manipulation select-none flex-1 min-w-0"
              title="Drag to move, right-click/long-press for menu"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <Timer className="w-4 h-4 flex-shrink-0" />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-bold text-sm leading-tight">
                  {formatTime(pomodoroTimer.timeRemaining)}
                </span>
                {taskName && (
                  <span className="text-xs text-white/90 truncate leading-tight" title={taskName}>
                    {taskName}
                  </span>
                )}
              </div>
            </button>
            
            {/* Inline control buttons */}
            <div className="flex items-center gap-1 border-l border-white/20 pl-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePauseResume();
                }}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                title={pomodoroTimer.isRunning ? 'Pause' : 'Resume'}
              >
                {pomodoroTimer.isRunning ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleStop();
                }}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                title="Stop"
              >
                <Square className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleHideTimer();
                }}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                title="Hide timer (timer continues running)"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Context menu (right-click/long-press) */}
        {showContextMenu && (
          <>
            <div 
              className="fixed inset-0 z-[9997]"
              onClick={() => setShowContextMenu(false)}
            />
            <div 
              className="fixed z-[9999] w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95"
              style={{
                left: `${contextMenuPosition.x}px`,
                top: `${contextMenuPosition.y}px`,
                transform: 'translate(-50%, -100%)',
                marginTop: '-8px',
              }}
            >
              {/* Progress Bar */}
              <div className="h-0.5 bg-gray-200 dark:bg-gray-700 rounded-t-lg">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 rounded-t-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Timer Display */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">
                      {formatTime(pomodoroTimer.timeRemaining)}
                    </div>
                    {taskName && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {taskName}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => {
                    handlePauseResume();
                    setShowContextMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {pomodoroTimer.isRunning ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    handleStop();
                    setShowContextMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

