# DNS Setup Guide: Domain Delegation for Isling Backend Services

This guide explains how to connect your backend subdomains to Google Cloud DNS without affecting your existing DNS configuration.

## 🎯 **Overview**

**Goal**: Delegate only backend subdomains to GCP while keeping existing DNS intact.

**Strategy**: Use DNS delegation (NS records) to route specific subdomains to Cloud DNS.

## 📋 **Architecture**

### **Current Setup**

- **Domain Provider DNS**: Manages `isling.me` and existing records
- **Vercel**: Handles `dev-app.isling.me` (frontend)
- **GCP Cloud DNS**: Will manage backend subdomains only

### **Backend Subdomains to Delegate**

- `dev-api.isling.me` → API service
- `dev-auth.isling.me` → Authentication service
- `dev-mqtt.isling.me` → MQTT service
- `dev-traefik.isling.me` → Traefik dashboard

## 🚀 **Step-by-Step Implementation**

### **Step 1: Deploy Infrastructure**

```bash
cd infrastructure/isling-docker/terraform
terraform init
terraform plan
terraform apply
```

### **Step 2: Get GCP Nameservers**

```bash
terraform output dns_name_servers
```

**Example Output**:

```
[
  "ns-cloud-a1.googledomains.com.",
  "ns-cloud-a2.googledomains.com.",
  "ns-cloud-a3.googledomains.com.",
  "ns-cloud-a4.googledomains.com."
]
```

### **Step 3: Configure DNS Delegation**

#### **Method A: NS Record Delegation (Recommended)**

In your domain provider's DNS panel, add NS records for each backend subdomain:

```dns
# Backend API Service
Type: NS    Name: dev-api.isling.me      Value: ns-cloud-a1.googledomains.com.
Type: NS    Name: dev-api.isling.me      Value: ns-cloud-a2.googledomains.com.
Type: NS    Name: dev-api.isling.me      Value: ns-cloud-a3.googledomains.com.
Type: NS    Name: dev-api.isling.me      Value: ns-cloud-a4.googledomains.com.

# Authentication Service
Type: NS    Name: dev-auth.isling.me     Value: ns-cloud-a1.googledomains.com.
Type: NS    Name: dev-auth.isling.me     Value: ns-cloud-a2.googledomains.com.
Type: NS    Name: dev-auth.isling.me     Value: ns-cloud-a3.googledomains.com.
Type: NS    Name: dev-auth.isling.me     Value: ns-cloud-a4.googledomains.com.

# MQTT Service
Type: NS    Name: dev-mqtt.isling.me     Value: ns-cloud-a1.googledomains.com.
Type: NS    Name: dev-mqtt.isling.me     Value: ns-cloud-a2.googledomains.com.
Type: NS    Name: dev-mqtt.isling.me     Value: ns-cloud-a3.googledomains.com.
Type: NS    Name: dev-mqtt.isling.me     Value: ns-cloud-a4.googledomains.com.

# Traefik Dashboard
Type: NS    Name: dev-traefik.isling.me  Value: ns-cloud-a1.googledomains.com.
Type: NS    Name: dev-traefik.isling.me  Value: ns-cloud-a2.googledomains.com.
Type: NS    Name: dev-traefik.isling.me  Value: ns-cloud-a3.googledomains.com.
Type: NS    Name: dev-traefik.isling.me  Value: ns-cloud-a4.googledomains.com.
```

#### **Method B: Direct A Records (Alternative)**

If your DNS provider doesn't support multiple NS records, use A records:

```bash
# Get the load balancer IP
terraform output load_balancer_ip
```

```dns
Type: A     Name: dev-api.isling.me      Value: [LOAD_BALANCER_IP]
Type: A     Name: dev-auth.isling.me     Value: [LOAD_BALANCER_IP]
Type: A     Name: dev-mqtt.isling.me     Value: [LOAD_BALANCER_IP]
Type: A     Name: dev-traefik.isling.me  Value: [LOAD_BALANCER_IP]
```

### **Step 4: Wait for DNS Propagation**

