#!/bin/bash
# Database Setup Script for SGIP Real Estate
# Checks database connectivity and creates tables if they don't exist
# This script is called during deployment to ensure database is ready

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

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Database Setup - SGIP Real Estate                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}❌ Error: .env file not found at $PROJECT_ROOT/.env${NC}"
    echo "Please create .env file with DATABASE_URL configuration"
    exit 1
fi

# Load environment variables
set -a
source "$PROJECT_ROOT/.env"
set +a

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Error: DATABASE_URL not found in .env file${NC}"
    exit 1
fi

echo -e "${BLUE}ℹ️  Checking database connectivity...${NC}"

# Function to check database connection using psql
check_database_connection() {
    # Extract connection details from DATABASE_URL
    # Format: postgresql://user:password@host:port/database
    local db_url="$DATABASE_URL"
    
    # Try to connect using docker exec if db-server-postgres container exists
    if docker ps --format '{{.Names}}' | grep -q "^db-server-postgres$"; then
        # Extract database name from URL
        local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        local db_user=$(echo "$db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        
        if [ -z "$db_name" ] || [ -z "$db_user" ]; then
            echo -e "${YELLOW}⚠️  Could not parse DATABASE_URL, trying alternative method...${NC}"
            return 1
        fi
        
        # Test connection
        if docker exec db-server-postgres psql -U "$db_user" -d "$db_name" -c "SELECT 1;" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # If container doesn't exist, try using prisma directly
        echo -e "${YELLOW}⚠️  db-server-postgres container not found, will use Prisma for connection test${NC}"
        return 2
    fi
}

# Function to check if tables exist using Prisma
check_tables_exist() {
    # Use Node.js script with Prisma for reliable checking
    local check_script="$PROJECT_ROOT/scripts/check-database.ts"
    
    if [ -f "$check_script" ]; then
        # Check if we're in a container or on host
        if [ -f "/.dockerenv" ] || [ -n "$DOCKER_CONTAINER" ]; then
            # Inside container, use ts-node directly
            if command -v ts-node >/dev/null 2>&1; then
                if DATABASE_URL="$DATABASE_URL" ts-node "$check_script" >/dev/null 2>&1; then
                    return 0
                else
                    return 1
                fi
            fi
        fi
        
        # On host, try using node or docker
        if [ -d "$PROJECT_ROOT/node_modules" ] && [ -f "$PROJECT_ROOT/node_modules/.bin/ts-node" ]; then
            # Use local node_modules
            if DATABASE_URL="$DATABASE_URL" "$PROJECT_ROOT/node_modules/.bin/ts-node" "$check_script" >/dev/null 2>&1; then
                return 0
            else
                return 1
            fi
        else
            # Try using docker container
            local container_name="sgiprealestate-service"
            if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
                if docker exec -e DATABASE_URL="$DATABASE_URL" "$container_name" npx ts-node /app/prisma/../scripts/check-database.ts >/dev/null 2>&1; then
                    return 0
                else
                    return 1
                fi
            fi
        fi
    fi
    
    # Fallback: Try using docker exec with psql
    if docker ps --format '{{.Names}}' | grep -q "^db-server-postgres$"; then
        local db_url="$DATABASE_URL"
        local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        local db_user=$(echo "$db_url" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
        
        if [ -n "$db_name" ] && [ -n "$db_user" ]; then
            local table_count=$(docker exec db-server-postgres psql -U "$db_user" -d "$db_name" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'properties';" 2>/dev/null | tr -d '[:space:]')
            
            if [ "$table_count" = "1" ]; then
                return 0
            fi
        fi
    fi
    
    return 1
}

# Function to create tables using Prisma
create_tables() {
    echo -e "${YELLOW}⚠️  Tables not found. Creating database schema...${NC}"
    echo ""
    
    # Check if we're in a Docker container or on host
    if [ -f "/.dockerenv" ] || [ -n "$DOCKER_CONTAINER" ]; then
        # We're inside a container, use npx directly
        echo -e "${BLUE}ℹ️  Running Prisma DB Push from container...${NC}"
        if npx prisma db push --accept-data-loss --skip-generate; then
            echo -e "${GREEN}✅ Database schema created successfully${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to create database schema${NC}"
            return 1
        fi
    else
        # We're on the host, need to run in a container or use node directly
        # Check if node_modules exists
        if [ -d "$PROJECT_ROOT/node_modules" ] && [ -f "$PROJECT_ROOT/node_modules/.bin/prisma" ]; then
            echo -e "${BLUE}ℹ️  Running Prisma DB Push from host...${NC}"
            cd "$PROJECT_ROOT"
            if npx prisma db push --accept-data-loss --skip-generate; then
                echo -e "${GREEN}✅ Database schema created successfully${NC}"
                return 0
            else
                echo -e "${RED}❌ Failed to create database schema${NC}"
                return 1
            fi
        else
            # Try using docker run with node image
            echo -e "${BLUE}ℹ️  Running Prisma DB Push using Docker...${NC}"
            
            # Check if we have a running container we can use
            local container_name="sgiprealestate-service"
            if docker ps --format '{{.Names}}' | grep -q "^${container_name}$"; then
                echo -e "${BLUE}ℹ️  Using existing container: ${container_name}${NC}"
                if docker exec -e DATABASE_URL="$DATABASE_URL" "$container_name" npx prisma db push --accept-data-loss --skip-generate; then
                    echo -e "${GREEN}✅ Database schema created successfully${NC}"
                    return 0
                else
                    echo -e "${RED}❌ Failed to create database schema${NC}"
                    return 1
                fi
            else
                # Use a temporary node container
                echo -e "${BLUE}ℹ️  Using temporary Node.js container...${NC}"
                if docker run --rm \
                    --network nginx-network \
                    -v "$PROJECT_ROOT:/app" \
                    -w /app \
                    -e DATABASE_URL="$DATABASE_URL" \
                    node:20-slim \
                    sh -c "apt-get update -qq && apt-get install -y -qq openssl >/dev/null 2>&1 && npm ci --silent && npx prisma db push --accept-data-loss --skip-generate"; then
                    echo -e "${GREEN}✅ Database schema created successfully${NC}"
                    return 0
                else
                    echo -e "${RED}❌ Failed to create database schema${NC}"
                    return 1
                fi
            fi
        fi
    fi
}

# Main execution
main() {
    # Step 1: Check database connection
    echo -e "${BLUE}Step 1: Checking database connection...${NC}"
    local connection_result
    check_database_connection
    connection_result=$?
    
    if [ $connection_result -eq 0 ]; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    elif [ $connection_result -eq 2 ]; then
        echo -e "${YELLOW}⚠️  Using Prisma for connection check (container method unavailable)${NC}"
    else
        echo -e "${RED}❌ Failed to connect to database${NC}"
        echo "Please check:"
        echo "  1. DATABASE_URL is correct in .env file"
        echo "  2. Database server is running"
        echo "  3. Network connectivity to database"
        exit 1
    fi
    
    echo ""
    
    # Step 2: Check if tables exist
    echo -e "${BLUE}Step 2: Checking if database tables exist...${NC}"
    local tables_result
    check_tables_exist
    tables_result=$?
    
    if [ $tables_result -eq 0 ]; then
        echo -e "${GREEN}✅ Database tables already exist${NC}"
        echo -e "${GREEN}✅ Database is ready. Proceeding with deployment...${NC}"
        echo ""
        return 0
    else
        echo -e "${YELLOW}⚠️  Database tables not found${NC}"
    fi
    
    echo ""
    
    # Step 3: Create tables if they don't exist
    if ! create_tables; then
        echo -e "${RED}❌ Database setup failed${NC}"
        echo "Please check:"
        echo "  1. DATABASE_URL is correct"
        echo "  2. Database user has CREATE TABLE permissions"
        echo "  3. Prisma schema is valid"
        exit 1
    fi
    
    echo ""
    echo -e "${GREEN}✅ Database setup completed successfully${NC}"
    echo ""
}

# Run main function
main
