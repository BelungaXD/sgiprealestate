# Post-Deployment Verification Checklist

**Use this after running `./scripts/deploy.sh` to confirm migration/deployment success.**

---

## 1. Deployment script result

- [ ] **Script exited with 0** – If you saw `✅ Deployment completed successfully!`, continue below.
- [ ] **Script failed** – Note the last error; then:
  1. Check nginx-microservice path and `deploy-smart.sh` (see script error output).
  2. Check service registry: `ls $NGINX_MICROSERVICE_PATH/service-registry/sgiprealestate.json`.
  3. Run health check: `cd $NGINX_MICROSERVICE_PATH && ./scripts/blue-green/health-check.sh sgiprealestate`.
- [ ] **"Domain not found in registry for service: sgipreal.com" or "jq: parse error"** – In the app `.env` on the server, set **SERVICE_NAME=sgiprealestate** (not sgipreal.com). Deploy scripts source the app `.env` and use SERVICE_NAME; if it is the domain, the script fails.
- [ ] **HTTPS check warnings** – If you see "HTTPS check failed" (e.g. for logging.sgipreal.com) but internal health checks passed and phases completed, deployment is still successful. See [DEPLOY_HTTPS_CHECK_TROUBLESHOOTING.md](./DEPLOY_HTTPS_CHECK_TROUBLESHOOTING.md).

---

## 2. Service status (on server)

```bash
cd /home/statex/nginx-microservice   # or /home/alfares/nginx-microservice
./scripts/status-all-services.sh
```

- [ ] **sgiprealestate** appears and shows active stack (blue or green) and healthy.

---

## 3. Health check

```bash
cd $NGINX_MICROSERVICE_PATH
./scripts/blue-green/health-check.sh sgiprealestate
```

- [ ] **Health check passed** (HTTPS and container health).

---

## 4. Application URL

- [ ] Open **production URL** from `.env` (e.g. `NEXT_PUBLIC_SITE_URL` – e.g. `https://sgiprealestate.alfares.cz` or your domain).
- [ ] Homepage loads (no 502/503/504).
- [ ] Check one key route (e.g. Properties, Contact) and that assets load.
- [ ] **Google Maps on property page**: Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to `.env` on the server and redeploy. Without it, the map shows a "View on Google Maps" fallback. Enable [Maps Embed API](https://console.cloud.google.com/) and restrict the key to your domain.

### 4.1 Browser check (chunks and images)

If you see **SyntaxError: Unexpected token '<'** in the console or **images/thumbnails not loading** (placeholders or "Image unavailable"):

1. **Console**: Open DevTools → Console. If errors point to `/_next/static/chunks/*.js`, the server is returning HTML instead of JS (often 404 or SPA fallback).
2. **Network**: DevTools → Network. Reload; filter by "JS" or "Img". Check:
   - Requests to `/_next/static/chunks/*.js` → Status should be 200 and Type "script"; if 404 or Type "document", nginx or the app is mis-serving.
   - Requests to `/api/uploads/...` or `https://sgipreal.com/api/uploads/...` → Status 200 and Type "image"; if 404/document, uploads are not reaching the Next.js app.
3. **On the server** (after SSH):
   - Confirm nginx proxies everything to the frontend:  
     `grep -A5 "location /" $NGINX_MICROSERVICE_PATH/nginx/conf.d/blue-green/sgipreal.com.*.conf`  
     You should see `proxy_pass` to the sgiprealestate frontend container; no `try_files` or `root` that would serve HTML for `/_next/` or `/api/`.
   - Test from the server:  
     `curl -sI https://sgipreal.com/_next/static/chunks/webpack.js`  
     Expect `Content-Type: application/javascript` and 200; if you get 404 or `text/html`, fix nginx or the app so static and API routes are proxied to the Next.js container.
   - Optional: hit the uploads API:  
     `curl -sI "https://sgipreal.com/api/uploads/properties/images/1770236243007-MIRAGE_THE_OASIS_RENDER1.webp"`  
     Expect 200 and `Content-Type: image/webp` (or similar).
4. **If using Cloudflare (or other CDN)**: After deploy, if chunk errors persist, **purge the CDN cache** (Cloudflare Dashboard → Caching → **Purge Everything**). This is the most common fix: the CDN was serving cached 404 HTML for chunk URLs. After purge, HTML and `/_next/static/*` come from the same build.
5. **Verify from server**: `BASE_URL=https://sgipreal.com ./scripts/verify-chunks.sh` (optionally pass a chunk path from the browser error, e.g. `./scripts/verify-chunks.sh '/_next/static/chunks/index-50ffc71760e52fd5.js'`).

---

## 5. Database

- [ ] **DB setup ran during deploy** – `scripts/setup-database.sh` is called by `deploy.sh`; if it succeeded, DB and Prisma schema are in place.
- [ ] If you added **new Prisma migrations** after last deploy, run on server (from app directory):

  ```bash
  cd /path/to/sgiprealestate
  npm run db:migrate deploy   # or: npx prisma migrate deploy
  ```

- [ ] Optional: `docker exec db-server-postgres psql -U dbadmin -d sgiprealestate -c "SELECT 1;"` to confirm DB connectivity.

---

## 6. Logs (if something is wrong)

- [ ] **Container logs:**  
  `docker compose -f docker-compose.<blue|green>.yml logs sgiprealestate-<blue|green> --tail 100`
- [ ] **Nginx:**  
  `tail -50 /var/log/nginx/error.log` (path may vary by server).
- [ ] **Logging service:** If app sends logs to central logging, check there for errors.

---

## 7. Rollback (if needed)

- [ ] To switch back to the previous stack: use nginx-microservice blue/green switch script (see nginx-microservice docs) or re-run deploy after fixing; the previous container remains until next deploy.

---

## Quick command summary

| Step              | Command |
|-------------------|--------|
| Status            | `cd $NGINX_MICROSERVICE_PATH && ./scripts/status-all-services.sh` |
| Health            | `./scripts/blue-green/health-check.sh sgiprealestate` |
| DB test           | `docker exec db-server-postgres psql -U dbadmin -d sgiprealestate -c "SELECT 1;"` |
| App logs          | `docker compose -f docker-compose.green.yml logs frontend --tail 100` (or blue) |

---

**When all items above are checked and OK, migration/deployment can be considered successful.**
