# GCP Deployment Guide for Isling Development Environment

This guide explains how to deploy Isling development environment to Google Cloud Platform using Cloud SQL for databases and our Terraform-based infrastructure.

## 🏗️ **Architecture Overview**

```plaintext
Internet (HTTPS)
    ↓
🌐 GCP Global Load Balancer (SSL Termination)
    ↓ HTTP (Internal)
🔀 Private GCE Instance → Traefik Gateway
    ↓ HTTP (Internal)
🚀 Docker Services (API, Auth, MQTT, Redis)
    ↓ Private Network
🗄️ Cloud SQL PostgreSQL (Managed)
```

## ✅ **Infrastructure Components**

- **Private VPC**: Dedicated network with Cloud NAT for outbound access
- **Container-Optimized OS VM**: E2-medium instance with Docker runtime
- **Cloud SQL PostgreSQL**: Managed database service for production workloads
- **Global Load Balancer**: HTTPS with Google-managed SSL certificates
- **Cloud DNS**: Managed DNS for backend subdomains
- **Artifact Registry**: Private Docker image storage
- **Cloud Operations**: Logging and monitoring
- **IAM**: Minimal service account permissions

## 🚀 **Deployment Workflow**

### **Prerequisites**

```bash
# Set your GCP project
export PROJECT_ID="isling-me"
export REGION="asia-northeast1"

# Authenticate with GCP
gcloud auth login
gcloud auth application-default login
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable dns.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable logging.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### **Step 1: Deploy Infrastructure with Cloud SQL**

#### **1. Create GCS Bucket for Terraform State**

```bash
# Create state bucket
gsutil mb gs://isling-dev01-tky-devops

# Enable versioning
gsutil versioning set on gs://isling-dev01-tky-devops
```

#### **2. Configure Terraform Variables**

```bash
cd infrastructure/isling-docker/terraform

# Copy and customize terraform variables
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars for development environment:
# - Set api_domain = "api.dev.isling.me"
# - Set auth_domain = "auth.dev.isling.me"
# - Set mqtt_domain = "mqtt.dev.isling.me"
# - Set traefik_domain = "traefik.dev.isling.me"
# - Set enable_cloud_sql = true
# - Set use_preemptible = true (for cost optimization)
```

#### **3. Deploy Infrastructure**

```bash
# Initialize Terraform
terraform init

# Review deployment plan
terraform plan

# Deploy infrastructure
terraform apply

# Note the outputs
terraform output load_balancer_ip
terraform output dns_name_servers
terraform output database_connection
```

**What this creates:**

- ✅ Private VPC with subnet and Cloud NAT
- ✅ VM with Docker, Node.js, and development tools installed
- ✅ **Cloud SQL PostgreSQL instance** with private IP
- ✅ Global load balancer with SSL certificates
- ✅ DNS zone with A records for backend services
- ✅ Artifact Registry for Docker images
- ✅ Firewall rules and IAM service accounts

### **Step 2: Configure DNS**

Add NS records at your domain provider for backend subdomains:

```
api.dev.isling.me      NS    [Google Cloud DNS servers]
auth.dev.isling.me     NS    [Google Cloud DNS servers]
mqtt.dev.isling.me     NS    [Google Cloud DNS servers]
traefik.dev.isling.me  NS    [Google Cloud DNS servers]
```

### **Step 3: Initialize Cloud SQL Databases**

#### **1. Create Databases and Users**

You can use Cloud SQL Studio or Create tunnel likes below then use your tool

```bash
# Complete setup in one command block
VM_NAME="dev01-tky-a-api-isling-<random_string>"
ZONE="asia-northeast1-<zone>"
CLOUD_SQL_IP=$(terraform output -json database_connection | jq -r '.private_ip')

echo "Creating SSH tunnel to Cloud SQL..."
echo "Cloud SQL IP: $CLOUD_SQL_IP"

