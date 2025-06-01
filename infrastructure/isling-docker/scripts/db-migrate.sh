#!/bin/bash

# Database Migration Script for API Service
# Usage: ./db-migrate.sh [command]
# Commands: push, deploy, reset, status

set -e

CONTAINER_NAME="api-service"
SERVICE_NAME="api-service"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if container is running
check_container() {
    if ! docker compose ps $SERVICE_NAME | grep -q "healthy"; then
        print_error "API service is not running. Please start it first:"
        echo "docker compose up $SERVICE_NAME -d"
        exit 1
    fi
}

# Wait for database to be ready
wait_for_db() {
    print_status "Waiting for database to be ready..."
    
    # Use simple method if DB_CHECK_SIMPLE is set
    if [ "${DB_CHECK_SIMPLE:-false}" = "true" ]; then
        wait_for_db_simple
        return
    fi
    
    # Try multiple approaches to check database connectivity
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Method 1: Try to connect using node.js (most reliable)
        if docker compose exec $SERVICE_NAME node -e "
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            prisma.\$queryRaw\`SELECT 1\`.then(() => {
                console.log('Database connected');
                process.exit(0);
            }).catch(() => {
                process.exit(1);
            });
        " > /dev/null 2>&1; then
            print_status "Database is ready! (Connected via Prisma client)"
            return 0
        fi
        
        # Method 2: Try using pg_isready if available
        if docker compose exec $SERVICE_NAME sh -c 'command -v pg_isready > /dev/null 2>&1' > /dev/null 2>&1; then
            if docker compose exec $SERVICE_NAME sh -c 'pg_isready -h ${DATABASE_HOST:-api-postgres} -p ${DATABASE_PORT:-5432}' > /dev/null 2>&1; then
                print_status "Database is ready! (Connected via pg_isready)"
                return 0
            fi
        fi
        
        # Method 3: Fallback to API health endpoint if it checks database
        if docker compose exec $SERVICE_NAME sh -c 'curl -f http://localhost:8000/health > /dev/null 2>&1' > /dev/null 2>&1; then
            print_status "Database is ready! (API health check passed)"
            return 0
        fi
        
        echo "Waiting for database connection... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Database connection timeout after $max_attempts attempts"
    print_error "Please check:"
    print_error "1. Database service is running: docker compose ps"
    print_error "2. Database environment variables are correct"
    print_error "3. Network connectivity between services"
    exit 1
}

# Simple database check (fallback method)
wait_for_db_simple() {
    print_status "Using simple database connectivity check..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        # Simple TCP connection test to database port
        if docker compose exec $SERVICE_NAME sh -c 'timeout 5 bash -c "</dev/tcp/${DATABASE_HOST:-api-postgres}/${DATABASE_PORT:-5432}"' > /dev/null 2>&1; then
            print_status "Database port is accessible!"
            sleep 3  # Give it a moment to be fully ready
            return 0
        fi
        
        echo "Waiting for database port... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Database port not accessible after $max_attempts attempts"
    exit 1
}

# Run Prisma DB push (for development/staging)
db_push() {
    print_status "Running Prisma DB push..."
    docker compose exec $SERVICE_NAME npx prisma db push --schema=./prisma/schema.prisma
    print_status "Database schema updated successfully!"
}

# Run Prisma migrate deploy (for production)
db_deploy() {
    print_status "Running Prisma migrate deploy..."
    docker compose exec $SERVICE_NAME npx prisma migrate deploy --schema=./prisma/schema.prisma
    print_status "Migrations deployed successfully!"
}

# Reset database (WARNING: This will delete all data)
db_reset() {
    print_warning "This will reset the database and DELETE ALL DATA!"
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ $REPLY == "yes" ]]; then
        print_status "Resetting database..."
        docker compose exec $SERVICE_NAME npx prisma migrate reset --force --schema=./prisma/schema.prisma
        print_status "Database reset completed!"
    else
        print_status "Database reset cancelled."
    fi
}

# Check migration status
db_status() {
    print_status "Checking migration status..."
    docker compose exec $SERVICE_NAME npx prisma migrate status --schema=./prisma/schema.prisma
}

# Generate Prisma client
db_generate() {
    print_status "Generating Prisma client..."
    docker compose exec $SERVICE_NAME npx prisma generate --schema=./prisma/schema.prisma
    print_status "Prisma client generated successfully!"
}

# Main command handler
case "${1:-}" in
    "push")
        check_container
        wait_for_db
        db_push
        ;;
    "deploy")
        check_container
        wait_for_db
        db_deploy
        ;;
    "reset")
        check_container
        wait_for_db
        db_reset
        ;;
    "status")
        check_container
        db_status
        ;;
    "generate")
        check_container
        db_generate
        ;;
    "")
        echo "Database Migration Script for API Service"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  push      - Push schema changes to database (development/staging)"
        echo "  deploy    - Deploy pending migrations (production)"
        echo "  reset     - Reset database (WARNING: deletes all data)"
        echo "  status    - Check migration status"
        echo "  generate  - Generate Prisma client"
        echo ""
        echo "Environment Variables:"
        echo "  DB_CHECK_SIMPLE=true  - Use simple TCP connection check instead of full database connectivity test"
        echo ""
        echo "Examples:"
        echo "  $0 push                    # For development/staging environments"
        echo "  $0 deploy                  # For production environments"
        echo "  $0 status                  # Check current migration status"
        echo "  DB_CHECK_SIMPLE=true $0 push  # Use simple connection check"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run '$0' without arguments to see usage."
        exit 1
        ;;
esac 