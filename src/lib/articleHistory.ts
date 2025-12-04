import { supabase } from './supabase';

export interface ArticleReadingHistory {
  id: string;
  article_slug: string;
  article_title: string;
  article_category: string | null;
  read_at: string;
  time_spent_seconds: number;
  feedback: boolean | null;
  feedback_given_at: string | null;
}

export interface ArticleFeedbackStats {
  article_slug: string;
  article_title: string;
  article_category: string | null;
  total_reads: number;
  helpful_count: number;
  not_helpful_count: number;
  no_feedback_count: number;
  helpful_percentage: number;
}

export interface TrackArticleReadingParams {
  article_slug: string;
  article_title: string;
  article_category?: string;
  time_spent_seconds?: number;
}

export interface TrackArticleFeedbackParams {
  article_slug: string;
  article_title: string;
  article_category?: string;
  feedback: boolean; // true for helpful, false for needs improvement
}

/**
 * Track when a user reads an article
 */
export async function trackArticleReading(params: TrackArticleReadingParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {

      return;
    }

    const { error } = await supabase.rpc('track_article_reading', {
      p_user_id: user.id,
      p_article_slug: params.article_slug,
      p_article_title: params.article_title,
      p_article_category: params.article_category || null,
      p_time_spent_seconds: params.time_spent_seconds || 0
    });

    if (error) {

    }
  } catch (error) {

  }
}

/**
 * Track article reading for both authenticated and anonymous users
 * Falls back to client-side analytics for anonymous users
 */
export async function trackArticleReadingUniversal(params: TrackArticleReadingParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Track in database for authenticated users
      await trackArticleReading(params);
    } else {
      // Track in client-side analytics for anonymous users

      // You can integrate with Google Analytics, Mixpanel, or other analytics here
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'article_view', {
          article_slug: params.article_slug,
          article_title: params.article_title,
          article_category: params.article_category,
          user_type: 'anonymous'
        });
      }
    }
  } catch (error) {

  }
}

/**
 * Get user's reading history
 */
export async function getUserReadingHistory(limit: number = 10): Promise<ArticleReadingHistory[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {

      return [];
    }

    const { data, error } = await supabase.rpc('get_user_reading_history', {
      p_user_id: user.id,
      p_limit: limit
    });

    if (error) {

      return [];
    }

    return data || [];
  } catch (error) {

    return [];
  }
}

/**
 * Track article feedback (helpful/not helpful)
 */
export async function trackArticleFeedback(params: TrackArticleFeedbackParams): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {

      return;
    }

    const { error } = await supabase.rpc('track_article_feedback', {
      p_user_id: user.id,
      p_article_slug: params.article_slug,
      p_article_title: params.article_title,
      p_feedback: params.feedback,
      p_article_category: params.article_category || null
    });

    if (error) {

    }
  } catch (error) {

  }
}

/**
 * Get article feedback statistics
 */
export async function getArticleFeedbackStats(): Promise<ArticleFeedbackStats[]> {
  try {
    const { data, error } = await supabase.rpc('get_article_feedback_stats');

    if (error) {

      return [];
    }

    return data || [];
  } catch (error) {

    return [];
  }
}

/**
 * Get user-specific article reading statistics
 */
export async function getUserArticleStats(): Promise<{
  totalReads: number;
  helpfulCount: number;
  notHelpfulCount: number;
  noFeedbackCount: number;
  helpfulRate: number;
  totalTimeSpent: number;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {

      return {
        totalReads: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        noFeedbackCount: 0,
        helpfulRate: 0,
        totalTimeSpent: 0
      };
    }

    const { data, error } = await supabase.rpc('get_user_article_stats', {
      p_user_id: user.id
    });

    if (error) {

      return {
        totalReads: 0,
        helpfulCount: 0,
        notHelpfulCount: 0,
        noFeedbackCount: 0,
        helpfulRate: 0,
        totalTimeSpent: 0
      };
    }

    // The function now returns a JSON object, so we need to extract the values
    if (data) {

      const stats = {
        totalReads: Number(data.total_reads) || 0,
        helpfulCount: Number(data.helpful_count) || 0,
        notHelpfulCount: Number(data.not_helpful_count) || 0,
        noFeedbackCount: Number(data.no_feedback_count) || 0,
        helpfulRate: Number(data.helpful_rate) || 0,
        totalTimeSpent: Number(data.total_time_spent) || 0
      };

      return stats;
    }

    return {
      totalReads: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      noFeedbackCount: 0,
      helpfulRate: 0,
      totalTimeSpent: 0
    };
  } catch (error) {

    return {
      totalReads: 0,
      helpfulCount: 0,
      notHelpfulCount: 0,
      noFeedbackCount: 0,
      helpfulRate: 0,
      totalTimeSpent: 0
    };
  }
}

/**
 * Track time spent on article (call this when user leaves the page)
 */
export async function trackArticleTimeSpent(
  article_slug: string, 
  article_title: string, 
  article_category: string | undefined,
  timeSpentSeconds: number
): Promise<void> {
  await trackArticleReading({
    article_slug,
    article_title,
    article_category,
    time_spent_seconds: timeSpentSeconds
  });
}