# Create tunnel
gcloud compute ssh $VM_NAME \
  --zone=$ZONE \
  --ssh-flag="-L 5432:$CLOUD_SQL_IP:5432" \
  --ssh-flag="-N" \
  --ssh-flag="-f"

echo "✅ Tunnel created! You can now connect to localhost:5432"
echo "Connect with: psql 'host=localhost port=5432 user=postgres dbname=postgres'"

# In PostgreSQL prompt:
CREATE DATABASE gorse;
CREATE USER gorse_user WITH PASSWORD 'your_production_gorse_password';
GRANT ALL PRIVILEGES ON DATABASE gorse TO gorse_user;
\q
```

#### **2. Setup Auth Database Schema**

Connect to **auth** database

```bash
CREATE USER supabase_admin LOGIN CREATEROLE CREATEDB REPLICATION BYPASSRLS;

-- Supabase super admin
CREATE USER supabase_auth_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION PASSWORD 'your_production_auth_password';

-- Change postgres to the real PostgreSQL user use are logging in
GRANT supabase_auth_admin TO postgres;

CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION supabase_auth_admin;
GRANT CREATE ON DATABASE auth TO supabase_auth_admin;
ALTER USER supabase_auth_admin SET search_path = 'auth';
```

### **Step 4: Build and Deploy Application**

#### **1. Build and Push Docker Images**

```bash
# Build your API image
docker build -t isling-api:latest .

# Tag for Artifact Registry
docker tag isling-api:latest \
  asia-northeast1-docker.pkg.dev/$PROJECT_ID/dev01-tky-main-isling/isling-api:latest

# Push to registry
docker push \
  asia-northeast1-docker.pkg.dev/$PROJECT_ID/dev01-tky-main-isling/isling-api:latest
```

#### **2. Prepare Development Environment Configuration**

```bash
cd infrastructure/isling-docker

# Copy and customize environment configuration for development
cp env.dev.example .env.dev

# Edit .env.dev with your Cloud SQL connection details:
# - Update CLOUD_SQL_PRIVATE_IP with actual Cloud SQL private IP
# - Set production passwords for AUTH_SERVICE_POSTGRES_PASSWORD and API_SERVICE_POSTGRES_PASSWORD
# - Set GORSE_POSTGRES_PASSWORD for Gorse database access
# - Configure email SMTP settings
# - Set JWT secret (32+ characters)
```

**Environment-Specific Configuration:**

For different environments, you can create separate env files:

```bash
# Development environment
cp env.dev.example .env.dev
# Edit .env.dev for development settings

# Staging environment
cp env.dev.example .env.staging
# Edit .env.staging with staging-specific values:
# - Change domains to *.staging.isling.me
# - Use staging database credentials
# - Set appropriate log levels

# Production environment
cp env.dev.example .env.prod
# Edit .env.prod with production values:
# - Change domains to *.prod.isling.me or *.isling.me
# - Use production database credentials
# - Enable production security settings
```

Get Cloud SQL connection details:

```bash
# Get Cloud SQL private IP and instance details
CLOUD_SQL_IP=$(terraform output -json database_connection | jq -r '.private_ip')
CLOUD_SQL_INSTANCE=$(terraform output -json database_connection | jq -r '.instance')

echo "Cloud SQL Private IP: $CLOUD_SQL_IP"
echo "Cloud SQL Instance: $CLOUD_SQL_INSTANCE"

# Update your .env.dev file with these values
# Required environment variables for Cloud SQL:
# - CLOUD_SQL_HOST=<cloud_sql_private_ip>
# - AUTH_SERVICE_POSTGRES_PASSWORD=<auth_password>
# - API_SERVICE_POSTGRES_PASSWORD=<api_password>
# - GORSE_POSTGRES_USER=gorse_user
# - GORSE_POSTGRES_PASSWORD=<gorse_password>
# - GORSE_POSTGRES_DB=gorse
```

#### **3. Deploy to VM**

```bash
# Get VM connection info
VM_NAME="dev01-tky-a-api-isling"
ZONE="asia-northeast1-a"

