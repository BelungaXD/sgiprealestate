# Automatic Folder Import – How It Works

## Current Flow (Browser Upload)

1. **User** selects a folder (e.g. `Creek Vistas Reserve`) in admin.
2. **Client** (`FolderImport.tsx`) builds `FormData` with all files and `webkitRelativePath` and sends one POST to `/api/properties/import-folder-files`.
3. **Server** (`import-folder-files.ts`):
   - Parses multipart body with `formidable`
   - Groups files by property folder (see folder naming below)
   - For each group: saves files to `public/uploads/properties/{images|videos|files}/`, creates Property and related records in DB
4. **Result**: Upload and DB import happen in a single HTTP request.

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

3. **Run import** in admin via "Import from server path" and enter the container path (e.g. `/uploads` or `/uploads/PropertyName`). The host folder is `sgiprealestate/uploads/` on the server.

### Benefits

- No browser upload for large folders
- Upload once, import multiple times
- Avoids Cloudflare and browser upload limits

---

## Possible Future Improvements

1. **Two-phase import**
   - Phase 1: Upload files to a staging directory (chunked or per-file)
   - Phase 2: Import from staging into DB (triggered separately)

2. **Checksum-based deduplication**
   - Client sends filename + size (or hash)
   - Server returns which files are already present
   - Client skips those files when uploading

3. **Chunked upload**
   - Split large folders into smaller requests to avoid 413 and timeouts
