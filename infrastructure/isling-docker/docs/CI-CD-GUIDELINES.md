# CI/CD Guidelines for Isling API Deployment

This guide covers automated deployment strategies for the Isling API service including database migrations using Prisma for both Phase 1 (containerized databases) and Phase 2 (Cloud SQL).

## 🏗️ **Architecture Overview**

```
GitHub/GitLab → CI/CD Pipeline → GCP Artifact Registry → VM Deployment
                    ↓
            Database Migration (Prisma)
                    ↓
            Health Check & Rollback
```

## 📋 **Deployment Phases**

### **Phase 1: Development (Containerized Databases)**

- Docker Compose with PostgreSQL containers
- Direct Prisma migrations to containerized DB
- Single VM deployment

### **Phase 2: Production (Cloud SQL)**

- Cloud SQL PostgreSQL instances
- Prisma migrations to managed database
- Enhanced monitoring and rollback capabilities

## 🚀 **CI/CD Pipeline Setup**

### **GitHub Actions Example**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Isling API

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: isling-dev-api-service
  REGION: asia-northeast1
  ZONE: asia-northeast1-a
  VM_NAME: dev01-tky-a-api-service
  REGISTRY: asia-northeast1-docker.pkg.dev/isling-dev-api-service/dev01-tky-main-api-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run linting
        run: npm run lint

      - name: Type checking
        run: npm run type-check

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Setup Google Cloud CLI
        uses: google-github-actions/setup-gcloud@v1
        with:
          service_account_key: ${{ secrets.GCP_SA_KEY }}
          project_id: ${{ env.PROJECT_ID }}

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build Docker image
        run: |
          docker build -t ${{ env.REGISTRY }}/api-service-api:${{ github.sha }} .
          docker tag ${{ env.REGISTRY }}/api-service-api:${{ github.sha }} ${{ env.REGISTRY }}/api-service-api:latest

      - name: Push Docker image
        run: |
          docker push ${{ env.REGISTRY }}/api-service-api:${{ github.sha }}
          docker push ${{ env.REGISTRY }}/api-service-api:latest

      - name: Deploy to VM
        run: |
          # Determine deployment environment
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            DEPLOYMENT_ENV="production"
          else
            DEPLOYMENT_ENV="development"
          fi

          # Run deployment script
          gcloud compute ssh ${{ env.VM_NAME }} \
            --zone=${{ env.ZONE }} \
            --tunnel-through-iap \
            --command="bash -s" < scripts/deploy.sh $DEPLOYMENT_ENV ${{ github.sha }}
```

### **GitLab CI Example**

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy-dev
  - migrate-dev
  - deploy-prod
  - migrate-prod

variables:
  PROJECT_ID: isling-dev-api-service
  REGION: asia-northeast1
  REGISTRY: asia-northeast1-docker.pkg.dev/isling-dev-api-service/dev01-tky-main-api-service

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm test
    - npm run lint
    - npm run type-check

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - echo $GCP_SA_KEY | base64 -d > gcp-key.json
    - gcloud auth activate-service-account --key-file gcp-key.json
    - gcloud auth configure-docker $REGION-docker.pkg.dev
  script:
    - docker build -t $REGISTRY/api-service-api:$CI_COMMIT_SHA .
    - docker push $REGISTRY/api-service-api:$CI_COMMIT_SHA
  only:
    - main
    - develop

deploy-dev:
  stage: deploy-dev
  script:
    - gcloud compute ssh dev01-tky-a-api-service --zone=asia-northeast1-a --tunnel-through-iap --command="bash -s" < scripts/deploy.sh development $CI_COMMIT_SHA
  only:
    - develop

migrate-dev:
  stage: migrate-dev
  script:
    - gcloud compute ssh dev01-tky-a-api-service --zone=asia-northeast1-a --tunnel-through-iap --command="bash -s" < scripts/migrate.sh development
  only:
    - develop

deploy-prod:
  stage: deploy-prod
  script:
    - gcloud compute ssh prod01-tky-a-api-service --zone=asia-northeast1-a --tunnel-through-iap --command="bash -s" < scripts/deploy.sh production $CI_COMMIT_SHA
  when: manual
  only:
    - main

migrate-prod:
  stage: migrate-prod
  script:
    - gcloud compute ssh prod01-tky-a-api-service --zone=asia-northeast1-a --tunnel-through-iap --command="bash -s" < scripts/migrate.sh production
  when: manual
  only:
    - main
```

