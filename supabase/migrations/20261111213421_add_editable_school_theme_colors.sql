ALTER TABLE public.school_settings
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '#0c1a30',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '#c5a059';
