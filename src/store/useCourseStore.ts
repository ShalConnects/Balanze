import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Course, CourseModule, CourseInput, CourseModuleInput } from '../types';
import { useAuthStore } from './authStore';
import { showToast } from '../lib/toast';

interface CourseStore {
  courses: Course[];
  modules: CourseModule[];
  loading: boolean;
  error: string | null;
  fetchCourses: () => Promise<void>;
  fetchModules: (courseId: string) => Promise<void>;
  createCourse: (course: CourseInput) => Promise<Course | null>;
  updateCourse: (id: string, updates: Partial<CourseInput>) => Promise<void>;
  deleteCourse: (id: string) => Promise<void>;
  createModule: (module: CourseModuleInput) => Promise<CourseModule | null>;
  updateModule: (id: string, updates: Partial<CourseModuleInput>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
  toggleModuleCompletion: (id: string, completed: boolean) => Promise<void>;
}

export const useCourseStore = create<CourseStore>((set, get) => ({
  courses: [],
  modules: [],
  loading: false,
  error: null,

  fetchCourses: async () => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ courses: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch courses', loading: false });
      showToast.error('Failed to fetch courses');
    }
  },

  fetchModules: async (courseId: string) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false });
        return;
      }

      const { data, error } = await supabase
        .from('course_modules')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ modules: data || [], loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch modules', loading: false });
      showToast.error('Failed to fetch modules');
    }
  },

  createCourse: async (courseInput: CourseInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      const { data, error } = await supabase
        .from('courses')
        .insert({
          user_id: user.id,
          name: courseInput.name,
          description: courseInput.description,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        courses: [data, ...state.courses],
        loading: false,
      }));

      showToast.success('Course created successfully');
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create course', loading: false });
      showToast.error('Failed to create course');
      return null;
    }
  },

  updateCourse: async (id: string, updates: Partial<CourseInput>) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        courses: state.courses.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
        loading: false,
      }));

      showToast.success('Course updated successfully');
    } catch (err: any) {
      set({ error: err.message || 'Failed to update course', loading: false });
      showToast.error('Failed to update course');
    }
  },

  deleteCourse: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        courses: state.courses.filter((c) => c.id !== id),
        modules: state.modules.filter((m) => m.course_id !== id),
        loading: false,
      }));

      showToast.success('Course deleted successfully');
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete course', loading: false });
      showToast.error('Failed to delete course');
    }
  },

  createModule: async (moduleInput: CourseModuleInput) => {
    try {
      set({ loading: true, error: null });
      const { user } = useAuthStore.getState();
      if (!user) {
        set({ loading: false, error: 'Not authenticated' });
        return null;
      }

      // Get max position for the course to add new module at the end
      const existingModules = get().modules.filter(
        (m) => m.course_id === moduleInput.course_id
      );
      const maxPosition =
        existingModules.length > 0
          ? Math.max(...existingModules.map((m) => m.position || 0))
          : 0;

      const { data, error } = await supabase
        .from('course_modules')
        .insert({
          course_id: moduleInput.course_id,
          user_id: user.id,
          title: moduleInput.title,
          description: moduleInput.description,
          completed: moduleInput.completed || false,
          notes: moduleInput.notes,
          position: moduleInput.position ?? maxPosition + 1,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        modules: [...state.modules, data],
        loading: false,
      }));

      showToast.success('Module created successfully');
      return data;
    } catch (err: any) {
      set({ error: err.message || 'Failed to create module', loading: false });
      showToast.error('Failed to create module');
      return null;
    }
  },

  updateModule: async (id: string, updates: Partial<CourseModuleInput>) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('course_modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        modules: state.modules.map((m) => (m.id === id ? data : m)),
        loading: false,
      }));

      showToast.success('Module updated successfully');
    } catch (err: any) {
      set({ error: err.message || 'Failed to update module', loading: false });
      showToast.error('Failed to update module');
    }
  },

  deleteModule: async (id: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('course_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        modules: state.modules.filter((m) => m.id !== id),
        loading: false,
      }));

      showToast.success('Module deleted successfully');
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete module', loading: false });
      showToast.error('Failed to delete module');
    }
  },

  toggleModuleCompletion: async (id: string, completed: boolean) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('course_modules')
        .update({ completed })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        modules: state.modules.map((m) => (m.id === id ? data : m)),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message || 'Failed to update module', loading: false });
      showToast.error('Failed to update module');
    }
  },
}));
