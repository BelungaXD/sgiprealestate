#!/bin/bash
# Sync database from production server to local machine
# Usage: ./scripts/sync-database-from-prod.sh
#
# This script exports database from production and imports it locally
# so you can work with real estate property data locally.

set -e

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Production server configuration
SSH_HOST="${SSH_HOST:-sgipreal}"
PROD_USER="${PROD_USER:-belunga}"
PROD_BASE_PATH="${PROD_BASE_PATH:-~/sgiprealestate}"

# Database configuration
DB_NAME="${DB_NAME:-sgiprealestate}"
ADMIN_USER="${DB_SERVER_ADMIN_USER:-dbadmin}"

# Try to detect production user from common paths
if [ "$SSH_HOST" = "sgipreal" ]; then
    if ssh -o ConnectTimeout=2 "$SSH_HOST" "test -d ~/sgiprealestate" 2>/dev/null; then
        PROD_USER=$(ssh "$SSH_HOST" "whoami" 2>/dev/null || echo "belunga")
    elif ssh -o ConnectTimeout=2 "$SSH_HOST" "test -d /home/belunga/sgiprealestate" 2>/dev/null; then
        PROD_USER="belunga"
        PROD_BASE_PATH="/home/belunga/sgiprealestate"
    fi
fi

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Sync database from production to local                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Production server:${NC} $SSH_HOST"
echo -e "${BLUE}Production user:${NC} $PROD_USER"
echo -e "${BLUE}Database name:${NC} $DB_NAME"
echo ""

# Check if we can connect to production server
echo -e "${YELLOW}Checking connection to production server...${NC}"
if ! ssh -o ConnectTimeout=5 "$SSH_HOST" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${RED}❌ Error: Cannot connect to production server: $SSH_HOST${NC}"
    echo ""
    echo "Please ensure:"
    echo "  1. You have SSH access to the production server"
    echo "  2. SSH key is configured (or use: ssh $SSH_HOST)"
    echo "  3. Server hostname is correct (set SSH_HOST env var if different)"
    exit 1
fi
echo -e "${GREEN}✅ Connection successful${NC}"
echo ""

# Check if database server is running locally
echo -e "${YELLOW}Checking local database server...${NC}"
if ! docker ps --format "{{.Names}}" | grep -q "^db-server-postgres$" 2>/dev/null; then
    echo -e "${RED}❌ Error: Local database server is not running${NC}"
    echo ""
    echo "Please start the database server first:"
    echo "  cd ../database-server"
    echo "  docker compose up -d"
    echo ""
    echo "Or if using different setup, ensure PostgreSQL is running on localhost:5432"
    exit 1
fi
echo -e "${GREEN}✅ Local database server is running${NC}"
echo ""

# Create temporary directory for dump
TEMP_DIR=$(mktemp -d)
DUMP_FILE="$TEMP_DIR/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz"
trap "rm -rf $TEMP_DIR" EXIT

# Export database from production
echo -e "${BLUE}Exporting database from production...${NC}"
echo -e "${YELLOW}This may take a while depending on database size...${NC}"
echo ""

# Try to find database container on production
PROD_DB_CONTAINER=""
if ssh "$SSH_HOST" "docker ps --format '{{.Names}}' | grep -q 'db-server-postgres\|sgiprealestate.*postgres\|postgres'" 2>/dev/null; then
    # Find postgres container
    PROD_DB_CONTAINER=$(ssh "$SSH_HOST" "docker ps --format '{{.Names}}' | grep -E 'db-server-postgres|postgres' | head -1" 2>/dev/null || echo "")
fi

if [ -n "$PROD_DB_CONTAINER" ]; then
    echo -e "${BLUE}Found database container on production: $PROD_DB_CONTAINER${NC}"
    # Export from Docker container
    ssh "$SSH_HOST" "docker exec $PROD_DB_CONTAINER pg_dump -U $ADMIN_USER -F p $DB_NAME" | gzip > "$DUMP_FILE"
