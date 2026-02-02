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

## Alternative: Import from Server Path (No Browser Upload)

An API exists for importing from disk when files are already on the server: **`/api/properties/import-folder`**.

### Workflow

1. **Upload files to server once** (scp, rsync, SFTP):
   ```bash
   # Example: copy from your Mac to prod
   scp -r "/Users/you/Downloads/Telegram Lite/Creek Vistas Reserve" sgipreal:~/imports/
   ```

2. **Organise folder structure** on server. Two options:

   **Option A – single property folder** (path points to folder with files):
   ```bash
   scp -r "Creek Vistas Reserve" sgipreal:~/imports/
   ```
   Then use path: `/home/belunga/imports/Creek Vistas Reserve`

   **Option B – multiple properties** (path points to parent with subfolders):
   ```text
   ~/imports/
   ├── Downtown - Creek Vistas Reserve/
   │   ├── image1.jpg
   │   └── ...
   └── Beachfront - Another Property/
       └── ...
   ```
   Then use path: `/home/belunga/imports`

3. **Run import** in admin via "Import from server path" and enter the server path.

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
