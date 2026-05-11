-- Localized listing copy (EN remains `title` / `description` / `meta*`; RU/AR optional columns).
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "titleRu" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "titleAr" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "descriptionRu" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "descriptionAr" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "metaTitleRu" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "metaTitleAr" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "metaDescriptionRu" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "metaDescriptionAr" TEXT;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "featuresRu" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "featuresAr" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "amenitiesRu" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "amenitiesAr" TEXT[] DEFAULT ARRAY[]::TEXT[];
