-- Migration: Reassign personal prayers to category-scoped display_order ranges
-- Categories (null first, then alphabetically): 0-999, 1000-1999, 2000-2999, etc.
-- Each user's prayers are organized separately within each category
-- Run this migration once to update all existing personal prayers

WITH category_mapping AS (
  -- Map each user's categories to their range index (null = 0, then alphabetically)
  SELECT DISTINCT
    user_email,
    category,
    ROW_NUMBER() OVER (PARTITION BY user_email ORDER BY CASE WHEN category IS NULL THEN 0 ELSE 1 END, category) - 1 AS category_index
  FROM "public"."personal_prayers"
),
prayer_rankings AS (
  -- Rank each prayer within its user+category group, ordered by current display_order DESC
  SELECT
    id,
    user_email,
    category,
    display_order as old_display_order,
    ROW_NUMBER() OVER (
      PARTITION BY user_email, category 
      ORDER BY CASE WHEN display_order IS NULL THEN -1 ELSE display_order END DESC
    ) - 1 AS rank_in_category
  FROM "public"."personal_prayers"
),
new_display_orders AS (
  -- Calculate new display_order: category_index * 1000 + rank_in_category
  SELECT
    pr.id,
    pr.user_email,
    pr.category,
    pr.old_display_order,
    CASE 
      WHEN pr.category IS NULL THEN pr.rank_in_category
      ELSE (cm.category_index * 1000) + pr.rank_in_category
    END AS new_display_order
  FROM prayer_rankings pr
  LEFT JOIN category_mapping cm 
    ON pr.user_email = cm.user_email 
    AND (pr.category IS NULL AND cm.category IS NULL OR pr.category = cm.category)
)
UPDATE "public"."personal_prayers"
SET display_order = ndo.new_display_order,
    updated_at = NOW()
FROM new_display_orders ndo
WHERE "public"."personal_prayers".id = ndo.id;
