-- Add category column to personal_prayers table
-- Categories are user-defined strings for organizing personal prayers
-- Column is nullable to allow existing personal prayers to have no category

ALTER TABLE personal_prayers 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Create index on category for filtering performance
CREATE INDEX IF NOT EXISTS idx_personal_prayers_category ON personal_prayers(category);

-- Create composite index on user_email and category for common filter query (user's prayers by category)
CREATE INDEX IF NOT EXISTS idx_personal_prayers_user_email_category ON personal_prayers(user_email, category);