else
    # Try direct PostgreSQL connection (if accessible)
    echo -e "${YELLOW}Database container not found, trying direct connection...${NC}"
    # Get DATABASE_URL from production .env
    PROD_DB_URL=$(ssh "$SSH_HOST" "cd $PROD_BASE_PATH && grep DATABASE_URL .env 2>/dev/null | cut -d '=' -f2- | tr -d '\"'" 2>/dev/null || echo "")
    
    if [ -z "$PROD_DB_URL" ]; then
        echo -e "${RED}❌ Error: Cannot find DATABASE_URL on production server${NC}"
        echo ""
        echo "Please ensure:"
        echo "  1. Database is accessible on production server"
        echo "  2. DATABASE_URL is set in production .env file"
        exit 1
    fi
    
    # Parse DATABASE_URL to extract connection details
    # Format: postgresql://user:password@host:port/database
    # For now, try to export via SSH tunnel or direct connection
    echo -e "${YELLOW}Attempting to export via production database connection...${NC}"
    # This is a simplified approach - in practice, you might need to set up SSH tunnel
    ssh "$SSH_HOST" "cd $PROD_BASE_PATH && PGPASSWORD=\$(echo '$PROD_DB_URL' | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') pg_dump -h \$(echo '$PROD_DB_URL' | sed -n 's/.*@\([^:]*\):.*/\1/p') -p \$(echo '$PROD_DB_URL' | sed -n 's/.*:\([0-9]*\)\/.*/\1/p') -U \$(echo '$PROD_DB_URL' | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p') -d \$(echo '$PROD_DB_URL' | sed -n 's/.*\/\([^?]*\).*/\1/p')" 2>/dev/null | gzip > "$DUMP_FILE" || {
        echo -e "${RED}❌ Error: Failed to export database from production${NC}"
        echo ""
        echo "Please check:"
        echo "  1. Database server is accessible on production"
        echo "  2. Database name is correct: $DB_NAME"
        echo "  3. User has permissions to export database"
        exit 1
    }
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✅ Database exported successfully${NC}"
echo -e "${GREEN}   Dump file: $DUMP_FILE${NC}"
echo -e "${GREEN}   Size: $DUMP_SIZE${NC}"
echo ""

# Check if local database exists
echo -e "${YELLOW}Checking local database...${NC}"
if docker exec db-server-postgres psql -U "$ADMIN_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${YELLOW}⚠️  Local database '$DB_NAME' already exists${NC}"
    echo ""
    read -p "Do you want to overwrite it? This will DELETE all existing data! (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Cancelled. Database not imported.${NC}"
        exit 0
    fi
    
    echo -e "${YELLOW}Dropping existing database...${NC}"
    docker exec db-server-postgres psql -U "$ADMIN_USER" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" 2>/dev/null || true
    echo -e "${GREEN}✅ Existing database dropped${NC}"
else
    echo -e "${BLUE}Creating local database...${NC}"
    docker exec db-server-postgres psql -U "$ADMIN_USER" -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null
    echo -e "${GREEN}✅ Local database created${NC}"
fi
echo ""

# Import database to local
echo -e "${BLUE}Importing database to local server...${NC}"
echo -e "${YELLOW}This may take a while...${NC}"
echo ""

if gunzip -c "$DUMP_FILE" | docker exec -i db-server-postgres psql -U "$ADMIN_USER" "$DB_NAME" 2>/dev/null; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ Database sync completed successfully!             ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Database '$DB_NAME' is now available locally."
    echo ""
    echo "Next steps:"
    echo "  1. Update DATABASE_URL in .env file to point to local database"
    echo "  2. Restart your development server"
    echo "  3. Properties should now be visible on /properties page"
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║     ❌ Database import failed!                            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please check:"
    echo "  1. Local database server is running"
    echo "  2. Database dump file is valid"
    echo "  3. Sufficient disk space available"
    exit 1
fi
