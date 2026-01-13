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

Main deployment script that:
1. Runs database setup (`setup-database.sh`)
2. Deploys service using blue/green deployment
3. Configures nginx settings

**Usage:**
```bash
./scripts/deploy.sh
```

**Requirements:**
- `.env` file with DATABASE_URL
- nginx-microservice installed
- Docker and Docker Compose

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Application port
- `NEXT_PUBLIC_SITE_URL` - Public site URL

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