- **NS Records**: 1-24 hours
- **A Records**: 5-30 minutes

## 🧪 **Testing & Validation**

### **Test DNS Resolution**

```bash
# Test backend subdomains (should show GCP IPs)
dig dev-api.isling.me
dig dev-auth.isling.me
dig dev-mqtt.isling.me
dig dev-traefik.isling.me

# Test existing domains (should show existing setup)
dig dev-app.isling.me     # Should show Vercel IP
dig isling.me             # Should show your existing setup
```

### **Test HTTPS Certificates**

```bash
# Test SSL certificates
curl -I https://dev-api.isling.me
curl -I https://dev-auth.isling.me
curl -I https://dev-mqtt.isling.me
curl -I https://dev-traefik.isling.me
```

### **Expected Results**

- ✅ Backend subdomains resolve to GCP load balancer IP
- ✅ SSL certificates are valid (Google-managed)
- ✅ Existing domains unchanged
- ✅ Frontend (Vercel) still works

## 🔍 **DNS Resolution Flow**

### **For Backend Subdomains** (e.g., `dev-api.isling.me`)

1. DNS query for `dev-api.isling.me`
2. Root nameserver → `.me` nameserver → `isling.me` nameserver
3. Finds NS record pointing to GCP nameservers
4. Queries GCP Cloud DNS
5. Returns GCP load balancer IP
6. Client connects to GCP infrastructure

### **For Frontend/Existing** (e.g., `dev-app.isling.me`)

1. DNS query for `dev-app.isling.me`
2. Root nameserver → `.me` nameserver → `isling.me` nameserver
3. Finds A record in your provider's DNS
4. Returns Vercel IP (or existing setup)
5. Client connects to Vercel

## ✅ **Benefits of This Approach**

- **🔒 Non-disruptive**: Existing DNS configuration remains untouched
- **🎯 Selective control**: Only backend services use Cloud DNS
- **⚡ Performance**: DNS queries go directly to appropriate nameservers
- **🔄 Flexibility**: Easy to add/remove backend services
- **💰 Cost-effective**: Only pay for Cloud DNS resources you actually use

## 🚨 **Important Notes**

### **DNS Provider Compatibility**

- **Supports NS delegation**: Most modern DNS providers (Cloudflare, Route53, etc.)
- **Limited NS support**: Some basic providers may only allow one NS record per name
- **Fallback option**: Use direct A records if NS delegation isn't supported

### **SSL Certificate Management**

- Google-managed certificates automatically handle all backend subdomains
- Certificates may take 10-60 minutes to provision after DNS is configured
- HTTPS redirects are automatically configured

### **Monitoring & Troubleshooting**

```bash
# Check DNS propagation
nslookup dev-api.isling.me 8.8.8.8

# Check SSL certificate status
openssl s_client -connect dev-api.isling.me:443 -servername dev-api.isling.me

# Check GCP resources
gcloud compute addresses list
gcloud compute ssl-certificates list
```

## 🔄 **Updating Configuration**

### **Adding New Backend Services**

1. Add domain variable to `variables.tf`
2. Add domain to SSL certificate in `main.tf`
3. Create DNS record in `main.tf`
4. Apply terraform: `terraform apply`
5. Add NS record in your DNS provider

### **Changing Load Balancer IP**

- **NS delegation**: Automatic (DNS points to nameservers)
- **A records**: Manual update required in DNS provider

## 📞 **Support & Troubleshooting**

### **Common Issues**

- **DNS not resolving**: Check NS records in DNS provider
- **SSL certificate issues**: Verify domain ownership and DNS configuration
- **Propagation delays**: Wait up to 24 hours for full propagation

### **Verification Commands**

```bash
# Infrastructure status
terraform output backend_service_urls
terraform output dns_name_servers

# DNS debugging
dig +trace dev-api.isling.me
nslookup -type=NS dev-api.isling.me
```

### **Contact**

For infrastructure issues, contact the development team or create a ticket in the project management system.

---

**Last Updated**: [Current Date]  
**Terraform Version**: >= 1.0  
**GCP Region**: asia-northeast1
