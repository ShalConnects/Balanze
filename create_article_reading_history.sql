-- =====================================================
-- ARTICLE READING HISTORY TABLE
-- =====================================================

-- Create table for tracking user article reading history
CREATE TABLE IF NOT EXISTS article_reading_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    article_slug TEXT NOT NULL,
    article_title TEXT NOT NULL,
    article_category TEXT,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent_seconds INTEGER DEFAULT 0,
    feedback BOOLEAN, -- true for helpful, false for needs improvement, null for no feedback
    feedback_given_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, article_slug) -- Ensure one record per user per article
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_article_reading_history_user_id ON article_reading_history(user_id);
CREATE INDEX IF NOT EXISTS idx_article_reading_history_article_slug ON article_reading_history(article_slug);
CREATE INDEX IF NOT EXISTS idx_article_reading_history_read_at ON article_reading_history(read_at);
CREATE INDEX IF NOT EXISTS idx_article_reading_history_feedback ON article_reading_history(feedback);

-- Enable Row Level Security
ALTER TABLE article_reading_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for article_reading_history
DROP POLICY IF EXISTS "Users can view their own reading history" ON article_reading_history;
CREATE POLICY "Users can view their own reading history" ON article_reading_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reading history" ON article_reading_history;
CREATE POLICY "Users can insert their own reading history" ON article_reading_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reading history" ON article_reading_history;
CREATE POLICY "Users can update their own reading history" ON article_reading_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to track article reading
CREATE OR REPLACE FUNCTION track_article_reading(
    p_user_id UUID,
    p_article_slug TEXT,
    p_article_title TEXT,
    p_article_category TEXT DEFAULT NULL,
    p_time_spent_seconds INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    -- Insert or update reading history
    INSERT INTO article_reading_history (
        user_id,
        article_slug,
        article_title,
        article_category,
        time_spent_seconds
    ) VALUES (
        p_user_id,
        p_article_slug,
        p_article_title,
        p_article_category,
        p_time_spent_seconds
    )
    ON CONFLICT (user_id, article_slug) 
    DO UPDATE SET
        read_at = NOW(),
        time_spent_seconds = article_reading_history.time_spent_seconds + p_time_spent_seconds,
        article_title = EXCLUDED.article_title,
        article_category = EXCLUDED.article_category
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track article feedback
CREATE OR REPLACE FUNCTION track_article_feedback(
    p_user_id UUID,
    p_article_slug TEXT,
    p_article_title TEXT,
    p_feedback BOOLEAN,
    p_article_category TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    history_id UUID;
BEGIN
    -- Insert or update reading history with feedback
    INSERT INTO article_reading_history (
        user_id,
        article_slug,
        article_title,
        article_category,
        feedback,
        feedback_given_at
    ) VALUES (
        p_user_id,
        p_article_slug,
        p_article_title,
        p_article_category,
        p_feedback,
        NOW()
    )
    ON CONFLICT (user_id, article_slug) 
    DO UPDATE SET
        feedback = EXCLUDED.feedback,
        feedback_given_at = EXCLUDED.feedback_given_at,
        article_title = EXCLUDED.article_title,
        article_category = EXCLUDED.article_category
    RETURNING id INTO history_id;
    
    RETURN history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's reading history
CREATE OR REPLACE FUNCTION get_user_reading_history(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    article_slug TEXT,
    article_title TEXT,
    article_category TEXT,
    read_at TIMESTAMP WITH TIME ZONE,
    time_spent_seconds INTEGER,
    feedback BOOLEAN,
    feedback_given_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        arh.id,
        arh.article_slug,
        arh.article_title,
        arh.article_category,
        arh.read_at,
        arh.time_spent_seconds,
        arh.feedback,
        arh.feedback_given_at
    FROM article_reading_history arh
    WHERE arh.user_id = p_user_id
    ORDER BY arh.read_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get article feedback statistics
CREATE OR REPLACE FUNCTION get_article_feedback_stats()
RETURNS TABLE (
    article_slug TEXT,
    article_title TEXT,
    article_category TEXT,
    total_reads INTEGER,
    helpful_count INTEGER,
    not_helpful_count INTEGER,
    no_feedback_count INTEGER,
    helpful_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        arh.article_slug,
        arh.article_title,
        arh.article_category,
        COUNT(*)::INTEGER as total_reads,
        COUNT(CASE WHEN arh.feedback = true THEN 1 END)::INTEGER as helpful_count,
        COUNT(CASE WHEN arh.feedback = false THEN 1 END)::INTEGER as not_helpful_count,
        COUNT(CASE WHEN arh.feedback IS NULL THEN 1 END)::INTEGER as no_feedback_count,
        CASE 
            WHEN COUNT(CASE WHEN arh.feedback IS NOT NULL THEN 1 END) > 0 
            THEN ROUND(
                (COUNT(CASE WHEN arh.feedback = true THEN 1 END)::NUMERIC / 
                 COUNT(CASE WHEN arh.feedback IS NOT NULL THEN 1 END)::NUMERIC) * 100, 
                2
            )
            ELSE 0 
        END as helpful_percentage
    FROM article_reading_history arh
    GROUP BY arh.article_slug, arh.article_title, arh.article_category
    ORDER BY total_reads DESC, helpful_percentage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user-specific article reading statistics
CREATE OR REPLACE FUNCTION get_user_article_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_reads', COUNT(*),
        'helpful_count', COUNT(*) FILTER (WHERE feedback = true),
        'not_helpful_count', COUNT(*) FILTER (WHERE feedback = false),
        'no_feedback_count', COUNT(*) FILTER (WHERE feedback IS NULL),
        'helpful_rate', CASE 
            WHEN COUNT(*) FILTER (WHERE feedback IS NOT NULL) > 0 THEN
                ROUND(
                    (COUNT(*) FILTER (WHERE feedback = true)::NUMERIC / 
                     COUNT(*) FILTER (WHERE feedback IS NOT NULL)::NUMERIC) * 100, 
                    1
                )
            ELSE 0
        END,
        'total_time_spent', COALESCE(SUM(time_spent_seconds), 0)
    ) INTO result
    FROM article_reading_history
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION track_article_reading TO authenticated;
GRANT EXECUTE ON FUNCTION track_article_feedback TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_reading_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_article_feedback_stats TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_article_stats TO authenticated;
