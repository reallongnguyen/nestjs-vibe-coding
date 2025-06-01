# Production Scaling Guide for Isling

This guide explains how to scale Isling from development to production with service separation and data persistence.

## 🏗️ **Scaling Architecture Evolution**

### **Phase 1: Development Environment**

_Single VM with containerized databases - development only_

```
Load Balancer → 1 VM (API + Auth + MQTT + Containerized DBs)
```

**Use Case**: Development environment where data consistency is handled by containerized databases.

### **Phase 2: Early Production (Optional)**

_Single VM with managed databases - minimal production_

```
Load Balancer → 1 VM (API + Auth + MQTT) + Cloud SQL + Redis
```

**Use Case**: Early production phase with minimal traffic, but requiring data persistence and backup.

### **Phase 3: Staging & Production**

_GKE with service separation - scalable production_

```
Load Balancer → GKE Cluster → API Pods (High Load)
                            → Auth Pods (Medium Load)
                            → MQTT Pods (Specialized)
                            → Cloud SQL (Managed DB)
                            → Redis Cluster
```

**Use Case**: Staging and production environments requiring horizontal scaling and service isolation.

## 🚀 **Phase 1: Development Environment**

Single instance with containerized databases for development consistency.

### **Current Implementation**

```bash
# Development configuration (current setup)
cat > terraform.tfvars << EOF
# Development settings
machine_type               = "e2-medium"
min_instances             = 1
max_instances             = 1
target_cpu_utilization    = 0.8

# Use containerized databases for development
enable_cloud_sql = false

# Development domains
api_domain     = "dev-api.isling.me"
auth_domain    = "dev-auth.isling.me"
mqtt_domain    = "dev-mqtt.isling.me"
traefik_domain = "dev-traefik.isling.me"
EOF
```

### **Phase 1 Characteristics**

- ✅ **Single VM**: e2-medium instance
- ✅ **Containerized DBs**: PostgreSQL, Redis in containers
- ✅ **Data Consistency**: All services share same VM
- ✅ **Cost Optimized**: ~$77/month
- ✅ **Development Ready**: Quick deployment and testing

### **Limitations of Phase 1**

- ❌ **No Horizontal Scaling**: Single point of failure
- ❌ **No Data Persistence**: Container restarts lose data
- ❌ **Not Production Ready**: No backup/recovery

## 💼 **Phase 2: Early Production (Optional)**

Transitional phase with managed databases but single VM deployment.

### **Configuration**

```bash
# Early production configuration
cat > terraform.tfvars << EOF
# Single VM but production-ready
machine_type               = "e2-standard-2"
min_instances             = 1
max_instances             = 1

# Managed databases for persistence
enable_cloud_sql = true

# Production domains
api_domain     = "api.isling.me"
auth_domain    = "auth.isling.me"
mqtt_domain    = "mqtt.isling.me"
traefik_domain = "traefik.isling.me"
EOF
```

### **Phase 2 Benefits**

- ✅ **Data Persistence**: Cloud SQL with backups
- ✅ **Cost Effective**: Single VM + managed DB
- ✅ **Production Ready**: Backup and recovery
- ✅ **Easy Migration**: Path to Phase 3

### **Phase 2 Cost Estimation**

- **Instance**: 1 × e2-standard-2 = $50/month
- **Cloud SQL**: db-f1-micro = $25/month
- **Load Balancer**: $18/month
- **Total**: ~$93/month

## 🎯 **Phase 3: Staging & Production (GKE)**

Full-scale production architecture with GKE and service separation.

### **When to Use Phase 3**

- **Traffic Growth**: More than 1000 concurrent users
- **Scaling Requirements**: Need horizontal scaling
- **Service Isolation**: Different scaling requirements per service
- **High Availability**: Multi-zone deployment required

## 💰 **Cost Comparison**

### **Phase 1: Development**

- **Total**: ~$77/month
- **Use Case**: Development and testing

### **Phase 2: Early Production**

- **Total**: ~$93/month
- **Use Case**: Small production deployments

### **Phase 3: Production (GKE)**

- **Minimum**: ~$400/month (3 nodes + managed services)
- **Scaled**: ~$1500/month (10+ nodes + HA services)
- **Use Case**: High-traffic production

## 🚀 **Migration Strategy**

### **Development → Early Production (Phase 1 → 2)**

```bash
# 1. Enable Cloud SQL
terraform apply -var="enable_cloud_sql=true"

# 2. Migrate data from containers to Cloud SQL
# (Data migration scripts)

# 3. Update application configuration
# (Environment variables for Cloud SQL)
```

### **Early Production → Full Production (Phase 2 → 3)**

```bash
# 1. Deploy GKE cluster
terraform apply -target=google_container_cluster.isling_production

# 2. Deploy applications to Kubernetes
kubectl apply -f k8s/

# 3. Gradual traffic migration
# Update load balancer routing

# 4. Cleanup single VM
terraform destroy -target=google_compute_instance_template.app_template
```

## 📋 **Architecture Decision Framework**

### **Choose Phase 1 (Development) When:**

- ✅ Development environment
- ✅ Testing and prototyping
- ✅ Cost is primary concern (~$77/month)
- ✅ Data consistency requirements are simple

### **Choose Phase 2 (Early Production) When:**

- ✅ Small production deployment
- ✅ Need data persistence and backups
- ✅ Traffic is low-medium
- ✅ Budget constraint (~$93/month)

### **Choose Phase 3 (GKE Production) When:**

- ✅ High traffic and scaling requirements
- ✅ Service isolation needed
- ✅ Multi-environment deployment (staging + production)
- ✅ Advanced monitoring and observability required
- ✅ Budget allows for higher costs ($400+ /month)

This simplified approach provides clear progression: **Development → Early Production → Full Production** with distinct use cases and migration paths.