# Create traefik configuration from template with env file
cd infrastructure/isling-docker

./scripts/create-traefik-config.sh .env.dev

# Copy application files to VM
gcloud compute scp docker-compose.cloudsql.yml $VM_NAME:/opt/isling/docker-compose.yml --zone=$ZONE
gcloud compute scp .env.dev $VM_NAME:/opt/isling/.env --zone=$ZONE
gcloud compute scp traefik-gateway/traefik.yaml $VM_NAME:/opt/isling/traefik.yaml --zone=$ZONE

# Copy auth database initialization script
gcloud compute scp auth-service/db/auth.sql $VM_NAME:/opt/isling/auth.sql --zone=$ZONE

# Connect to VM and deploy
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
cd /opt/isling
docker compose pull
docker compose up -d
"
```

#### **4. Setup API Database Schema**

```bash
# Run Prisma DB push to setup API database schema
# Option 1: Using the migration script (Recommended)
./scripts/db-migrate.sh push

# Option 2: Direct docker exec (if script is not available)
docker compose exec api-service npx prisma db push --schema=./prisma/schema.prisma

# Option 3: For production environments, use migrate deploy instead
./scripts/db-migrate.sh deploy
```

### **Step 5: Verify Deployment**

```bash
# Test SSL certificates and health checks
curl -I https://api.dev.isling.me/health
curl -I https://auth.dev.isling.me/health

# Test application functionality
curl https://api.dev.isling.me/api
curl https://auth.dev.isling.me/auth/v1/settings

# Test database connectivity
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
# Test API database connection
docker compose exec api-service npx prisma migrate status

# Test Auth database connection
docker compose exec auth-service wget --spider http://localhost:8000/health

# Test Gorse database connection
docker compose exec gorse-master curl -f http://localhost:8088/api/health/ready
"
```

## 🔄 **Application Updates**

For application updates:

```bash
# Build new version
docker build -t isling-api:v1.1.0 .
docker tag isling-api:v1.1.0 \
  asia-northeast1-docker.pkg.dev/$PROJECT_ID/dev01-tky-main-isling/isling-api:latest
docker push \
  asia-northeast1-docker.pkg.dev/$PROJECT_ID/dev01-tky-main-isling/isling-api:latest

# Update on VM
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
cd /opt/isling
docker compose pull
docker compose up -d --force-recreate api-service
"
```

## 🔧 **Multi-Environment Deployment**

For deploying to different environments (staging, production), use the appropriate env file:

```bash
# For staging environment
./scripts/create-traefik-config.sh .env.staging
gcloud compute scp .env.staging $VM_NAME:/opt/isling/.env --zone=$ZONE
gcloud compute scp traefik-gateway/traefik.yaml $VM_NAME:/opt/isling/traefik.yaml --zone=$ZONE

# For production environment
./scripts/create-traefik-config.sh .env.prod
gcloud compute scp .env.prod $VM_NAME:/opt/isling/.env --zone=$ZONE
gcloud compute scp traefik-gateway/traefik.yaml $VM_NAME:/opt/isling/traefik.yaml --zone=$ZONE
```

## 📊 **Monitoring & Maintenance**

### **Health Checks**

```bash
# Application health
curl https://api.dev.isling.me/health
curl https://auth.dev.isling.me/health

# Cloud SQL health
gcloud sql instances describe $CLOUD_SQL_INSTANCE

# Infrastructure health
gcloud compute instances describe $VM_NAME --zone=$ZONE
```

### **Database Management**

```bash
# Connect to Cloud SQL
gcloud sql connect $CLOUD_SQL_INSTANCE --user=postgres

# Backup database
gcloud sql backups create --instance=$CLOUD_SQL_INSTANCE

# View backup list
gcloud sql backups list --instance=$CLOUD_SQL_INSTANCE
```

### **Logs**

```bash
# Application logs
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
cd /opt/isling
docker compose logs -f
"

