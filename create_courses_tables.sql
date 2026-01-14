-- =====================================================
-- COURSES TABLE
-- =====================================================
-- This table stores learning courses for users

CREATE TABLE IF NOT EXISTS courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- COURSE_MODULES TABLE
-- =====================================================
-- This table stores modules for each course
-- Each module can be marked as complete/incomplete and have notes

CREATE TABLE IF NOT EXISTS course_modules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT false,
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_user_id ON course_modules(user_id);
CREATE INDEX IF NOT EXISTS idx_course_modules_completed ON course_modules(completed);
CREATE INDEX IF NOT EXISTS idx_course_modules_position ON course_modules(position);

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
DROP POLICY IF EXISTS "Users can view their own courses" ON courses;
CREATE POLICY "Users can view their own courses" ON courses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own courses" ON courses;
CREATE POLICY "Users can insert their own courses" ON courses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
CREATE POLICY "Users can update their own courses" ON courses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;
CREATE POLICY "Users can delete their own courses" ON courses
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for course_modules
DROP POLICY IF EXISTS "Users can view their own course modules" ON course_modules;
CREATE POLICY "Users can view their own course modules" ON course_modules
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own course modules" ON course_modules;
CREATE POLICY "Users can insert their own course modules" ON course_modules
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own course modules" ON course_modules;
CREATE POLICY "Users can update their own course modules" ON course_modules
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own course modules" ON course_modules;
CREATE POLICY "Users can delete their own course modules" ON course_modules
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp for courses
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp for course_modules
CREATE OR REPLACE FUNCTION update_course_modules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at_trigger ON courses;
CREATE TRIGGER update_courses_updated_at_trigger
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_courses_updated_at();

DROP TRIGGER IF EXISTS update_course_modules_updated_at_trigger ON course_modules;
CREATE TRIGGER update_course_modules_updated_at_trigger
    BEFORE UPDATE ON course_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_course_modules_updated_at();
