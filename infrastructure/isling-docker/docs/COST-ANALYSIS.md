# Isling Infrastructure Cost Analysis

## Overview

This document provides detailed cost analysis for Isling VM-based infrastructure across different environments and Daily Active User (DAU) scenarios. The analysis includes **Cloud SQL f1-micro** and **shared VM** as the default approach.

## Default Configuration

### ✅ **Recommended Defaults**

- **Database**: Cloud SQL f1-micro (managed PostgreSQL)
- **Compute**: Shared VM between development & staging
- **Security**: Cloud Armor basic protection enabled
- **Cost Optimization**: Preemptible instances for dev/staging

## Environment Configurations

### 🧪 **Development/Staging (Shared)**

**Target**: Development, testing, and staging workloads  
**Approach**: Cost-optimized shared infrastructure

| Component                 | Specification                        | Monthly Cost                    |
| ------------------------- | ------------------------------------ | ------------------------------- |
| **Cloud SQL f1-micro**    | 0.6 vCPU, 0.6GB RAM, 12GB SSD, ZONAL | $6.50                           |
| **Compute (preemptible)** | e2-medium, 1-2 instances             | $7.50                           |
| **Load Balancer**         | HTTPS LB + SSL cert                  | $18.25                          |
| **Cloud Armor**           | Basic protection                     | $2.00                           |
| **Networking**            | VPC, NAT, DNS                        | $1.00                           |
| **Storage**               | Artifact Registry                    | $0.10                           |
| **Monitoring**            | Logs + metrics                       | $0.30                           |
| **Total Dev/Staging**     | **$35.65/month**                     | **Shared between environments** |

### 🚀 **Production Base**

**Target**: Production workload baseline  
**Approach**: Performance and reliability optimized

| Component                 | Specification                           | Monthly Cost           |
| ------------------------- | --------------------------------------- | ---------------------- |
| **Cloud SQL f1-micro**    | 0.6 vCPU, 0.6GB RAM, 20GB SSD, REGIONAL | $22.50                 |
| **Compute (regular)**     | e2-medium, 2-3 instances                | $50.00                 |
| **Load Balancer**         | HTTPS LB + SSL cert                     | $18.25                 |
| **Cloud Armor**           | Basic protection                        | $2.00                  |
| **Networking**            | VPC, NAT, DNS                           | $5.00                  |
| **Storage**               | Artifact Registry                       | $1.00                  |
| **Monitoring**            | Enhanced logs + metrics                 | $2.00                  |
| **Backup & Recovery**     | Enhanced backup retention               | $3.00                  |
| **Total Production Base** | **$103.75/month**                       | **Before DAU scaling** |

## Daily Active Users (DAU) Scaling Analysis

### 📊 **Cost Components by DAU**

#### **Infrastructure Base Costs (Production)**

- **Cloud SQL f1-micro**: $22.50/month (REGIONAL HA, 20GB SSD)
- **Load Balancer**: $18.25/month (HTTPS LB + managed SSL certificates)
- **Cloud Armor**: $2.00/month (Basic DDoS protection + WAF rules)
- **VPC/Networking**: $5.00/month (NAT Gateway, DNS, firewall rules)
- **Storage/Registry**: $1.00/month (Artifact Registry for Docker images)
- **Base Infrastructure**: **$48.75/month**

#### **Variable Costs (Scale with DAU)**

- **Compute instances** (auto-scaling based on traffic)
- **Database scaling** (upgrade instance class for more connections)
- **Load Balancer requests** ($0.40 per million requests)
- **Network egress** ($0.15/GB for API responses)
- **Cloud Armor requests** ($0.50 per million rule evaluations)
- **Monitoring & observability** (logs, metrics, alerting)
- **Caching layer** (Redis Memory Store for session data)
- **CDN** (for static assets at scale)

### 🔢 **Production Cost Scenarios**

#### **1K DAU Scenario**

**Assumptions**: 10 requests/user/day, 100KB response avg

