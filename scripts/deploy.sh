#!/bin/bash

# ============================================================================
# Скрипт деплоя приложения sgipreal.com
# Вызывает deploy-smart.sh на прод сервере через nginx-microservice
# Запускается непосредственно на прод сервере
# ============================================================================

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
echo -e "${BLUE}║       SGIP Real Estate - Production Deployment             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Service name
SERVICE_NAME="sgiprealestate"

# Detect nginx-microservice path
# Try common production paths first, then fallback to relative path
NGINX_MICROSERVICE_PATH=""

# Check common production paths
if [ -d "/home/statex/nginx-microservice" ]; then
    NGINX_MICROSERVICE_PATH="/home/statex/nginx-microservice"
elif [ -d "/home/alfares/nginx-microservice" ]; then
    NGINX_MICROSERVICE_PATH="/home/alfares/nginx-microservice"
elif [ -d "$HOME/nginx-microservice" ]; then
    NGINX_MICROSERVICE_PATH="$HOME/nginx-microservice"
# Check if nginx-microservice is a sibling directory (for local dev)
elif [ -d "$(dirname "$PROJECT_ROOT")/nginx-microservice" ]; then
    NGINX_MICROSERVICE_PATH="$(dirname "$PROJECT_ROOT")/nginx-microservice"
# Check if nginx-microservice is in the same directory
elif [ -d "$PROJECT_ROOT/../nginx-microservice" ]; then
    NGINX_MICROSERVICE_PATH="$(cd "$PROJECT_ROOT/../nginx-microservice" && pwd)"
fi

# Validate nginx-microservice path
if [ -z "$NGINX_MICROSERVICE_PATH" ] || [ ! -d "$NGINX_MICROSERVICE_PATH" ]; then
    echo -e "${RED}❌ Error: nginx-microservice not found${NC}"
    echo ""
    echo "Please ensure nginx-microservice is installed in one of these locations:"
    echo "  - /home/statex/nginx-microservice"
    echo "  - /home/alfares/nginx-microservice"
    echo "  - $HOME/nginx-microservice"
    echo "  - $(dirname "$PROJECT_ROOT")/nginx-microservice (sibling directory)"
    echo ""
    echo "Or set NGINX_MICROSERVICE_PATH environment variable:"
    echo "  export NGINX_MICROSERVICE_PATH=/path/to/nginx-microservice"
    exit 1
fi

# Check if deploy-smart.sh exists
DEPLOY_SCRIPT="$NGINX_MICROSERVICE_PATH/scripts/blue-green/deploy-smart.sh"
if [ ! -f "$DEPLOY_SCRIPT" ]; then
    echo -e "${RED}❌ Error: deploy-smart.sh not found at $DEPLOY_SCRIPT${NC}"
    exit 1
fi

# Check if deploy-smart.sh is executable
if [ ! -x "$DEPLOY_SCRIPT" ]; then
    echo -e "${YELLOW}⚠️  Making deploy-smart.sh executable...${NC}"
    chmod +x "$DEPLOY_SCRIPT"
fi

echo -e "${GREEN}✅ Found nginx-microservice at: $NGINX_MICROSERVICE_PATH${NC}"
echo -e "${GREEN}✅ Deploying service: $SERVICE_NAME${NC}"
echo ""

# Database setup - check and create tables if needed
echo -e "${BLUE}ℹ️  Running database setup...${NC}"
DB_SETUP_SCRIPT="$PROJECT_ROOT/scripts/setup-database.sh"
if [ -f "$DB_SETUP_SCRIPT" ]; then
    if [ -x "$DB_SETUP_SCRIPT" ]; then
        if "$DB_SETUP_SCRIPT"; then
            echo -e "${GREEN}✅ Database setup completed${NC}"
            echo ""
        else
            echo -e "${RED}❌ Database setup failed. Deployment aborted.${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️  Making setup-database.sh executable...${NC}"
        chmod +x "$DB_SETUP_SCRIPT"
        if "$DB_SETUP_SCRIPT"; then
            echo -e "${GREEN}✅ Database setup completed${NC}"
            echo ""
        else
            echo -e "${RED}❌ Database setup failed. Deployment aborted.${NC}"
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Database setup script not found at $DB_SETUP_SCRIPT${NC}"
    echo -e "${YELLOW}⚠️  Proceeding with deployment without database setup check...${NC}"
    echo ""
fi

