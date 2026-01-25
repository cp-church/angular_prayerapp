-- Create member_prayer_updates table for updates on Planning Center member cards
CREATE TABLE IF NOT EXISTS "public"."member_prayer_updates" (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  person_id text NOT NULL,
  member_name text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  author_email text,
  is_anonymous boolean DEFAULT false,
  approval_status text DEFAULT 'approved'::text CHECK (approval_status IN ('pending', 'approved', 'denied')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE "public"."member_prayer_updates" ENABLE ROW LEVEL SECURITY;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_member_prayer_updates_person_id ON "public"."member_prayer_updates"(person_id);
CREATE INDEX IF NOT EXISTS idx_member_prayer_updates_member_name ON "public"."member_prayer_updates"(member_name);
CREATE INDEX IF NOT EXISTS idx_member_prayer_updates_created_at ON "public"."member_prayer_updates"(created_at);

-- Add table comment
COMMENT ON TABLE "public"."member_prayer_updates" IS 'Stores updates/comments for Planning Center member prayer cards';
COMMENT ON COLUMN "public"."member_prayer_updates"."person_id" IS 'Unique Planning Center person ID - persists even if name changes';
COMMENT ON COLUMN "public"."member_prayer_updates"."member_name" IS 'The name of the Planning Center member this update is for (denormalized for display)';
COMMENT ON COLUMN "public"."member_prayer_updates"."approval_status" IS 'Approval status of the update (pending, approved, denied)';