| Component                | Calculation             | Monthly Cost         |
| ------------------------ | ----------------------- | -------------------- |
| **Cloud SQL f1-micro**   | REGIONAL, 20GB SSD      | $22.50               |
| **Load Balancer (base)** | HTTPS LB + SSL cert     | $18.25               |
| **Cloud Armor**          | Basic protection        | $2.00                |
| **VPC/Networking**       | NAT, DNS, firewall      | $5.00                |
| **Storage/Registry**     | Artifact Registry       | $1.00                |
| **Compute**              | 2x e2-medium (baseline) | $50.00               |
| **LB Requests**          | 300K requests/month     | $0.12                |
| **Network Egress**       | 30GB/month              | $4.50                |
| **Cloud Armor Requests** | 300K evaluations        | $0.06                |
| **Database Scaling**     | f1-micro sufficient     | $0.00                |
| **Monitoring**           | Basic metrics           | $2.00                |
| **Total 1K DAU**         | **$105.43/month**       | **$0.11/user/month** |

#### **10K DAU Scenario**

**Assumptions**: 12 requests/user/day, 120KB response avg

| Component                | Calculation                 | Monthly Cost         |
| ------------------------ | --------------------------- | -------------------- |
| **Cloud SQL f1-micro**   | REGIONAL, 20GB SSD          | $22.50               |
| **Load Balancer (base)** | HTTPS LB + SSL cert         | $18.25               |
| **Cloud Armor**          | Basic protection            | $2.00                |
| **VPC/Networking**       | NAT, DNS, firewall          | $5.00                |
| **Storage/Registry**     | Artifact Registry           | $1.00                |
| **Compute**              | 4x e2-medium (scaled)       | $100.00              |
| **LB Requests**          | 3.6M requests/month         | $1.44                |
| **Network Egress**       | 432GB/month                 | $64.80               |
| **Cloud Armor Requests** | 3.6M evaluations            | $0.72                |
| **Database Scaling**     | Upgrade to db-custom-1-3840 | $45.00               |
| **Monitoring**           | Enhanced metrics            | $5.00                |
| **Redis Cache**          | Memory Store basic          | $15.00               |
| **Total 10K DAU**        | **$280.71/month**           | **$0.28/user/month** |

#### **100K DAU Scenario**

**Assumptions**: 15 requests/user/day, 100KB response avg (optimized)

| Component                | Calculation                  | Monthly Cost         |
| ------------------------ | ---------------------------- | -------------------- |
| **Cloud SQL**            | db-custom-4-15360 + replicas | $180.00              |
| **Load Balancer (base)** | HTTPS LB + SSL cert          | $18.25               |
| **Cloud Armor**          | Basic protection             | $2.00                |
| **VPC/Networking**       | NAT, DNS, firewall           | $5.00                |
| **Storage/Registry**     | Artifact Registry            | $1.00                |
| **Compute**              | 12x e2-standard-2 (scaled)   | $600.00              |
| **LB Requests**          | 45M requests/month           | $18.00               |
| **Network Egress**       | 4.5TB/month                  | $450.00              |
| **Cloud Armor Requests** | 45M evaluations              | $9.00                |
| **Monitoring**           | Advanced metrics + APM       | $25.00               |
| **Redis Cache**          | Memory Store standard        | $60.00               |
| **CDN**                  | Cloud CDN for static assets  | $30.00               |
| **Total 100K DAU**       | **$1,403.25/month**          | **$0.14/user/month** |

## Cost Optimization Strategies

### 💰 **Development/Staging Optimizations**

1. **Shared Infrastructure**

   - Single environment for dev + staging
   - Preemptible instances (70% savings)
   - Minimal backup retention
   - ZONAL availability

2. **Resource Sharing**

   - Shared Cloud SQL instance
   - Shared load balancer
   - Namespace-based separation

3. **Cost Controls**
   - Auto-shutdown during off-hours
   - Minimal monitoring retention
   - No redundancy requirements

### 🚀 **Production Optimizations**

1. **Right-sizing Strategy**

   ```
   1K DAU:   Start with f1-micro SQL + 2x e2-medium
   10K DAU:  Scale to custom-1-3840 SQL + 4x e2-medium
   100K DAU: Scale to custom-4-15360 SQL + 12x e2-standard-2
   ```

2. **Performance Scaling**

   - **Database**: Vertical scaling based on connections
   - **Compute**: Horizontal auto-scaling based on CPU
   - **Caching**: Redis Memory Store for session data
   - **CDN**: Cloud CDN for static assets at scale

