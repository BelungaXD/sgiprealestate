# Nginx and API Routes (sgiprealestate)

## All API routes are managed by the application

This app is a **single Next.js application** (one container). There is no separate backend or API gateway. The Next.js server handles:

- **Pages and static assets**: `/_next/static/*`, `/images/*`, etc.
- **API routes**: `/api/uploads/*`, `/api/properties/*`, `/api/developers/*`, `/api/health`, and any other `/api/*` route defined in `src/pages/api/`.

So **all API routes are managed by our application** — no external backend.

## How nginx-microservice config is generated

- **Service registry** is created/updated by `deploy-smart.sh` (from nginx-microservice). It is stored in `nginx-microservice/service-registry/sgiprealestate.json`; do not create or edit it in this repo.
- **Nginx config** is generated from the registry. For a service with **only a frontend** (no `backend`, no `api-gateway`), the generator produces a single block:
  - `location /` → proxy to the frontend container (Next.js).

So every request (including `/_next/static/chunks/*.js`, `/api/uploads/*`, and all pages) goes to the same Next.js container. No `nginx-api-routes.conf` entries are required for that; listing routes is only needed when the service has a **backend** and you want specific paths to go to the **frontend** instead.

## nginx-api-routes.conf in this project

We have `nginx/nginx-api-routes.conf` with **comments only** (no route lines). That is intentional:

- With no routes listed, the registry is not given a `frontend_api_routes` array.
- The generated nginx config still has only `location /` → frontend, so all traffic reaches Next.js.

If we added a route like `/api/uploads`, the current nginx generator would create a location that forwards only that path (not subpaths like `/api/uploads/properties/images/xxx.webp`), unless the generator supported prefix matching for that route. So we do not list routes here and rely on the single `location /` for the frontend-only setup.

## How other services do it (e.g. statex)

Services that have **both** frontend and backend use `nginx-api-routes.conf` to list which `/api/*` paths must go to the **frontend** instead of the backend. Example: `statex/nginx/nginx-api-routes.conf` lists routes like `/api/users/collect-contact`, `/api/notifications/prototype-request`. Those get specific `location` blocks **before** the generic `location /api/` block, so nginx sends those requests to the frontend and the rest of `/api/*` to the backend.

For sgiprealestate there is no backend, so no such split is needed.

## If chunks or images return HTML (404 / SPA fallback)

If the browser receives HTML instead of JS or images (e.g. `SyntaxError: Unexpected token '<'`, or images not loading), usually:

1. **Nginx** is not proxying `/_next/*` or `/api/*` to the Next.js container (e.g. a generic `location /api/` or `try_files` is sending requests elsewhere or serving HTML).
2. Or the **registry** on the server has a backend/api-gateway for this service, so a generic `location /api/` was generated and points to a non-existent or wrong upstream.

Check on the server:

- Registry: `jq . nginx-microservice/service-registry/sgiprealestate.json` — should have only a `frontend` (or single) service, no `backend`/`api-gateway`.
- Generated config: `grep -A5 "location /" nginx-microservice/nginx/conf.d/blue-green/sgipreal.com.*.conf` — should show `proxy_pass` to the sgiprealestate frontend for `location /`; no `try_files` or `root` that could serve HTML for `/_next/` or `/api/`.

See [POST_DEPLOY_VERIFICATION.md](./POST_DEPLOY_VERIFICATION.md) §4.1 (Browser check) for curl checks and steps.
