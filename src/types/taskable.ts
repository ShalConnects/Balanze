/**
 * Unified Taskable Types
 * 
 * This file provides a unified interface for all task-like entities in the system:
 * - Standalone Tasks (from tasks table)
 * - Client Tasks (from client_tasks table)
 * - Habits (from habits table)
 * - Course Modules (from course_modules table)
 * 
 * This is an additive change - existing types remain unchanged.
 */

import type { Task as StandaloneTask } from './index';
import type { Task as ClientTask, TaskPriority, TaskStatus } from './client';
import type { Habit } from './habit';
import type { CourseModule } from './index';

/**
 * Type discriminator for different taskable types
 */
export type TaskableType = 'standalone_task' | 'client_task' | 'habit' | 'course_module';

/**
 * Base interface with common fields across all taskable types
 */
export interface BaseTaskable {
  id: string;
  type: TaskableType;
  user_id: string;
  title: string; // For habits and course modules, this is 'title'. For standalone tasks, this maps to 'text'
  description?: string;
  position?: number;
  created_at: string;
  updated_at?: string;
}

/**
 * Standalone Task (from tasks table)
 */
export interface TaskableStandaloneTask extends BaseTaskable {
  type: 'standalone_task';
  text: string; // Original field name
  completed: boolean;
  section_override?: 'today' | 'this_week' | 'this_month' | null;
  parent_id?: string | null;
  // Computed/derived fields (not in database, populated in UI)
  subtasks?: TaskableStandaloneTask[];
  has_subtasks?: boolean;
  completed_subtasks_count?: number;
  total_subtasks_count?: number;
  // title is derived from text for unified interface
}

/**
 * Client Task (from client_tasks table)
 */
export interface TaskableClientTask extends BaseTaskable {
  type: 'client_task';
  client_id: string;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  completed_date?: string;
  updated_at: string; // Required for client tasks
}

/**
 * Habit (from habits table)
 */
export interface TaskableHabit extends BaseTaskable {
  type: 'habit';
  color: 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';
  icon?: string;
  updated_at: string; // Required for habits
}

/**
 * Course Module (from course_modules table)
 */
export interface TaskableCourseModule extends BaseTaskable {
  type: 'course_module';
  course_id: string;
  completed: boolean;
  notes?: string;
  position: number; // Required for course modules
  updated_at: string; // Required for course modules
}

/**
 * Discriminated union of all taskable types
 */
export type Taskable = 
  | TaskableStandaloneTask 
  | TaskableClientTask 
  | TaskableHabit 
  | TaskableCourseModule;

/**
 * Input types for creating/updating taskables
 */
export interface BaseTaskableInput {
  title: string;
  description?: string;
  position?: number;
}

export interface TaskableStandaloneTaskInput extends BaseTaskableInput {
  type: 'standalone_task';
  text: string;
  completed?: boolean;
  section_override?: 'today' | 'this_week' | 'this_month' | null;
  parent_id?: string | null;
}

export interface TaskableClientTaskInput extends BaseTaskableInput {
  type: 'client_task';
  client_id: string;
  due_date?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface TaskableHabitInput extends BaseTaskableInput {
  type: 'habit';
  color?: 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';
  icon?: string;
}

export interface TaskableCourseModuleInput extends BaseTaskableInput {
  type: 'course_module';
  course_id: string;
  completed?: boolean;
  notes?: string;
}

export type TaskableInput = 
  | TaskableStandaloneTaskInput
  | TaskableClientTaskInput
  | TaskableHabitInput
  | TaskableCourseModuleInput;

/**
 * Completion status helper - different types track completion differently
 */
export type TaskableCompletionStatus = 
  | { type: 'standalone_task'; completed: boolean }
  | { type: 'client_task'; status: TaskStatus; completed_date?: string }
  | { type: 'habit'; completed: boolean; completionDate?: string } // Habits track daily completions separately
  | { type: 'course_module'; completed: boolean };

/**
 * Helper type guard functions
 */
export function isStandaloneTask(taskable: Taskable): taskable is TaskableStandaloneTask {
  return taskable.type === 'standalone_task';
}

export function isClientTask(taskable: Taskable): taskable is TaskableClientTask {
  return taskable.type === 'client_task';
}

export function isHabit(taskable: Taskable): taskable is TaskableHabit {
  return taskable.type === 'habit';
}

export function isCourseModule(taskable: Taskable): taskable is TaskableCourseModule {
  return taskable.type === 'course_module';
}
