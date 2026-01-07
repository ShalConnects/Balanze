export type HabitColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange' | 'purple';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color: HabitColor;
  icon?: string;
  position?: number;
  created_at: string;
  updated_at: string;
}

export interface HabitInput {
  title: string;
  description?: string;
  color?: HabitColor;
  icon?: string;
  position?: number;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string; // ISO date string (YYYY-MM-DD)
  created_at: string;
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  weeklyCompletion: number; // percentage (0-100)
  totalCompletions: number;
}

export type AchievementType = 
  | 'first_completion'
  | 'streak_3'
  | 'streak_7'
  | 'streak_14'
  | 'streak_30'
  | 'streak_50'
  | 'streak_100'
  | 'perfect_week'
  | 'perfect_month'
  | 'completions_10'
  | 'completions_50'
  | 'completions_100'
  | 'completions_500'
  | 'level_5'
  | 'level_10'
  | 'level_25'
  | 'level_50';

export interface HabitAchievement {
  id: string;
  user_id: string;
  achievement_type: AchievementType;
  unlocked_at: string;
  claimed_at?: string;
}

export interface HabitGamification {
  points: number;
  level: number;
  totalCompletions: number;
  pointsForNextLevel: number;
  progressToNextLevel: number; // percentage (0-100)
}

