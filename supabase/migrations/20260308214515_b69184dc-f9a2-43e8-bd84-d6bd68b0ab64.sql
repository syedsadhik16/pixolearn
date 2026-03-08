
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_expires_at timestamp with time zone DEFAULT NULL;
