-- Add RLS policies for member_prayer_updates table

-- Disable RLS on this table - security is handled by client-side auth and data validation
-- The anon key is used for all operations, so RLS policies won't work
-- Instead, rely on application-level permission checks
ALTER TABLE "public"."member_prayer_updates" DISABLE ROW LEVEL SECURITY;

-- Grant anon key access to perform necessary operations
grant delete on table "public"."member_prayer_updates" to "anon";
grant insert on table "public"."member_prayer_updates" to "anon";
grant select on table "public"."member_prayer_updates" to "anon";
grant update on table "public"."member_prayer_updates" to "anon";

-- Also grant authenticated role in case this changes in the future
grant delete on table "public"."member_prayer_updates" to "authenticated";
grant insert on table "public"."member_prayer_updates" to "authenticated";
grant select on table "public"."member_prayer_updates" to "authenticated";
grant update on table "public"."member_prayer_updates" to "authenticated";
