# Automatic Folder Import – How It Works

## Current Flow (Browser Upload) – Two-Phase, Parallel Streaming

1. **User** selects a folder (e.g. `Creek Vistas Reserve`) in admin.
2. **Phase 1 – Upload (parallel)**: **Client** (`FolderImport.tsx`) generates an `uploadId` and uploads every file as a separate raw-body POST to `/api/properties/upload-folder-stream?uploadId=...&path=<relative>`. Up to 6 files are uploaded concurrently; per-file retries happen automatically. Client aggregates progress (loaded / total bytes, % and files done) across all parallel uploads.
3. **Server** (`upload-folder-stream.ts`): pipes each request body straight to `public/uploads/incoming/{uploadId}/<relative path>` — single write, no multipart, no temp file. Returns `folderPath` (absolute).
4. **Phase 2 – Import**: **Client** sends POST to `/api/properties/import-folder` with `{ folderPath }`.
5. **Server** (`import-folder.ts`): reads from that path, converts/copies to `public/uploads/properties/{images|videos|files}/`, creates Property and related records in DB.
6. **Result**: Upload saturates the uplink via concurrency; only after that does import run and create the property in the database.

**If import fails:** The uploaded data **remains** in `public/uploads/incoming/{uploadId}/`. Nothing is deleted when the import step fails (DB error, timeout, validation, etc.). You can re-import later via **"Import from server path"** using that path (e.g. `/app/public/uploads/incoming/1738827600000` in container, or the path shown in server logs).

### Limits and Errors

| Error | Likely cause |
|-------|--------------|
| 413 Payload Too Large | Cloudflare (100MB on Free/Pro) or Nginx limits |
| Body is disturbed or locked | Duplicate request or redirect during POST |
| 500 | Sharp module, DB, or timeout (5 min) |

See [LARGE_FILE_UPLOAD_TROUBLESHOOTING.md](./LARGE_FILE_UPLOAD_TROUBLESHOOTING.md) for 413.

### Folder Naming

- **Preferred**: `DISTRICT - Property Name` (e.g. `Downtown - Creek Vistas Reserve`)
- **Districts**: Beachfront, Downtown, Dubai Hills, Marina Shores, The Oasis
- **Fallback**: Any folder name (district defaults to Downtown)

### Supported Extensions

- Images: jpg, jpeg, png, webp, gif, bmp (converted to WebP)
- Videos: mp4, mov, avi, webm, mkv (16:9 preferred)
- Docs: pdf, doc, docx, xls, xlsx, txt

---

## File Locations on sgipreal (prod)

- **Host path**: `sgiprealestate/uploads/` (inside the app repo; e.g. `~/sgiprealestate/uploads/` or `/home/belunga/sgiprealestate/uploads/`). Property folders go here.

### One-time migration: move uploads into sgiprealestate

If `uploads` was previously at the parent level (same level as `sgiprealestate`), move it once on the server:

```bash
ssh sgipreal
cd ~/sgiprealestate
mv ../uploads ./uploads
# Ensure permissions: same owner as sgiprealestate (e.g. belunga)
chown -R $(whoami):$(whoami) ./uploads
```

Then redeploy so the new volume mount `./uploads:/uploads` is used.

- **In container** (after redeploy with volume): `/uploads/`
- **Persistent storage**: `public/uploads/` folder inside the repo – imported property images/videos/files stored here

## Alternative: Import from Server Path (No Browser Upload)

An API exists for importing from disk when files are already on the server: **`/api/properties/import-folder`**.

### Workflow

1. **Upload files to server once** (scp, rsync, SFTP):

   ```bash
   # Example: copy property folders to prod (uploads is inside sgiprealestate)
   scp -r "Creek Vistas Reserve" sgipreal:sgiprealestate/uploads/
   ```

2. **Organise folder structure** on server. Two options:

   **Option A – single property folder** (path points to folder with files):

   ```bash
   scp -r "Creek Vistas Reserve" sgipreal:sgiprealestate/uploads/
   ```

   Then use path: `/uploads/Creek Vistas Reserve`

   **Option B – multiple properties** (path points to parent with subfolders):

   ```text
   sgiprealestate/uploads/
   ├── Downtown - Creek Vistas Reserve/
   │   ├── image1.jpg
   │   └── ...
   └── Beachfront - Another Property/
       └── ...
   ```

   Then use path: `/uploads`

3. **Run import** in admin: use **Browse** to choose the property folder on the server (or enter the path manually). Then click Import. The host folder is `sgiprealestate/uploads/` on the server.

### Benefits

- No browser upload for large folders
- Upload once, import multiple times
- Avoids Cloudflare and browser upload limits

### API Summary

| Endpoint | Purpose |
|----------|---------|
| `GET /api/properties/browse-folders?path=` | List directories under allowed upload roots (e.g. `/uploads`, `public/uploads/incoming`) for the Browse picker. |
| `POST /api/properties/upload-folder-stream?uploadId=&path=` | Stream one file per request (raw body) to `public/uploads/incoming/{uploadId}/<path>`. Called in parallel by client. Returns `folderPath` for each file. |
| `POST /api/properties/import-folder` | Import from server path: read from `folderPath`, create property in DB. Optional `propertyId` in body: attach folder media to that existing property instead of creating a new one. |

---

## Possible Future Improvements

1. ~~**Two-phase import**~~ ✅ Implemented: upload-folder-stream then import-folder.
2. ~~**Parallel per-file streaming upload**~~ ✅ Implemented.

3. **Checksum-based deduplication**
   - Client sends filename + size (or hash)
   - Server returns which files are already present
   - Client skips those files when uploading

4. **Resumable per-file upload (tus/Range)**
   - Currently a failed file is retried from byte 0 (max 2 attempts). For very large individual files (multi-GB videos) Range-based resume would be better.
