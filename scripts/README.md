# SGIP Real Estate - Scripts Documentation

## Database Setup Script

### `setup-database.sh`

Automatically checks database connectivity and creates tables if they don't exist. This script is called automatically during deployment.

**Features:**

- ✅ Checks database connection
- ✅ Verifies if tables exist
- ✅ Creates tables using Prisma if needed
- ✅ Works in Docker containers and on host
- ✅ Handles multiple deployment scenarios

**Usage:**

```bash
./scripts/setup-database.sh
```

**What it does:**

1. Loads DATABASE_URL from .env file
2. Tests database connectivity
3. Checks if `properties` table exists (main table)
4. If tables don't exist, runs `prisma db push` to create schema
5. Exits with success if database is ready

**Integration:**
This script is automatically called by `deploy.sh` before deployment starts.

### `check-database.ts`

TypeScript script that uses Prisma to check database connectivity and table existence. Used internally by `setup-database.sh`.

**Usage:**

```bash
DATABASE_URL="your-database-url" npx ts-node scripts/check-database.ts
```

## Deployment Script

### `deploy.sh`

Main deployment script (same pattern as notifications-microservice and other ecosystem services):

1. Runs database setup (`setup-database.sh`)
2. Calls nginx-microservice `deploy-smart.sh`, which:
   - Creates/updates service registry from docker-compose
   - Generates nginx configs from registry
   - Performs blue/green deployment

Nginx configs and service registry are generated automatically during deployment; do not create or edit them manually.

**Usage:**

```bash
./scripts/deploy.sh
```

**Requirements:**

- `.env` file with DATABASE_URL
- nginx-microservice installed (e.g. /home/belunga/nginx-microservice, /home/statex/nginx-microservice)
- Docker and Docker Compose

## Environment Variables

Required in `.env`:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port
- `NEXT_PUBLIC_SITE_URL` - Public site URL

### `verify-chunks.sh`

Checks that the site returns HTML for the document and (optionally) JavaScript for chunk URLs. Use after deploy when you see **SyntaxError: Unexpected token '<'** in the browser.

**Usage:**

```bash
BASE_URL=https://sgipreal.com ./scripts/verify-chunks.sh
# With a chunk path from the browser error:
BASE_URL=https://sgipreal.com ./scripts/verify-chunks.sh '/_next/static/chunks/index-50ffc71760e52fd5.js'
```

If chunk requests return HTML or 404: purge CDN cache (Cloudflare → Purge Everything) and ensure nginx proxies all traffic to the Next.js container.

### `sync-uploads-from-prod.sh`

Syncs the `public/uploads` folder from production server to local machine. This allows you to work with real estate property files (images, videos, documents) locally.

**Usage:**
```bash
./scripts/sync-uploads-from-prod.sh
```

**What it does:**
1. Connects to production server (default: `sgipreal`)
2. Finds the `public/uploads` folder on production
3. Uses rsync to sync files to local `public/uploads/` directory
4. Preserves file permissions and timestamps
5. Shows progress during sync

**Environment Variables (optional):**
```bash
export SSH_HOST=sgipreal          # Production server hostname
export PROD_USER=belunga          # Production server user
export PROD_BASE_PATH=~/sgiprealestate  # Production project path
```

**Requirements:**
- SSH access to production server
- SSH key configured (or password access)
- Sufficient disk space on local machine

**Note:** This script syncs files from production to local. It does not delete files locally that don't exist on production (for safety). If you need a full mirror, you can modify the rsync command to add `--delete` flag.

### `sync-database-from-prod.sh`

Syncs the database from production server to local machine. This exports the production database and imports it locally so you can work with real estate property data locally.

**Usage:**
```bash
./scripts/sync-database-from-prod.sh
```

**What it does:**
1. Connects to production server (default: `sgipreal`)
2. Exports database dump from production
3. Imports database dump to local database server
4. Creates local database if it doesn't exist
5. Overwrites existing local database (with confirmation)

**Prerequisites:**
- Local database server must be running (docker compose up -d in database-server)
- SSH access to production server
- Database name: `sgiprealestate` (default, can be overridden with DB_NAME env var)

**Environment Variables (optional):**
```bash
export SSH_HOST=sgipreal          # Production server hostname
export PROD_USER=belunga          # Production server user
export DB_NAME=sgiprealestate     # Database name
export DB_SERVER_ADMIN_USER=dbadmin  # Database admin user
```

**After sync:**
1. Update DATABASE_URL in .env file to point to local database:
   ```
   DATABASE_URL=postgresql://dbadmin:password@localhost:5432/sgiprealestate
   ```
2. Restart your development server
3. Properties should now be visible on /properties page

## Troubleshooting

### Database connection fails

- Check DATABASE_URL in .env file
- Verify database server is running
- Check network connectivity

### Tables not created

- Ensure Prisma Client is generated: `npm run db:generate`
- Check database user has CREATE TABLE permissions
- Verify Prisma schema is valid

### Script fails in Docker

- Ensure container has access to DATABASE_URL
- Check if Prisma Client is available in container
- Verify network connectivity between containers
