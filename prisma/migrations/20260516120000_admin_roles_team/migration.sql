-- Admin roles, team management, lead/property assignment
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR');

ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "role" "AdminRole" NOT NULL DEFAULT 'SUPER_ADMIN';
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);
ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "assignedAdminId" TEXT;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "assignedAdminId" TEXT;

ALTER TABLE "properties"
  ADD CONSTRAINT "properties_assignedAdminId_fkey"
  FOREIGN KEY ("assignedAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "leads"
  ADD CONSTRAINT "leads_assignedAdminId_fkey"
  FOREIGN KEY ("assignedAdminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "properties_assignedAdminId_idx" ON "properties"("assignedAdminId");
CREATE INDEX IF NOT EXISTS "leads_assignedAdminId_idx" ON "leads"("assignedAdminId");

UPDATE "admins" SET "role" = 'SUPER_ADMIN' WHERE "role" IS NULL;
