# Large File Upload Troubleshooting (413 Payload Too Large)

## Overview

When importing property folders larger than ~100MB via the admin panel, you may see:

> Import error: Размер загружаемых файлов превышает лимит сервера (413 Payload Too Large). Максимальный размер: 10GB. Попробуйте загрузить папки по отдельности.

## Root Causes

There are two potential limits in the request chain:

### 1. Nginx (origin server)

- **Default**: 100MB (`client_max_body_size 100M` in nginx-microservice)
- **Fix**: sgiprealestate's `nginx.config.json` sets `client_max_body_size: "10G"`
- During deploy, `deploy-smart.sh` reads this and applies it to the generated nginx config for sgipreal.com
- **Verify**: After deploy, check the generated config:
  `grep client_max_body_size ~/nginx-microservice/nginx/conf.d/blue-green/sgipreal.com.*.conf`

### 2. Cloudflare (if domain is proxied)

- **Free/Pro**: 100 MB max upload
- **Business**: 200 MB
- **Enterprise**: 500+ MB

If sgipreal.com uses Cloudflare proxy (orange cloud), requests >100MB are rejected by Cloudflare before reaching the origin.

**Options:**

1. **DNS-only (grey cloud)** for sgipreal.com: Bypasses Cloudflare for all traffic. Loses CDN/DDoS protection.
2. **Subdomain for uploads**: Create `upload.sgipreal.com` with DNS-only, point API uploads there. Requires app changes.
3. **Upgrade Cloudflare plan**: Business (200MB) or Enterprise (500MB+).
4. **Chunk uploads**: Split folders into batches under 100MB and import separately.

## Verification Steps

1. **Check nginx config on prod** (after deploy):

   ```bash
   ssh sgipreal
   grep -A1 "client_max_body_size" ~/nginx-microservice/nginx/conf.d/blue-green/sgipreal.com.*.conf
   ```

   Should show `client_max_body_size 10G;` for sgipreal.com.

2. **Check Cloudflare proxy status**: In Cloudflare Dashboard → DNS → sgipreal.com. Orange cloud = proxied (100MB limit). Grey cloud = DNS-only (no Cloudflare limit).

3. **Test with smaller folder**: Try a folder under 90MB to isolate whether the limit is nginx or Cloudflare.
