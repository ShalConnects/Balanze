/**
 * Utility functions for organizing tasks with subtasks
 */

import type { Task } from '../types/index';

/**
 * Organize flat list of tasks into hierarchical structure with subtasks
 * Enforces 2-level nesting: parent → subtask (no subtasks of subtasks)
 */
export function organizeTasksWithSubtasks(tasks: Task[]): Task[] {
  // Separate parents and subtasks
  const parentTasks = tasks.filter(task => !task.parent_id);
  const subtasks = tasks.filter(task => task.parent_id);

  // Build a map of parent_id -> subtasks for quick lookup
  const subtasksByParent = new Map<string, Task[]>();
  subtasks.forEach(subtask => {
    if (subtask.parent_id) {
      const existing = subtasksByParent.get(subtask.parent_id) || [];
      existing.push(subtask);
      subtasksByParent.set(subtask.parent_id, existing);
    }
  });

  // Attach subtasks to their parents and calculate completion stats
  return parentTasks.map(parent => {
    const parentSubtasks = subtasksByParent.get(parent.id) || [];
    
    // Sort subtasks by position, then by created_at
    const sortedSubtasks = parentSubtasks.sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      if (posA !== posB) return posA - posB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const completedCount = sortedSubtasks.filter(st => st.completed).length;
    const totalCount = sortedSubtasks.length;
    
    return {
      ...parent,
      subtasks: sortedSubtasks,
      has_subtasks: totalCount > 0,
      completed_subtasks_count: completedCount,
      total_subtasks_count: totalCount,
    };
  });
}

/**
 * Get all subtasks for a given parent task ID
 */
export function getSubtasksForParent(tasks: Task[], parentId: string): Task[] {
  return tasks
    .filter(task => task.parent_id === parentId)
    .sort((a, b) => {
      const posA = a.position ?? 0;
      const posB = b.position ?? 0;
      if (posA !== posB) return posA - posB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
}

/**
 * Check if a task can have subtasks (enforces 2-level nesting)
 * Returns true if task is a parent (has no parent_id), false if it's already a subtask
 */
export function canHaveSubtasks(task: Task): boolean {
  return !task.parent_id;
}

/**
 * Check if all subtasks of a parent are completed
 */
export function areAllSubtasksCompleted(parent: Task): boolean {
  if (!parent.has_subtasks || !parent.subtasks) return false;
  return parent.completed_subtasks_count === parent.total_subtasks_count && parent.total_subtasks_count! > 0;
}

/**
 * Flatten hierarchical task structure back to flat list
 * Useful for operations that need flat list (e.g., saving to database)
 */
export function flattenTasksWithSubtasks(tasks: Task[]): Task[] {
  const result: Task[] = [];
  tasks.forEach(task => {
    result.push(task);
    if (task.subtasks && task.subtasks.length > 0) {
      result.push(...task.subtasks);
    }
  });
  return result;
}
