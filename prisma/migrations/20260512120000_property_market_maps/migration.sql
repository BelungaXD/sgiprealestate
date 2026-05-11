-- Align `properties` with Prisma schema: listing market, payment plan, occupancy, Google Maps link.
-- Fixes INSERT failures (e.g. P2022) when DB was created from older SQL without these columns.

DO $$ BEGIN
  CREATE TYPE "ListingMarket" AS ENUM ('PRIMARY', 'SECONDARY');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "OccupancyStatus" AS ENUM ('VACANT', 'TENANTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "listingMarket" "ListingMarket" NOT NULL DEFAULT 'PRIMARY';
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "paymentPlan" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "occupancyStatus" "OccupancyStatus";
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "googleMapsUrl" TEXT;
