-- Add obituary notices to the existing Community module without changing existing rows.
ALTER TYPE "PostCategory" ADD VALUE IF NOT EXISTS 'OBITUARY';

DO $$
BEGIN
  CREATE TYPE "ObituaryType" AS ENUM ('DEATH_NOTICE', 'UTHAWNA', 'CHAUTHA', 'TRIBUTE', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CommunityPost"
  ADD COLUMN IF NOT EXISTS "obituaryType" "ObituaryType",
  ADD COLUMN IF NOT EXISTS "deceasedName" TEXT,
  ADD COLUMN IF NOT EXISTS "deathDate" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "eventTime" TEXT;
