-- Allow all supported Bible translations on admin-curated Memorize recommendations
-- (matches scripture edge function and memorized_items translation codes).

ALTER TABLE public.memorization_recommendations
  DROP CONSTRAINT IF EXISTS memorization_recommendations_translation_check;

ALTER TABLE public.memorization_recommendations
  ADD CONSTRAINT memorization_recommendations_translation_check
  CHECK (translation IN ('esv', 'kjv', 'nasb', 'lsb', 'niv', 'nlt', 'csb'));

COMMENT ON TABLE public.memorization_recommendations IS
  'Admin-curated verse references per translation shown as recommendations on the Memorize tab';
