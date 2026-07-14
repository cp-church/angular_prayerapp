ALTER TABLE public.email_subscribers
  ADD COLUMN IF NOT EXISTS memorization_strict_mode boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.email_subscribers.memorization_strict_mode IS
  'When true, memorization practice does not auto-reveal blanks after 3 wrong attempts.';
