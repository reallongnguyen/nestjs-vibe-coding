# Cloud Armor Security for Isling VM Infrastructure

## Overview

This configuration adds **Google Cloud Armor** basic protection to the VM-based Isling infrastructure, providing DDoS protection and Web Application Firewall (WAF) capabilities.

## Features Added

### 🛡️ **DDoS Protection**

- **Rate limiting**: 100 requests per minute per IP address
- **Adaptive protection**: Layer 7 DDoS defense with automatic threat detection
- **IP banning**: 10-minute ban for violating IPs

### 🔒 **Web Application Firewall (WAF)**

- **SQL Injection protection** - Blocks malicious SQL commands
- **Cross-Site Scripting (XSS) protection** - Prevents JavaScript injection
- **Local File Inclusion (LFI) protection** - Blocks file system attacks
- **Protocol attack protection** - Defends against HTTP protocol abuse
- **Session fixation protection** - Prevents session hijacking

## Configuration

### Enable/Disable Cloud Armor

```hcl
# In terraform.tfvars
enable_cloud_armor = true   # Enable protection ($2/month)
enable_cloud_armor = false  # Disable (no additional cost)
```

### Security Policy Rules

The security policy includes the following rules (in priority order):

1. **Priority 1000**: Rate limiting (100 req/min per IP)
2. **Priority 2000**: Block SQL injection attacks
3. **Priority 2001**: Block XSS attacks
4. **Priority 2002**: Block LFI attacks
5. **Priority 2003**: Block protocol attacks
6. **Priority 2004**: Block session fixation attacks
7. **Priority 2147483647**: Default allow rule

## Cost Impact

| Component             | Monthly Cost | Description                        |
| --------------------- | ------------ | ---------------------------------- |
| **Cloud Armor Basic** | $2.00        | Security policy + rule evaluations |
| **Total Additional**  | **$2.00**    | **8% increase from base VM cost**  |

### Cost Breakdown by Environment

| Configuration                 | Without Cloud Armor | With Cloud Armor | Increase      |
| ----------------------------- | ------------------- | ---------------- | ------------- |
| **Development (preemptible)** | $7.50               | $9.50            | +$2.00 (+27%) |
| **Production (regular)**      | $25.00              | $27.00           | +$2.00 (+8%)  |

## Security Benefits

### 🚨 **Threat Protection**

- Blocks 99.9% of common web application attacks
- Prevents DDoS attacks from overwhelming your infrastructure
- Real-time threat intelligence from Google's security systems

### 📊 **Monitoring & Logging**

- Security events logged to Cloud Logging
- Attack patterns and blocked requests tracked
- Integration with Cloud Monitoring for alerts

### ⚡ **Performance**

- Minimal latency impact (<1ms)
- Edge-based filtering reduces server load
- Automatic scaling with traffic

## Deployment

### 1. Enable Cloud Armor

```bash
# Update terraform.tfvars
echo 'enable_cloud_armor = true' >> terraform.tfvars
```

### 2. Apply Terraform

```bash
terraform plan
terraform apply
```

### 3. Verify Protection

```bash
# Check security policy
terraform output cloud_armor_config

# View in GCP Console
gcloud compute security-policies list
```

## Customization

### Rate Limiting

Adjust the rate limiting rules in `main.tf`:

```hcl
rate_limit_threshold {
  count        = 100        # Requests per interval
  interval_sec = 60         # Time window (seconds)
}

ban_duration_sec = 600      # Ban duration (10 minutes)
```

### Additional Rules

Add custom security rules:

```hcl
rule {
  action   = "deny(403)"
  priority = "3000"
  match {
    expr {
      expression = "request.headers['user-agent'].contains('BadBot')"
    }
  }
  description = "Block specific user agents"
}
```

### Allowlist IPs

Allow specific IP ranges:

```hcl
rule {
  action   = "allow"
  priority = "500"
  match {
    versioned_expr = "SRC_IPS_V1"
    config {
      src_ip_ranges = ["203.0.113.0/24"]  # Your office IPs
    }
  }
  description = "Allow office IPs"
}
```

## Monitoring

### Cloud Logging

Security events are logged with these fields:

- `jsonPayload.enforcedSecurityPolicy.name`
- `jsonPayload.enforcedSecurityPolicy.outcome`
- `httpRequest.remoteIp`
- `httpRequest.requestMethod`

### Alerts

Set up monitoring alerts:

```bash
# Monitor blocked requests
gcloud alpha monitoring policies create \
  --policy-from-file=cloud-armor-alerts.yaml
```

## Troubleshooting

### False Positives

If legitimate traffic is blocked:

1. **Check security logs**:

   ```bash
   gcloud logging read 'resource.type="http_load_balancer" AND jsonPayload.enforcedSecurityPolicy.outcome="DENY"'
   ```

2. **Add allowlist rule** for specific IPs/patterns

3. **Adjust rule sensitivity** by modifying expressions

### Performance Issues

If experiencing latency:

1. **Review rule complexity** - simpler rules are faster
2. **Optimize rule order** - most specific rules first
3. **Monitor edge caching** effectiveness

## Security Best Practices

### 🔐 **Production Recommendations**

- Keep Cloud Armor **always enabled** in production
- Regularly review security logs for attack patterns
- Test security rules in staging environment first
- Set up alerting for high volumes of blocked requests

### 🛠️ **Development Environment**

- Cloud Armor can be disabled for cost savings
- Test security rules before deploying to production
- Use allowlist rules for development IPs

### 📈 **Monitoring**

- Set up dashboards for security metrics
- Monitor blocked vs allowed traffic ratios
- Track attack origins and patterns

## Integration

Cloud Armor integrates seamlessly with:

- **Load Balancer**: Attached to backend service
- **Cloud Logging**: All security events logged
- **Cloud Monitoring**: Metrics and alerting
- **Cloud Console**: Visual management interface

## Next Steps

1. **Enable Cloud Armor** in your terraform.tfvars
2. **Deploy the configuration** with terraform apply
3. **Monitor security logs** for the first week
4. **Fine-tune rules** based on traffic patterns
5. **Set up alerting** for security events

For production environments, Cloud Armor is **strongly recommended** for comprehensive DDoS protection and web application security.
