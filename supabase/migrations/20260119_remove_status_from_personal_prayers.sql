-- Remove status column from personal_prayers table
-- Status is now replaced with category field, where "Answered" category indicates answered prayers
-- Note: This migration runs after 20260119_add_category_to_personal_prayers.sql which adds the category column
ALTER TABLE personal_prayers DROP COLUMN IF EXISTS status;
