# Database Migrations in Production

## Overview

This guide explains how to handle Prisma database migrations in containerized production environments.

## The Problem

The original Docker production container didn't include Prisma schema files, causing this error:

```bash
Error: Could not find Prisma Schema that is required for this command.
```

## Solutions Implemented

### 1. Updated Dockerfile

The `Dockerfile` now includes the Prisma schema files in the production container:

```dockerfile
# Copy Prisma schema and migrations for production database operations
COPY --from=builder --chown=node:node /home/node/prisma/ ./prisma/
```

### 2. Database Migration Script

Use the `./scripts/db-migrate.sh` script for all database operations:

```bash
# Check available commands
./scripts/db-migrate.sh

# Push schema changes (development/staging)
./scripts/db-migrate.sh push

# Deploy migrations (production)
./scripts/db-migrate.sh deploy

# Check migration status
./scripts/db-migrate.sh status

# Generate Prisma client
./scripts/db-migrate.sh generate
```

## Migration Commands

### Development/Staging Environments

For development and staging where you want to sync schema changes directly:

```bash
# Using the migration script
./scripts/db-migrate.sh push

# Using simple connection check (faster, less reliable)
DB_CHECK_SIMPLE=true ./scripts/db-migrate.sh push

# Direct command
docker compose exec api-service npx prisma db push --schema=./prisma/schema.prisma
```

### Production Environments

For production, use proper migrations:

```bash
# Deploy pending migrations
./scripts/db-migrate.sh deploy

# Using simple connection check
DB_CHECK_SIMPLE=true ./scripts/db-migrate.sh deploy

# Direct command
docker compose exec api-service npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## Database Connection Checking

The script uses multiple methods to verify database connectivity:

### Standard Method (Default)

1. **Prisma Client Test**: Executes `SELECT 1` using Prisma client (most reliable)
2. **pg_isready**: Uses PostgreSQL's built-in readiness check (if available)
3. **API Health Check**: Tests API health endpoint that may include database checks

### Simple Method (`DB_CHECK_SIMPLE=true`)

- **TCP Connection Test**: Simple port connectivity check
- Faster but less reliable
- Use when standard method has issues

```bash
# Use simple method
DB_CHECK_SIMPLE=true ./scripts/db-migrate.sh push
```

## Migration Workflow

### 1. Development

1. Make schema changes in `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev`
3. Test locally

### 2. Staging

1. Deploy updated container
2. Run: `./scripts/db-migrate.sh push` or `./scripts/db-migrate.sh deploy`
3. Test application

### 3. Production

1. Deploy updated container
2. Run: `./scripts/db-migrate.sh deploy`
3. Verify with: `./scripts/db-migrate.sh status`

## Best Practices

### Before Migration

1. **Backup your database**
2. Check migration status: `./scripts/db-migrate.sh status`
3. Review pending migrations
4. Test migrations in staging first

### During Migration

1. Use `deploy` for production (not `push`)
2. Monitor application logs
3. Have rollback plan ready

### After Migration

1. Verify application functionality
2. Check database schema
3. Monitor performance metrics

## Troubleshooting

### Schema File Not Found

If you still get schema file errors:

1. Rebuild the Docker image: `docker compose build api-service`
2. Verify Prisma files exist: `docker compose exec api-service ls -la prisma/`

### Migration Conflicts

```bash
# Check status
./scripts/db-migrate.sh status

# Reset and regenerate (development only)
./scripts/db-migrate.sh reset
```

### Connection Issues

```bash
# Test database connection
docker compose exec api-service npx prisma db pull --schema=./prisma/schema.prisma
```

## Environment-Specific Commands

### Local Development

```bash
npx prisma migrate dev
npx prisma db push
npx prisma studio
```

### Docker Environment

```bash
./scripts/db-migrate.sh push    # Development/staging
./scripts/db-migrate.sh deploy  # Production
./scripts/db-migrate.sh status  # Check migrations
```

### CI/CD Pipeline

```bash
# In your deployment pipeline
docker compose exec api-service npx prisma migrate deploy --schema=./prisma/schema.prisma
```

## Migration Safety

### Development/Staging

- Use `db push` for rapid iteration
- Schema changes are applied directly
- Data loss is acceptable

### Production

- Always use `migrate deploy`
- Migrations are versioned and reversible
- Preserves data integrity
- Can be reviewed before deployment

## Emergency Procedures

### Rollback Migration

1. Deploy previous container version
2. Apply previous migration state
3. Verify application functionality

### Database Recovery

1. Stop application containers
2. Restore database from backup
3. Deploy correct container version
4. Run appropriate migrations

## Monitoring

Monitor these after migrations:

- Application startup logs
- Database connection status
- Migration execution time
- Application performance metrics
