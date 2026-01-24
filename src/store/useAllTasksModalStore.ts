import { create } from 'zustand';

interface AllTasksModalStore {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export const useAllTasksModalStore = create<AllTasksModalStore>((set) => ({
  isOpen: false,
  openModal: () => {
    set({ isOpen: true });
    // Sync to localStorage for backward compatibility with PomodoroTimerBar
    localStorage.setItem('showAllTasksModal', 'true');
    window.dispatchEvent(new CustomEvent('pomodoroModalStateChange'));
  },
  closeModal: () => {
    set({ isOpen: false });
    // Sync to localStorage for backward compatibility with PomodoroTimerBar
    localStorage.setItem('showAllTasksModal', 'false');
    window.dispatchEvent(new CustomEvent('pomodoroModalStateChange'));
  },
}));
