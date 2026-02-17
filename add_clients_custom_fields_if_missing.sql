-- Ensure clients.custom_fields exists (for ChatGPT thread URL per client and other custom data).
-- Run this in Supabase SQL Editor if the ChatGPT thread link does not persist after "Save link".

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE public.clients ADD COLUMN custom_fields JSONB DEFAULT '{}';
    RAISE NOTICE 'Added custom_fields column to clients';
  ELSE
    RAISE NOTICE 'clients.custom_fields already exists';
  END IF;
END $$;
