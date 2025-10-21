// Achievement System TypeScript Types
// This file defines all the types needed for the achievement badge system

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'diamond' | 'rainbow';

export type AchievementCategory = 
  | 'getting_started'
  | 'tracking'
  | 'accounts'
  | 'savings'
  | 'lend_borrow'
  | 'purchases'
  | 'investments'
  | 'analytics'
  | 'donations'
  | 'consistency'
  | 'premium';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  requirements: AchievementRequirements;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AchievementRequirements {
  action: string;
  count?: number;
  amount?: number;
  streak?: number;
  currencies?: number;
  unique_types?: number;
  [key: string]: any; // Allow for flexible requirement structures
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress?: Record<string, any>;
  achievement?: Achievement; // Populated when joining with achievements table
}

export interface AchievementProgress {
  id: string;
  user_id: string;
  achievement_id: string;
  progress_data: Record<string, any>;
  last_updated: string;
  achievement?: Achievement; // Populated when joining with achievements table
}

export interface UserAchievementSummary {
  user_id: string;
  total_achievements: number;
  bronze_badges: number;
  silver_badges: number;
  gold_badges: number;
  diamond_badges: number;
  rainbow_badges: number;
  total_points: number;
  last_achievement_earned: string;
}

// Achievement action types for tracking user actions
export type AchievementAction = 
  | 'create_account'
  | 'create_transaction'
  | 'create_category'
  | 'create_savings_goal'
  | 'daily_tracking'
  | 'multi_currency'
  | 'savings_amount'
  | 'complete_goal'
  | 'create_lend_record'
  | 'create_borrow_record'
  | 'settle_loan'
  | 'create_purchase'
  | 'upload_attachment'
  | 'create_investment'
  | 'view_analytics'
  | 'create_donation'
  | 'donation_total'
  | 'daily_login'
  | 'use_premium_feature'
  | 'create_last_wish';

// Achievement check result
export interface AchievementCheckResult {
  earned: UserAchievement[];
  progress: AchievementProgress[];
  notifications: AchievementNotification[];
}

export interface AchievementNotification {
  type: 'new_achievement' | 'progress_update';
  achievement: Achievement;
  message: string;
  progress?: number;
  total?: number;
}

// Badge display props
export interface BadgeProps {
  achievement: Achievement;
  earned?: boolean;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export interface BadgeCollectionProps {
  achievements: UserAchievement[];
  showProgress?: boolean;
  filterByCategory?: AchievementCategory;
  filterByRarity?: AchievementRarity;
}

export interface AchievementProgressBarProps {
  achievement: Achievement;
  progress: AchievementProgress;
  showDetails?: boolean;
}

// Achievement service interface
export interface AchievementService {
  checkAchievements(userId: string, action: AchievementAction, data?: any): Promise<AchievementCheckResult>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  getAchievementProgress(userId: string): Promise<AchievementProgress[]>;
  getAchievementSummary(userId: string): Promise<UserAchievementSummary | null>;
  markAsViewed(achievementId: string, userId: string): Promise<void>;
}

// Achievement store interface (for Zustand)
export interface AchievementStore {
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  achievementProgress: AchievementProgress[];
  summary: UserAchievementSummary | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAchievements: () => Promise<void>;
  fetchUserAchievements: (userId: string) => Promise<void>;
  fetchAchievementProgress: (userId: string) => Promise<void>;
  fetchAchievementSummary: (userId: string) => Promise<void>;
  checkAndAwardAchievements: (action: AchievementAction, data?: any) => Promise<void>;
  markAchievementAsViewed: (achievementId: string) => Promise<void>;
  
  // UI state
  showAchievementNotification: boolean;
  currentNotification: AchievementNotification | null;
  setShowAchievementNotification: (show: boolean) => void;
}
