-- Area hierarchy (parent/child) + multi-image gallery + map embed URL
ALTER TABLE "areas" ADD COLUMN IF NOT EXISTS "parentId" TEXT;
ALTER TABLE "areas" ADD COLUMN IF NOT EXISTS "mapEmbed" TEXT;

CREATE INDEX IF NOT EXISTS "areas_parentId_idx" ON "areas"("parentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'areas_parentId_fkey'
  ) THEN
    ALTER TABLE "areas"
      ADD CONSTRAINT "areas_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "areas"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "area_images" (
  "id"        TEXT NOT NULL,
  "areaId"    TEXT NOT NULL,
  "url"       TEXT NOT NULL,
  "alt"       TEXT,
  "order"     INTEGER NOT NULL DEFAULT 0,
  "isMain"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "area_images_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "area_images_areaId_idx" ON "area_images"("areaId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'area_images_areaId_fkey'
  ) THEN
    ALTER TABLE "area_images"
      ADD CONSTRAINT "area_images_areaId_fkey"
      FOREIGN KEY ("areaId") REFERENCES "areas"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$$;