## 📦 **Deployment Scripts**

### **Main Deployment Script (`scripts/deploy.sh`)**

```bash
#!/bin/bash
set -e

ENVIRONMENT=$1
COMMIT_SHA=$2
REGISTRY="asia-northeast1-docker.pkg.dev/isling-dev-api-service/dev01-tky-main-api-service"

echo "🚀 Deploying API Service to $ENVIRONMENT"
echo "📦 Image: $REGISTRY/api-service-api:$COMMIT_SHA"

# Navigate to application directory
cd /opt/api-service

# Create backup of current state
echo "💾 Creating backup..."
sudo cp docker-compose.yml docker-compose.backup.yml
sudo cp .env .env.backup

# Update image in docker-compose
echo "🔄 Updating docker-compose.yml..."
sudo sed -i "s|image: .*/api-service-api:.*|image: $REGISTRY/api-service-api:$COMMIT_SHA|g" docker-compose.yml

# Pull new images
echo "⬇️ Pulling new images..."
sudo docker compose pull api-service

# Check if this is a database schema change
if [ -f "migrations/pending.flag" ]; then
  echo "⚠️ Database migrations detected. Run migrate.sh before deployment."
  exit 1
fi

# Rolling update with health checks
echo "🔄 Performing rolling update..."

# Stop only the API service
sudo docker compose stop api-service

# Start with new image
sudo docker compose up -d api-service

# Wait for health check
echo "🏥 Waiting for health check..."
sleep 30

# Verify deployment
if curl -f http://localhost:8000/health; then
  echo "✅ Deployment successful!"

  # Clean up old images
  echo "🧹 Cleaning up old images..."
  sudo docker image prune -f

  # Remove backup files
  sudo rm -f docker-compose.backup.yml .env.backup
else
  echo "❌ Health check failed. Rolling back..."

  # Rollback
  sudo docker compose stop api-service
  sudo cp docker-compose.backup.yml docker-compose.yml
  sudo cp .env.backup .env
  sudo docker compose up -d api-service

  exit 1
fi

echo "🎉 Deployment completed successfully!"
```

### **Database Migration Script (`scripts/migrate.sh`)**

```bash
#!/bin/bash
set -e

ENVIRONMENT=$1
REGISTRY="asia-northeast1-docker.pkg.dev/isling-dev-api-service/dev01-tky-main-api-service"

echo "🗄️ Running database migrations for $ENVIRONMENT"

cd /opt/api-service

# Determine database configuration based on phase
if [ -f "/opt/api-service/.env" ]; then
  source /opt/api-service/.env
fi

# Check if Cloud SQL is enabled
if [ "$ENABLE_CLOUD_SQL" = "true" ]; then
  echo "📍 Using Cloud SQL (Phase 2)"
  DB_HOST=${DB_HOST:-"localhost"}
  MIGRATION_MODE="cloud_sql"
else
  echo "📍 Using containerized database (Phase 1)"
  DB_HOST="localhost"
  MIGRATION_MODE="containerized"
fi

# Create migration backup
echo "💾 Creating database backup..."
if [ "$MIGRATION_MODE" = "cloud_sql" ]; then
  # Cloud SQL backup
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  gcloud sql export sql dev01-isling-postgres gs://isling-dev-tky-isling-backups/migration-backup-$TIMESTAMP.sql \
    --database=isling_api
else
  # Containerized database backup
  sudo docker compose exec -T api-postgres pg_dump -U isling_api isling_api > /tmp/migration-backup-$(date +%Y%m%d_%H%M%S).sql
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."

if [ "$MIGRATION_MODE" = "cloud_sql" ]; then
  # Phase 2: Cloud SQL migrations
  echo "🌩️ Migrating Cloud SQL database..."

  # Run migration in temporary container with Cloud SQL connection
  sudo docker run --rm \
    --network isling_default \
    -e DATABASE_URL="postgresql://$API_DB_USER:$API_DB_PASSWORD@$DB_HOST:5432/isling_api" \
    -v /opt/api-service/prisma:/app/prisma \
    $REGISTRY/api-service-api:latest \
    npx prisma migrate deploy --schema=/app/prisma/schema.prisma

else
  # Phase 1: Containerized database migrations
  echo "🐳 Migrating containerized database..."

  # Ensure database is running
  sudo docker compose up -d api-postgres
  sleep 10

  # Run migration through API service container
  sudo docker compose exec api-service npx prisma migrate deploy
fi

# Verify migration
echo "✅ Verifying migration..."
if [ "$MIGRATION_MODE" = "cloud_sql" ]; then
  # Verify Cloud SQL migration
  sudo docker run --rm \
    --network isling_default \
    -e DATABASE_URL="postgresql://$API_DB_USER:$API_DB_PASSWORD@$DB_HOST:5432/isling_api" \
    $REGISTRY/api-service-api:latest \
    npx prisma db pull --print
else
  # Verify containerized migration
  sudo docker compose exec api-service npx prisma db pull --print
fi

# Generate Prisma client (if needed)
echo "🔧 Generating Prisma client..."
if [ "$MIGRATION_MODE" = "cloud_sql" ]; then
  sudo docker run --rm \
    -v /opt/api-service/prisma:/app/prisma \
    $REGISTRY/api-service-api:latest \
    npx prisma generate --schema=/app/prisma/schema.prisma
else
  sudo docker compose exec api-service npx prisma generate
fi

echo "✅ Database migration completed successfully!"

# Remove pending migration flag
sudo rm -f /opt/api-service/migrations/pending.flag
```

