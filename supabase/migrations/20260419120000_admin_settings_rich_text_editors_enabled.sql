-- User-facing prayer/update forms: TipTap rich text vs plain textarea (admin toggle)
ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS rich_text_editors_enabled boolean NOT NULL DEFAULT true;
