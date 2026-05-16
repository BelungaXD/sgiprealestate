CREATE TABLE IF NOT EXISTS "media_folders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "viewRoles" "AdminRole"[] NOT NULL DEFAULT ARRAY['SUPER_ADMIN', 'MANAGER', 'CONTENT_EDITOR']::"AdminRole"[],
    "editRoles" "AdminRole"[] NOT NULL DEFAULT ARRAY['SUPER_ADMIN']::"AdminRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS "media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folderId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL DEFAULT 0,
    "mimeType" TEXT,
    "uploadedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "media_assets_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "media_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "media_assets_folderId_idx" ON "media_assets"("folderId");
