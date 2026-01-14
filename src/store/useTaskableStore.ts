/**
 * Unified Taskable Store
 * 
 * This store provides a unified interface for all task-like entities:
 * - Standalone Tasks (direct Supabase, no store)
 * - Client Tasks (via useClientStore)
 * - Habits (via useHabitStore)
 * - Course Modules (via useCourseStore)
 * 
 * This is an additive wrapper - existing stores remain unchanged.
 */

import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useClientStore } from './useClientStore';
import { useHabitStore } from './useHabitStore';
import { useCourseStore } from './useCourseStore';
import { showToast } from '../lib/toast';
import type {
  Taskable,
  TaskableType,
  TaskableInput,
  TaskableStandaloneTaskInput,
  TaskableClientTaskInput,
  TaskableHabitInput,
  TaskableCourseModuleInput,
} from '../types/taskable';
import {
  standaloneTaskToTaskable,
  clientTaskToTaskable,
  habitToTaskable,
  courseModuleToTaskable,
  taskableToStandaloneTask,
  taskableToClientTask,
  taskableToHabit,
  taskableToCourseModule,
  toTaskable,
} from '../utils/taskableUtils';
import type { Task as StandaloneTask } from '../types/index';
import type { TaskInput as ClientTaskInput } from '../types/client';
import type { HabitInput } from '../types/habit';
import type { CourseModuleInput } from '../types/index';

interface TaskableStore {
  // State
  loading: boolean;
  error: string | null;

  // Fetch all taskables (optionally filtered by type)
  fetchAllTaskables: (type?: TaskableType) => Promise<Taskable[]>;
  
  // Fetch by type
  fetchStandaloneTasks: () => Promise<Taskable[]>;
  fetchClientTasks: (clientId?: string) => Promise<Taskable[]>;
  fetchHabits: () => Promise<Taskable[]>;
  fetchCourseModules: (courseId?: string) => Promise<Taskable[]>;

  // CRUD operations
  addTaskable: (input: TaskableInput) => Promise<Taskable | null>;
  updateTaskable: (id: string, type: TaskableType, updates: Partial<TaskableInput>) => Promise<void>;
  deleteTaskable: (id: string, type: TaskableType) => Promise<void>;

  // Position management
  updateTaskablePositions: (
    updates: Array<{ id: string; position: number }>,
    type: TaskableType
  ) => Promise<void>;

  // Get single taskable
  getTaskable: (id: string, type: TaskableType) => Taskable | undefined;

  // Utility
  clearError: () => void;
}

