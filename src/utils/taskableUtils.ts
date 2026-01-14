/**
 * Utility functions for converting between original types and unified Taskable types
 * 
 * These functions allow seamless conversion between:
 * - Standalone Task <-> TaskableStandaloneTask
 * - Client Task <-> TaskableClientTask
 * - Habit <-> TaskableHabit
 * - Course Module <-> TaskableCourseModule
 */

import type { Task as StandaloneTask } from '../types/index';
import type { Task as ClientTask } from '../types/client';
import type { Habit } from '../types/habit';
import type { CourseModule } from '../types/index';
import type {
  Taskable,
  TaskableStandaloneTask,
  TaskableClientTask,
  TaskableHabit,
  TaskableCourseModule,
} from '../types/taskable';

/**
 * Convert Standalone Task to Taskable
 */
export function standaloneTaskToTaskable(task: StandaloneTask): TaskableStandaloneTask {
  return {
    id: task.id,
    type: 'standalone_task',
    user_id: task.user_id,
    title: task.text, // Map text to title for unified interface
    text: task.text,
    completed: task.completed,
    position: task.position,
    section_override: task.section_override,
    parent_id: task.parent_id,
    created_at: task.created_at,
  };
}

/**
 * Convert Taskable back to Standalone Task
 */
export function taskableToStandaloneTask(taskable: TaskableStandaloneTask): StandaloneTask {
  return {
    id: taskable.id,
    text: taskable.text,
    completed: taskable.completed,
    user_id: taskable.user_id,
    created_at: taskable.created_at,
    position: taskable.position,
    section_override: taskable.section_override,
    parent_id: taskable.parent_id,
  };
}

/**
 * Convert Client Task to Taskable
 */
export function clientTaskToTaskable(task: ClientTask): TaskableClientTask {
  return {
    id: task.id,
    type: 'client_task',
    user_id: task.user_id,
    title: task.title,
    description: task.description,
    client_id: task.client_id,
    due_date: task.due_date,
    priority: task.priority,
    status: task.status,
    completed_date: task.completed_date,
    position: task.position,
    created_at: task.created_at,
    updated_at: task.updated_at,
  };
}

/**
 * Convert Taskable back to Client Task
 */
export function taskableToClientTask(taskable: TaskableClientTask): ClientTask {
  return {
    id: taskable.id,
    user_id: taskable.user_id,
    client_id: taskable.client_id,
    title: taskable.title,
    description: taskable.description,
    due_date: taskable.due_date,
    priority: taskable.priority,
    status: taskable.status,
    completed_date: taskable.completed_date,
    position: taskable.position,
    created_at: taskable.created_at,
    updated_at: taskable.updated_at,
  };
}

/**
 * Convert Habit to Taskable
 */
export function habitToTaskable(habit: Habit): TaskableHabit {
  return {
    id: habit.id,
    type: 'habit',
    user_id: habit.user_id,
    title: habit.title,
    description: habit.description,
    color: habit.color,
    icon: habit.icon,
    position: habit.position,
    created_at: habit.created_at,
    updated_at: habit.updated_at,
  };
}

/**
 * Convert Taskable back to Habit
 */
export function taskableToHabit(taskable: TaskableHabit): Habit {
  return {
    id: taskable.id,
    user_id: taskable.user_id,
    title: taskable.title,
    description: taskable.description,
    color: taskable.color,
    icon: taskable.icon,
    position: taskable.position,
    created_at: taskable.created_at,
    updated_at: taskable.updated_at,
  };
}

/**
 * Convert Course Module to Taskable
 */
export function courseModuleToTaskable(module: CourseModule): TaskableCourseModule {
  return {
    id: module.id,
    type: 'course_module',
    user_id: module.user_id,
    title: module.title,
    description: module.description,
    course_id: module.course_id,
    completed: module.completed,
    notes: module.notes,
    position: module.position,
    created_at: module.created_at,
    updated_at: module.updated_at,
  };
}

/**
 * Convert Taskable back to Course Module
 */
export function taskableToCourseModule(taskable: TaskableCourseModule): CourseModule {
  return {
    id: taskable.id,
    course_id: taskable.course_id,
    user_id: taskable.user_id,
    title: taskable.title,
    description: taskable.description,
    completed: taskable.completed,
    notes: taskable.notes,
    position: taskable.position,
    created_at: taskable.created_at,
    updated_at: taskable.updated_at,
  };
}

/**
 * Convert any original type to Taskable (type-safe)
 */
export function toTaskable(
  item: StandaloneTask | ClientTask | Habit | CourseModule
): Taskable {
  // Type guard by checking for unique fields
  if ('text' in item && 'completed' in item && !('client_id' in item) && !('course_id' in item)) {
    return standaloneTaskToTaskable(item as StandaloneTask);
  }
  if ('client_id' in item && 'status' in item) {
    return clientTaskToTaskable(item as ClientTask);
  }
  if ('course_id' in item && 'notes' in item) {
    return courseModuleToTaskable(item as CourseModule);
  }
  if ('color' in item && !('client_id' in item) && !('course_id' in item)) {
    return habitToTaskable(item as Habit);
  }
  
  throw new Error('Unknown taskable type');
}

/**
 * Get completion status for any taskable
 */
export function getTaskableCompletionStatus(taskable: Taskable): boolean {
  switch (taskable.type) {
    case 'standalone_task':
      return taskable.completed;
    case 'client_task':
      return taskable.status === 'completed';
    case 'habit':
      // Habits track completion separately via habit_completions table
      // This would need to be passed in or fetched separately
      return false; // Placeholder - actual completion is date-based
    case 'course_module':
      return taskable.completed;
  }
}

/**
 * Get display title for any taskable
 */
export function getTaskableTitle(taskable: Taskable): string {
  return taskable.title;
}

/**
 * Get display description for any taskable
 */
export function getTaskableDescription(taskable: Taskable): string | undefined {
  return taskable.description;
}
