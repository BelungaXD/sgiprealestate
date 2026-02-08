#!/bin/bash
# Quick setup script for local database synchronization
# Usage: ./scripts/setup-local-db.sh
#
# This script helps you set up local database and sync data from production

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Local Database Setup for Development                   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    exit 1
fi

# Load .env
set -a
source "$PROJECT_ROOT/.env"
set +a

# Check if DATABASE_URL exists, if not create from DB_* variables
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    echo -e "${YELLOW}⚠️  DATABASE_URL not found, creating from DB_* variables...${NC}"
    DB_PORT="${DB_PORT:-5432}"
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo "DATABASE_URL=$DATABASE_URL" >> "$PROJECT_ROOT/.env"
    echo -e "${GREEN}✅ DATABASE_URL added to .env${NC}"
    echo ""
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not configured${NC}"
    echo ""
    echo "Please add DATABASE_URL to .env file:"
    echo "  DATABASE_URL=postgresql://user:password@localhost:5432/database_name"
    exit 1
fi

echo -e "${BLUE}Current DATABASE_URL:${NC} $(echo $DATABASE_URL | sed 's/:[^:]*@/:***@/')"
echo ""

# Check if database server is accessible
echo -e "${YELLOW}Checking database connection...${NC}"

# Try to connect
if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "^db-server-postgres$"; then
    echo -e "${GREEN}✅ Local database server (Docker) is running${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Sync database from production:"
    echo "     ./scripts/sync-database-from-prod.sh"
    echo ""
    echo "  2. Or if you want to use production database directly (via SSH tunnel):"
    echo "     ssh -L 5432:localhost:5432 sgipreal"
    echo "     (then keep this terminal open and use production DB)"
    exit 0
elif command -v psql >/dev/null 2>&1; then
    # Try direct connection
    DB_HOST_FROM_URL=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT_FROM_URL=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p' || echo "5432")
    
    if nc -z "$DB_HOST_FROM_URL" "${DB_PORT_FROM_URL:-5432}" 2>/dev/null; then
        echo -e "${GREEN}✅ Database server is accessible at $DB_HOST_FROM_URL:$DB_PORT_FROM_URL${NC}"
        echo ""
        echo -e "${BLUE}Database is ready!${NC}"
        echo ""
        echo "To sync data from production, run:"
        echo "  ./scripts/sync-database-from-prod.sh"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Database server is not accessible${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Docker and psql not found${NC}"
fi

echo ""
echo -e "${BLUE}Options to set up local database:${NC}"
echo ""
echo -e "${YELLOW}Option 1: Start database-server (recommended)${NC}"
echo "  cd ../database-server"
echo "  docker compose up -d"
echo "  cd ../sgiprealestate.com"
echo "  ./scripts/sync-database-from-prod.sh"
echo ""
echo -e "${YELLOW}Option 2: Use production database via SSH tunnel${NC}"
echo "  ssh -L 5432:localhost:5432 sgipreal"
echo "  (keep terminal open, then restart dev server)"
echo ""
echo -e "${YELLOW}Option 3: Install PostgreSQL locally${NC}"
echo "  # macOS: brew install postgresql@15"
echo "  # Then create database and sync"