export const useTaskableStore = create<TaskableStore>((set, get) => ({
  loading: false,
  error: null,

  fetchAllTaskables: async (type?: TaskableType) => {
    try {
      set({ loading: true, error: null });
      
      const allTaskables: Taskable[] = [];

      if (!type || type === 'standalone_task') {
        const standalone = await get().fetchStandaloneTasks();
        allTaskables.push(...standalone);
      }

      if (!type || type === 'client_task') {
        const clientTasks = await get().fetchClientTasks();
        allTaskables.push(...clientTasks);
      }

      if (!type || type === 'habit') {
        const habits = await get().fetchHabits();
        allTaskables.push(...habits);
      }

      if (!type || type === 'course_module') {
        const modules = await get().fetchCourseModules();
        allTaskables.push(...modules);
      }

      set({ loading: false });
      return allTaskables;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return [];
    }
  },

  fetchStandaloneTasks: async () => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return [];
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const taskables = (data || []).map(standaloneTaskToTaskable);
      set({ loading: false });
      return taskables;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to fetch tasks');
      return [];
    }
  },

  fetchClientTasks: async (clientId?: string) => {
    try {
      set({ loading: true, error: null });
      const clientStore = useClientStore.getState();
      await clientStore.fetchTasks(clientId);

      const tasks = clientId 
        ? clientStore.getTasksByClient(clientId)
        : clientStore.tasks;

      const taskables = tasks.map(clientTaskToTaskable);
      set({ loading: false });
      return taskables;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to fetch client tasks');
      return [];
    }
  },

  fetchHabits: async () => {
    try {
      set({ loading: true, error: null });
      const habitStore = useHabitStore.getState();
      await habitStore.fetchHabits();

      const taskables = habitStore.habits.map(habitToTaskable);
      set({ loading: false });
      return taskables;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to fetch habits');
      return [];
    }
  },

  fetchCourseModules: async (courseId?: string) => {
    try {
      set({ loading: true, error: null });
      const courseStore = useCourseStore.getState();
      
      if (courseId) {
        await courseStore.fetchModules(courseId);
      } else {
        // Fetch all courses and their modules
        await courseStore.fetchCourses();
        const courses = courseStore.courses;
        for (const course of courses) {
          await courseStore.fetchModules(course.id);
        }
      }

      const modules = courseId
        ? courseStore.modules.filter(m => m.course_id === courseId)
        : courseStore.modules;

      const taskables = modules.map(courseModuleToTaskable);
      set({ loading: false });
      return taskables;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to fetch course modules');
      return [];
    }
  },

  addTaskable: async (input: TaskableInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      let taskable: Taskable | null = null;

      switch (input.type) {
        case 'standalone_task': {
          const taskInput = input as TaskableStandaloneTaskInput;
          const { data, error } = await supabase
            .from('tasks')
            .insert({
              user_id: user.id,
              text: taskInput.text,
              completed: taskInput.completed || false,
              position: taskInput.position,
              section_override: taskInput.section_override,
            })
            .select()
            .single();

          if (error) throw error;
          taskable = standaloneTaskToTaskable(data);
          break;
        }

        case 'client_task': {
          const taskInput = input as TaskableClientTaskInput;
          const clientStore = useClientStore.getState();
          const clientTaskInput: ClientTaskInput = {
            client_id: taskInput.client_id,
            title: taskInput.title,
            description: taskInput.description,
            due_date: taskInput.due_date,
            priority: taskInput.priority,
            status: taskInput.status,
            position: taskInput.position,
          };
          const clientTask = await clientStore.addTask(clientTaskInput);
          if (clientTask) {
            taskable = clientTaskToTaskable(clientTask);
          }
          break;
        }

        case 'habit': {
          const habitInput = input as TaskableHabitInput;
          const habitStore = useHabitStore.getState();
          const habitInputData: HabitInput = {
            title: habitInput.title,
            description: habitInput.description,
            color: habitInput.color,
            icon: habitInput.icon,
            position: habitInput.position,
          };
          const habit = await habitStore.addHabit(habitInputData);
          if (habit) {
            taskable = habitToTaskable(habit);
          }
          break;
        }

        case 'course_module': {
          const moduleInput = input as TaskableCourseModuleInput;
          const courseStore = useCourseStore.getState();
          const moduleInputData: CourseModuleInput = {
            course_id: moduleInput.course_id,
            title: moduleInput.title,
            description: moduleInput.description,
            completed: moduleInput.completed || false,
            notes: moduleInput.notes,
            position: moduleInput.position,
          };
          const module = await courseStore.createModule(moduleInputData);
          if (module) {
            taskable = courseModuleToTaskable(module);
          }
          break;
        }
      }

      set({ loading: false });
      if (taskable) {
        showToast.success('Item created successfully');
      }
      return taskable;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to create item');
      return null;
    }
  },

  updateTaskable: async (id: string, type: TaskableType, updates: Partial<TaskableInput>) => {
    try {
      set({ loading: true, error: null });

      switch (type) {
        case 'standalone_task': {
          const updateData: Partial<StandaloneTask> = {};
          if (updates.title !== undefined) updateData.text = updates.title;
          if ('completed' in updates) updateData.completed = (updates as TaskableStandaloneTaskInput).completed;
          if ('section_override' in updates) updateData.section_override = (updates as TaskableStandaloneTaskInput).section_override;
          if (updates.position !== undefined) updateData.position = updates.position;

          const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id);

          if (error) throw error;
          break;
        }

        case 'client_task': {
          const clientStore = useClientStore.getState();
          const updateData: Partial<ClientTaskInput> = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.description !== undefined) updateData.description = updates.description;
          if ('due_date' in updates) updateData.due_date = (updates as TaskableClientTaskInput).due_date;
          if ('priority' in updates) updateData.priority = (updates as TaskableClientTaskInput).priority;
          if ('status' in updates) updateData.status = (updates as TaskableClientTaskInput).status;
          if (updates.position !== undefined) updateData.position = updates.position;

          await clientStore.updateTask(id, updateData);
          break;
        }

        case 'habit': {
          const habitStore = useHabitStore.getState();
          const updateData: Partial<HabitInput> = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.description !== undefined) updateData.description = updates.description;
          if ('color' in updates) updateData.color = (updates as TaskableHabitInput).color;
          if ('icon' in updates) updateData.icon = (updates as TaskableHabitInput).icon;
          if (updates.position !== undefined) updateData.position = updates.position;

          await habitStore.updateHabit(id, updateData);
          break;
        }

        case 'course_module': {
          const courseStore = useCourseStore.getState();
          const updateData: Partial<CourseModuleInput> = {};
          if (updates.title !== undefined) updateData.title = updates.title;
          if (updates.description !== undefined) updateData.description = updates.description;
          if ('completed' in updates) updateData.completed = (updates as TaskableCourseModuleInput).completed;
          if ('notes' in updates) updateData.notes = (updates as TaskableCourseModuleInput).notes;
          if (updates.position !== undefined) updateData.position = updates.position;

          await courseStore.updateModule(id, updateData);
          break;
        }
      }

      set({ loading: false });
      showToast.success('Item updated successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update item');
    }
  },

  deleteTaskable: async (id: string, type: TaskableType) => {
    try {
      set({ loading: true, error: null });

      switch (type) {
        case 'standalone_task': {
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);
          if (error) throw error;
          break;
        }

        case 'client_task': {
          const clientStore = useClientStore.getState();
          await clientStore.deleteTask(id);
          break;
        }

        case 'habit': {
          const habitStore = useHabitStore.getState();
          await habitStore.deleteHabit(id);
          break;
        }

        case 'course_module': {
          const courseStore = useCourseStore.getState();
          await courseStore.deleteModule(id);
          break;
        }
      }

      set({ loading: false });
      showToast.success('Item deleted successfully');
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to delete item');
    }
  },

  updateTaskablePositions: async (
    updates: Array<{ id: string; position: number }>,
    type: TaskableType
  ) => {
    try {
      set({ loading: true, error: null });

      switch (type) {
        case 'standalone_task': {
          // Update each task individually (tasks table doesn't have batch update in store)
          for (const update of updates) {
            const { error } = await supabase
              .from('tasks')
              .update({ position: update.position })
              .eq('id', update.id);
            if (error) throw error;
          }
          break;
        }

        case 'client_task': {
          const clientStore = useClientStore.getState();
          await clientStore.updateTaskPositions(updates);
          break;
        }

        case 'habit': {
          const habitStore = useHabitStore.getState();
          await habitStore.updateHabitPositions(updates);
          break;
        }

        case 'course_module': {
          // Course modules don't have batch position update, update individually
          const courseStore = useCourseStore.getState();
          for (const update of updates) {
            await courseStore.updateModule(update.id, { position: update.position });
          }
          break;
        }
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      showToast.error('Failed to update positions');
    }
  },

  getTaskable: (id: string, type: TaskableType) => {
    try {
      switch (type) {
        case 'standalone_task': {
          // Would need to fetch from Supabase or maintain local cache
          // For now, return undefined - this would need enhancement
          return undefined;
        }

        case 'client_task': {
          const clientStore = useClientStore.getState();
          const task = clientStore.getTask(id);
          return task ? clientTaskToTaskable(task) : undefined;
        }

        case 'habit': {
          const habitStore = useHabitStore.getState();
          const habit = habitStore.getHabit(id);
          return habit ? habitToTaskable(habit) : undefined;
        }

        case 'course_module': {
          const courseStore = useCourseStore.getState();
          const module = courseStore.modules.find(m => m.id === id);
          return module ? courseModuleToTaskable(module) : undefined;
        }
      }
    } catch (error: any) {
      return undefined;
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