## 🔄 **Phase-Specific Deployment Strategies**

### **Phase 1: Containerized Database Deployment**

```yaml
# docker-compose.dev.yml for Phase 1
version: '3.8'

services:
  api-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: isling_api
      POSTGRES_USER: isling_api
      POSTGRES_PASSWORD: ${API_SERVICE_POSTGRES_PASSWORD}
    volumes:
      - api-postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U isling_api']
      interval: 30s
      timeout: 10s
      retries: 3

  api-service:
    image: ${REGISTRY}/api-service-api:${IMAGE_TAG:-latest}
    environment:
      DATABASE_URL: postgresql://isling_api:${API_SERVICE_POSTGRES_PASSWORD}@api-postgres:5432/isling_api
      NODE_ENV: ${NODE_ENV:-development}
    depends_on:
      api-postgres:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  api-postgres-data:
```

### **Phase 2: Cloud SQL Deployment**

```yaml
# docker-compose.prod.yml for Phase 2
version: '3.8'

services:
  api-service:
    image: ${REGISTRY}/api-service-api:${IMAGE_TAG:-latest}
    environment:
      DATABASE_URL: postgresql://${API_DB_USER}:${API_DB_PASSWORD}@${DB_HOST}:5432/isling_api
      NODE_ENV: production
      REDIS_URL: redis://api-redis:6379
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:8000/health']
      interval: 30s
      timeout: 10s
      retries: 3

  api-redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - api-redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  api-redis-data:
```

## 🗄️ **Database Migration Strategies**

### **Prisma Migration Best Practices**

#### **1. Safe Migration Patterns**

```typescript
// Example: Safe column addition
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?  // Safe: nullable field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### **2. Dangerous Operations**

```typescript
// Avoid these in production:
// - Dropping columns
// - Changing column types
// - Adding non-nullable columns without defaults
// - Dropping tables with data
```

#### **3. Migration File Naming**

```bash
# Use descriptive names
20231201120000_add_user_profile_table/
20231201130000_add_email_verification/
20231201140000_index_user_email/
```

### **Pre-Deployment Migration Checks**

```bash
#!/bin/bash
# scripts/pre-migration-check.sh

echo "🔍 Pre-migration checks..."

# Check for pending migrations
PENDING=$(npx prisma migrate status --schema=prisma/schema.prisma | grep "pending")

if [ -n "$PENDING" ]; then
  echo "⚠️ Pending migrations detected:"
  echo "$PENDING"

  # Create flag file for deployment script
  touch migrations/pending.flag

  echo "📝 Review migrations before deployment!"
  exit 1
