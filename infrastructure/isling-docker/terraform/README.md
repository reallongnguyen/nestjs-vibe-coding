# Isling API Service Infrastructure

This Terraform configuration deploys the Isling API Service **backend services** on Google Cloud Platform with **Cloud SQL f1-micro** and **shared VM** as the default approach for optimal cost-efficiency and operational simplicity.

## 🏗️ **Default Architecture**

### ✅ **Recommended Defaults (New)**

- **Database**: Cloud SQL PostgreSQL f1-micro (managed)
- **Compute**: Shared VM between development & staging
- **Security**: Cloud Armor basic protection enabled
- **Cost Optimization**: Preemptible instances for dev/staging

### 🎯 **Key Infrastructure Components**

- **VPC Network**: Dedicated private network with Cloud NAT for internet access
- **Auto-scaling Compute**: Managed instance group (1-3 e2-medium instances)
- **Managed Database**: Cloud SQL PostgreSQL with automated backups
- **Global Load Balancer**: HTTPS load balancer with Google-managed SSL certificates
- **Cloud Armor**: DDoS protection and Web Application Firewall
- **DNS**: Cloud DNS for backend service domains
- **Storage**: Artifact Registry for Docker images
- **Monitoring**: Cloud Operations Suite with logging and metrics
- **Security**: Private instances, minimal IAM permissions, comprehensive firewall rules

## 💰 **Cost Overview**

| Environment             | Monthly Cost | Target Use Case            |
| ----------------------- | ------------ | -------------------------- |
| **Dev/Staging Shared**  | $35.65       | Development & testing      |
| **Production 1K DAU**   | $105.43      | Small production workload  |
| **Production 10K DAU**  | $280.71      | Medium production workload |
| **Production 100K DAU** | $1,403.25    | Large production workload  |

📊 **See [COST-ANALYSIS.md](./COST-ANALYSIS.md) for detailed cost breakdown and scaling scenarios.**

## 🔧 **Environment Configurations**

### 🧪 **Development/Staging (Default)**

```hcl
environment_tier = "dev-staging"  # Shared resources
use_preemptible = true           # 70% cost savings
enable_cloud_sql = true          # Managed PostgreSQL
enable_cloud_armor = true        # Basic security
```

### 🚀 **Production**

```hcl
environment_tier = "production"   # Dedicated resources
use_preemptible = false          # Reliable instances
enable_cloud_sql = true          # Managed PostgreSQL with HA
enable_cloud_armor = true        # Enhanced security
```

## Architecture Overview

- **VPC Network**: Dedicated private network with Cloud NAT for internet access
- **Compute**: Single e2-medium instance running Container-Optimized OS
- **Load Balancer**: Global HTTPS load balancer with Google-managed SSL certificates
- **DNS**: Cloud DNS for backend service domains only
- **Storage**: Artifact Registry for Docker images
- **Monitoring**: Cloud Operations Suite with logging and metrics
- **Security**: Private instances, minimal IAM permissions, comprehensive firewall rules

## Domain Structure

**GCP Backend Services** (managed by this infrastructure):

- **API Service**: `dev-api.example.com`
- **Auth Service**: `dev-auth.example.com`
- **MQTT Service**: `dev-mqtt.example.com`
- **Traefik Dashboard**: `dev-traefik.example.com`

**External Services**:

- **Frontend App**: `dev-app.example.com` (deployed on Vercel)

All backend domains point to the same GCP load balancer with SSL certificates.

## Prerequisites

1. **GCP Project**: Create or use existing project `isling-dev-vibe`
2. **APIs Enabled**:

   ```bash
   gcloud services enable compute.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable dns.googleapis.com
   gcloud services enable logging.googleapis.com
   gcloud services enable monitoring.googleapis.com
   ```

3. **Terraform**: Version >= 1.0
4. **Domain DNS**: Configure your domain DNS to point backend subdomains to GCP nameservers

## DNS Configuration

When using your domain provider's built-in DNS, you'll need to:

1. Deploy this infrastructure to get the nameservers
2. In your domain provider's DNS settings, create **NS records** for backend subdomains:

   ```
   dev-api.example.com     NS    ns-cloud-x1.googledomains.com
   dev-auth.example.com    NS    ns-cloud-x2.googledomains.com
   dev-mqtt.example.com    NS    ns-cloud-x3.googledomains.com
   dev-traefik.example.com NS    ns-cloud-x4.googledomains.com
   ```

## Resource Naming Convention

Following Isling naming standards: `{env}{numbering}-{region}-{role}-{system_id|subsystem_id}`

Examples:

- VPC: `isling-dev01-api-service-vpc`
- Subnet: `dev01-api-service-prv-tky`
- Load Balancer: `dev01-apigw-https-ext-api-service`
- Service Account: `dev01-api-service-api@isling-dev-vibe.iam.gserviceaccount.com`

## Deployment Steps

### 1. Initialize Backend

```bash
# Create GCS bucket for Terraform state
gsutil mb gs://isling-dev-tky-api-service-tfstate
gsutil versioning set on gs://isling-dev-tky-api-service-tfstate
```

### 2. Configure Variables

Create `terraform.tfvars` from the example:

```bash
cp terraform.tfvars.example terraform.tfvars
```

**For Development/Staging (Default):**