# Cloud SQL logs
gcloud sql operations list --instance=$CLOUD_SQL_INSTANCE
```

## 💰 **Cost Optimization**

**Current Cost Estimate (Development with Cloud SQL):**

- VM Instance (e2-medium, preemptible): ~$7.50/month
- Cloud SQL (db-f1-micro): ~$9/month
- Load Balancer: ~$18/month
- Cloud NAT: ~$15/month
- DNS + Storage + Monitoring: ~$10/month
- **Total: ~$60/month**

## 🔐 **Security Best Practices**

- ✅ **Private Cloud SQL**: Database only accessible via private IP
- ✅ **Private VM**: No external IP, access via Cloud NAT
- ✅ **Minimal IAM**: Service account with least privilege
- ✅ **SSL Everywhere**: Google-managed certificates
- ✅ **Firewall Rules**: Restrictive ingress/egress rules
- ✅ **Database Encryption**: Cloud SQL encrypted at rest
- ✅ **Backup Strategy**: Automated Cloud SQL backups

## 🛠️ **Troubleshooting**

### **Cloud SQL Connection Issues**

```bash
# Test private IP connectivity from VM
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
ping $CLOUD_SQL_IP
telnet $CLOUD_SQL_IP 5432
"

# Check Cloud SQL status
gcloud sql instances describe $CLOUD_SQL_INSTANCE
```

### **Database Schema Issues**

```bash
# Check auth database schema
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
PGPASSWORD=your_production_auth_password psql \
  -h $CLOUD_SQL_IP \
  -U supabase_auth_admin \
  -d auth \
  -c '\dt'
"

# Check API database schema
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
docker compose exec api-service npx prisma db pull
docker compose exec api-service npx prisma migrate status
"

# Check Gorse database connection
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
PGPASSWORD=your_production_gorse_password psql \
  -h $CLOUD_SQL_IP \
  -U gorse_user \
  -d gorse \
  -c '\dt'
"
```

### **Traefik Configuration Issues**

```bash
# Regenerate traefik config for specific environment
cd infrastructure/isling-docker
./scripts/create-traefik-config.sh .env.dev

# Validate traefik configuration
docker compose exec traefik-gateway traefik --configfile=/etc/traefik/traefik.yaml --dry-run

# Check traefik logs
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
docker compose logs traefik-gateway
"
```

### **Application Issues**

```bash
# Check service logs
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
docker compose logs api-service
docker compose logs auth-service
"

# Check database connectivity
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
docker compose exec api-service psql \$DATABASE_URL -c 'SELECT 1;'
"
```

## 📋 **Development Environment Checklist**

- [ ] **Infrastructure Setup**

  - [ ] Terraform variables configured (`terraform.tfvars`)
  - [ ] Infrastructure deployed with Cloud SQL enabled
  - [ ] DNS records configured

- [ ] **Environment Configuration**

  - [ ] Development environment file created (`.env.dev`)
  - [ ] Cloud SQL connection details updated
  - [ ] SMTP and JWT secrets configured
  - [ ] Traefik configuration generated with correct env file

- [ ] **Database Setup**

  - [ ] Cloud SQL databases created (auth, isling_api, gorse)
  - [ ] Auth database schema initialized (`auth.sql`)
  - [ ] API database schema migrated (`prisma db push`)
  - [ ] Gorse database user configured with proper permissions

- [ ] **Application Deployment**

  - [ ] Docker images built and pushed
  - [ ] Services deployed to VM
  - [ ] Health checks passing

- [ ] **Verification**
  - [ ] All service endpoints accessible
  - [ ] Database connections working
  - [ ] SSL certificates valid
  - [ ] Traefik routing working correctly

This deployment guide focuses on the Cloud SQL-based development environment on GCP, providing a production-ready database solution while maintaining cost efficiency through preemptible instances.