3. **Cost per User Optimization**
   - 1K DAU: $0.11/user/month (higher overhead)
   - 10K DAU: $0.28/user/month (scaling costs)
   - 100K DAU: $0.14/user/month (economies of scale)

## Comparison: Containerized vs Cloud SQL

### 💾 **Containerized Database Approach**

| Environment        | Infrastructure            | Monthly Cost | Pros                  | Cons                              |
| ------------------ | ------------------------- | ------------ | --------------------- | --------------------------------- |
| **Dev/Staging**    | VM + Docker PostgreSQL    | $9.50        | Lowest cost, portable | Manual maintenance, no backup SLA |
| **Production 1K**  | VM + Docker PostgreSQL    | $52.00       | Simple architecture   | No HA, manual scaling             |
| **Production 10K** | Multiple VMs + PostgreSQL | $120.00      | Cost-effective        | Complex HA setup, ops overhead    |

### ☁️ **Cloud SQL Approach (Recommended)**

| Environment        | Infrastructure                | Monthly Cost | Pros                                 | Cons                  |
| ------------------ | ----------------------------- | ------------ | ------------------------------------ | --------------------- |
| **Dev/Staging**    | VM + Cloud SQL f1-micro       | $35.65       | Managed backups, easy                | Higher base cost      |
| **Production 1K**  | VM + Cloud SQL f1-micro       | $105.43      | HA available, point-in-time recovery | 2x cost increase      |
| **Production 10K** | Scaled VMs + Cloud SQL custom | $280.71      | Auto-scaling, enterprise features    | Requires optimization |

### 🏆 **Recommendation**: **Cloud SQL Default**

**Why Cloud SQL f1-micro as default:**

✅ **Operational Benefits**

- Automated backups and point-in-time recovery
- Automatic security patches and updates
- Built-in high availability option (REGIONAL)
- Performance monitoring and query insights
- Easy vertical scaling without downtime

✅ **Development Productivity**

- Consistent database environment across dev/staging/prod
- No database maintenance overhead
- Easy cloning for testing
- Built-in connection pooling

✅ **Total Cost of Ownership**

- Reduced operational overhead (saves developer time)
- Built-in disaster recovery capabilities
- Enterprise-grade security and compliance
- Predictable scaling costs

## Environment Setup Guide

### 🧪 **Development/Staging Setup**

```bash
# Set environment variables
export TF_VAR_environment_tier="dev-staging"
export TF_VAR_use_preemptible="true"
export TF_VAR_enable_cloud_sql="true"
export TF_VAR_enable_cloud_armor="true"

# Deploy shared infrastructure
terraform apply
```

### 🚀 **Production Setup**

```bash
# Set environment variables
export TF_VAR_environment_tier="production"
export TF_VAR_use_preemptible="false"
export TF_VAR_enable_cloud_sql="true"
export TF_VAR_enable_cloud_armor="true"

# Deploy production infrastructure
terraform apply
```

## Monitoring & Alerts

### 📊 **Cost Monitoring**

- Set billing alerts at 80% of monthly budget
- Monitor cost per DAU metrics
- Track resource utilization for right-sizing

### 🚨 **Performance Alerts**

- Database CPU > 80%
- Instance group scaling events
- Load balancer error rates > 1%
- Cloud Armor blocked request spikes

## Summary

| Scenario                | Monthly Cost | Cost/User | Recommendation                       |
| ----------------------- | ------------ | --------- | ------------------------------------ |
| **Dev/Staging Shared**  | $35.65       | N/A       | Preemptible VMs + Cloud SQL          |
| **Production 1K DAU**   | $105.43      | $0.11     | f1-micro SQL + 2x e2-medium          |
| **Production 10K DAU**  | $280.71      | $0.28     | Custom SQL + 4x e2-medium + Redis    |
| **Production 100K DAU** | $1,403.25    | $0.14     | Custom SQL + 12x e2-standard-2 + CDN |

The **Cloud SQL f1-micro + shared VM** approach provides the best balance of **operational simplicity**, **development productivity**, and **reasonable costs** for getting started, with clear scaling paths for growth.