# Load nginx configuration from nginx.config.json (if exists)
NGINX_CONFIG_FILE="$PROJECT_ROOT/nginx.config.json"
CLIENT_MAX_BODY_SIZE="10G" # Default value

if [ -f "$NGINX_CONFIG_FILE" ]; then
    echo -e "${BLUE}ℹ️  Loading nginx configuration from nginx.config.json...${NC}"
    # Extract client_max_body_size from JSON (requires jq or use simple parsing)
    if command -v jq >/dev/null 2>&1; then
        CLIENT_MAX_BODY_SIZE=$(jq -r '.nginx.client_max_body_size // "10G"' "$NGINX_CONFIG_FILE" 2>/dev/null || echo "10G")
    else
        # Simple parsing without jq
        CLIENT_MAX_BODY_SIZE=$(grep -o '"client_max_body_size"[[:space:]]*:[[:space:]]*"[^"]*"' "$NGINX_CONFIG_FILE" 2>/dev/null | sed 's/.*"\([^"]*\)".*/\1/' || echo "10G")
    fi
    echo -e "${GREEN}✅ client_max_body_size set: $CLIENT_MAX_BODY_SIZE${NC}"
else
    echo -e "${YELLOW}⚠️  nginx.config.json not found, using default: $CLIENT_MAX_BODY_SIZE${NC}"
fi

# Change to nginx-microservice directory and run deployment
echo -e "${YELLOW}Starting blue/green deployment...${NC}"
echo ""

cd "$NGINX_MICROSERVICE_PATH"

# Execute the deployment script
if "$DEPLOY_SCRIPT" "$SERVICE_NAME"; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║     ✅ Deployment completed successfully!                 ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Apply nginx configuration (client_max_body_size)
    if [ -f "$NGINX_CONFIG_FILE" ]; then
        echo -e "${BLUE}ℹ️  Applying nginx configuration (client_max_body_size: $CLIENT_MAX_BODY_SIZE)...${NC}"
        NGINX_CONF_DIR="$NGINX_MICROSERVICE_PATH/nginx/conf.d/blue-green"
        
        # Update configuration files for blue and green
        for conf_file in "$NGINX_CONF_DIR"/*.conf; do
            if [ -f "$conf_file" ] && grep -q "sgiprealestate" "$conf_file" 2>/dev/null; then
                # Check if client_max_body_size already exists in server block
                if ! grep -q "client_max_body_size" "$conf_file" 2>/dev/null; then
                    # Add client_max_body_size in HTTPS server block after ssl_certificate_key
                    if grep -q "ssl_certificate_key" "$conf_file" 2>/dev/null; then
                        sed -i "/ssl_certificate_key/a\\    client_max_body_size $CLIENT_MAX_BODY_SIZE;" "$conf_file"
                        echo -e "${GREEN}✅ Added client_max_body_size to $(basename "$conf_file")${NC}"
                    fi
                else
                    # Update existing value
                    sed -i "s/client_max_body_size[[:space:]]*[^;]*;/client_max_body_size $CLIENT_MAX_BODY_SIZE;/" "$conf_file"
                    echo -e "${GREEN}✅ Updated client_max_body_size in $(basename "$conf_file")${NC}"
                fi
            fi
        done
        
        # Reload nginx to apply changes
        echo -e "${BLUE}ℹ️  Reloading nginx...${NC}"
        if docker exec nginx-microservice nginx -t >/dev/null 2>&1; then
            if docker exec nginx-microservice nginx -s reload >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
            else
                echo -e "${YELLOW}⚠️  Failed to reload nginx (container may not be running)${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Nginx configuration has errors, reload skipped${NC}"
        fi
    fi
    
    echo ""
    echo "The sgiprealestate application has been deployed using blue/green deployment."
    echo "Check the status with:"
    echo "  cd $NGINX_MICROSERVICE_PATH"
    echo "  ./scripts/status-all-services.sh"
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║     ❌ Deployment failed!                                  ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please check the error messages above and:"
    echo "  1. Verify nginx-microservice is properly configured"
    echo "  2. Check service registry file exists: $NGINX_MICROSERVICE_PATH/service-registry/$SERVICE_NAME.json"
    echo "  3. Review deployment logs"
    echo "  4. Check service health: cd $NGINX_MICROSERVICE_PATH && ./scripts/blue-green/health-check.sh $SERVICE_NAME"
    exit 1
fi