```hcl
project_id          = "isling-dev-vibe"
region              = "asia-northeast1"
zone                = "asia-northeast1-a"
environment_tier    = "dev-staging"     # Shared resources
use_preemptible     = true             # Cost savings
enable_cloud_sql    = true             # Managed database (default)
enable_cloud_armor  = true             # Security (default)
api_domain          = "dev-api.example.com"
auth_domain         = "dev-auth.example.com"
mqtt_domain         = "dev-mqtt.example.com"
traefik_domain      = "dev-traefik.example.com"
```

**For Production:**

```hcl
project_id          = "isling-dev-vibe"
region              = "asia-northeast1"
zone                = "asia-northeast1-a"
environment_tier    = "production"      # Dedicated resources
use_preemptible     = false            # Reliable instances
enable_cloud_sql    = true             # Managed database with HA
enable_cloud_armor  = true             # Enhanced security
machine_type        = "e2-standard-2"  # Larger instances
min_instances       = 2                # Higher availability
max_instances       = 10               # Auto-scaling
```

### 3. Deploy Infrastructure

```bash
terraform init
terraform plan
terraform apply
```

### 4. Configure DNS Delegation

Use the output `dns_name_servers` to configure NS records in your domain provider's DNS for the backend subdomains.

### 5. Build and Push Images

```bash
# Authenticate Docker
gcloud auth configure-docker asia-northeast1-docker.pkg.dev

# Build and push your application image
docker build -t asia-northeast1-docker.pkg.dev/isling-dev-vibe/dev01-tky-main-api-service/api-service-api:latest .
docker push asia-northeast1-docker.pkg.dev/isling-dev-vibe/dev01-tky-main-api-service/api-service-api:latest
```

## Access URLs After Deployment

**Backend Services** (GCP):

- **API Endpoints**: <https://dev-api.example.com>
- **Authentication**: <https://dev-auth.example.com>

## Cost Estimation

**Updated Cost Analysis with Cloud SQL f1-micro defaults:**

### 🧪 **Development/Staging (Shared)**

- Cloud SQL f1-micro: $6.50/month
- Compute (preemptible): $7.50/month
- Load Balancer: $18.25/month
- Cloud Armor: $2.00/month
- Other (VPC, DNS, etc.): $1.40/month
- **Total: $35.65/month** (shared between dev & staging)

### 🚀 **Production Scaling**

- **1K DAU**: $105.43/month ($0.11/user/month)
- **10K DAU**: $280.71/month ($0.28/user/month)
- **100K DAU**: $1,403.25/month ($0.14/user/month)

📊 **See [COST-ANALYSIS.md](./COST-ANALYSIS.md) for comprehensive cost breakdown, scaling scenarios, and optimization strategies.**

**Cost Comparison vs Previous (Containerized DB):**

- Development: $35.65 vs $9.50 (+$26.15 for managed database + enterprise LB)
- Production 1K: $105.43 vs $52.00 (+$53.43 for enterprise features)

## Security Features

- **Private Instances**: No external IPs, access via IAP
- **Minimal IAM**: Service account with only required permissions
- **Firewall Rules**: Restrictive rules for HTTP/HTTPS and health checks
- **SSL/TLS**: Google-managed certificates with automatic renewal
- **VPC Flow Logs**: Network traffic monitoring
- **Cloud Operations**: Comprehensive logging and monitoring

## Monitoring and Logging

- **Health Checks**: HTTP health checks on `/health` endpoint
- **Metrics**: Instance and application metrics via Ops Agent
- **Logs**: Docker container logs forwarded to Cloud Logging
- **Alerting**: Set up custom alerts based on metrics and logs

## Troubleshooting

### Access Private Instance

```bash
# SSH via Identity-Aware Proxy
gcloud compute ssh dev01-tky-a-api-service --zone=asia-northeast1-a --tunnel-through-iap
```

### Check Application Status

```bash
# View Docker Compose status
sudo docker compose -f /opt/api-service/docker-compose.yml ps

# View application logs
sudo docker compose -f /opt/api-service/docker-compose.yml logs
```

### SSL Certificate Issues

- Certificates can take 10-60 minutes to provision
- Ensure DNS is properly configured
- Check certificate status in GCP Console

## Scaling Considerations

For production deployment:

- Increase instance count in managed instance group
- Use larger machine types (e2-standard-2 or higher)
- Enable auto-scaling based on CPU/memory metrics
- Add database high availability
- Implement backup strategies

## Maintenance

### Updates

```bash
# Update infrastructure
terraform plan
terraform apply

# Update application
docker build -t asia-northeast1-docker.pkg.dev/isling-dev-vibe/dev01-tky-main-api-service/api-service-api:latest .
docker push asia-northeast1-docker.pkg.dev/isling-dev-vibe/dev01-tky-main-api-service/api-service-api:latest

# Rolling update instances
gcloud compute instance-groups managed rolling-action replace dev01-tky-mig-api-service --region=asia-northeast1
```

### Backup

- Terraform state is automatically versioned in GCS
- Database backups should be configured separately
- Application data backup via scheduled tasks

## Cleanup

```bash
terraform destroy
# Manually delete GCS bucket if needed
gsutil rm -r gs://isling-dev01-tky-devops
```

## Support

For issues or questions, contact the infrastructure team or create a ticket in the project management system.
