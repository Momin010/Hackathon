-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT, -- null for global notifications
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    category TEXT NOT NULL DEFAULT 'general', -- 'general', 'event', 'order', 'system'
    read BOOLEAN DEFAULT FALSE,
    data JSONB, -- additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Create index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
