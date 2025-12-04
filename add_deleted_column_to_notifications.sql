-- Add deleted column to notifications table for soft deletes
ALTER TABLE public.notifications 
ADD COLUMN deleted boolean DEFAULT false;

-- Create index for faster queries on deleted status
CREATE INDEX notifications_deleted_idx ON public.notifications(deleted);

-- Update RLS policies to include deleted column
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id AND deleted = false);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id); 