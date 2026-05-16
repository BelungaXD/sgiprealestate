ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "passwordSetAt" TIMESTAMP(3);
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "inviteTokenHash" TEXT;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "inviteExpiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "admins_inviteTokenHash_key" ON "admins"("inviteTokenHash");

UPDATE "admins" SET "passwordSetAt" = "createdAt" WHERE "passwordSetAt" IS NULL;