else
  echo "✅ No pending migrations"
  rm -f migrations/pending.flag
fi

# Validate schema
npx prisma validate --schema=prisma/schema.prisma

echo "✅ Pre-migration checks passed"
```

## 📊 **Monitoring & Rollback**

### **Health Check Implementation**

```typescript
// src/health.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function healthCheck() {
  try {
    // Database connectivity check
    await prisma.$queryRaw`SELECT 1`;

    // Application-specific checks
    const userCount = await prisma.user.count();

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      userCount: userCount,
      version: process.env.npm_package_version,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
    };
  }
}
```

### **Rollback Procedures**

#### **Application Rollback**

```bash
#!/bin/bash
# scripts/rollback.sh

ENVIRONMENT=$1
PREVIOUS_TAG=$2

echo "🔄 Rolling back to $PREVIOUS_TAG"

cd /opt/api-service

# Stop current services
sudo docker compose down

# Update to previous image
sudo sed -i "s|image: .*/api-service-api:.*|image: asia-northeast1-docker.pkg.dev/isling-dev-api-service/dev01-tky-main-api-service/api-service-api:$PREVIOUS_TAG|g" docker-compose.yml

# Start services
sudo docker compose up -d

# Wait for health check
sleep 30

if curl -f http://localhost:8000/health; then
  echo "✅ Rollback successful"
else
  echo "❌ Rollback failed"
  exit 1
fi
```

#### **Database Rollback**

```bash
#!/bin/bash
# scripts/rollback-database.sh

ENVIRONMENT=$1
BACKUP_FILE=$2

echo "🗄️ Rolling back database from $BACKUP_FILE"

if [ "$ENVIRONMENT" = "production" ]; then
  # Cloud SQL rollback
  echo "⚠️ Production database rollback requires manual intervention"
  echo "Use: gcloud sql import sql instance-name gs://bucket/$BACKUP_FILE"
else
  # Development database rollback
  sudo docker compose exec -T api-postgres psql -U isling_api -d isling_api < $BACKUP_FILE
fi
```

## 🔐 **Security & Secrets Management**

### **Environment Variables**

```bash
# env.example
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"
API_SERVICE_POSTGRES_PASSWORD="secure-password"

# Authentication
JWT_SECRET="your-jwt-secret-32-characters-min"
AUTH_SERVICE_JWT_SECRET="auth-jwt-secret"

# External Services
REDIS_URL="redis://localhost:6379"
SMTP_URL="smtp://user:pass@smtp.example.com:587"

# Monitoring
SENTRY_DSN="https://your-sentry-dsn"
LOG_LEVEL="info"
```

### **CI/CD Secrets**

Required secrets in CI/CD platform:

- `GCP_SA_KEY`: Service account key for GCP access
- `DATABASE_PASSWORD`: Database passwords
- `JWT_SECRET`: JWT signing secrets
- `SENTRY_DSN`: Error tracking credentials

## 📋 **Deployment Checklist**

### **Pre-Deployment**

- ✅ Tests passing
- ✅ Code review completed
- ✅ Database migrations reviewed
- ✅ Environment variables updated
- ✅ Feature flags configured
- ✅ Monitoring alerts configured

### **During Deployment**

- ✅ Backup created
- ✅ Health checks passing
- ✅ Database migrations applied
- ✅ Application deployed
- ✅ Integration tests passing

### **Post-Deployment**

- ✅ Health checks verified
- ✅ Monitoring dashboards checked
- ✅ Error rates within limits
- ✅ Performance metrics normal
- ✅ Rollback plan ready

## 🚀 **Advanced Patterns**

### **Blue-Green Deployments**

For zero-downtime deployments:

```bash
# Deploy to green environment
gcloud compute ssh green-vm --zone=$ZONE --tunnel-through-iap --command="bash -s" < scripts/deploy.sh production $COMMIT_SHA

# Switch traffic
# Update load balancer backend

# Cleanup blue environment
```

### **Canary Deployments**

```bash
# Deploy to canary instance
# Route 10% traffic to canary
# Monitor metrics
# Gradually increase traffic
# Full rollout or rollback
```

This CI/CD pipeline ensures reliable, automated deployments with proper database migration handling for both development and production phases.
