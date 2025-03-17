# Gorse Deployment Guide

## Overview

This guide outlines the deployment process for the Gorse recommendation system, including setup, configuration, and maintenance procedures.

## Prerequisites

1. Docker and Docker Compose
2. PostgreSQL 13+
3. Redis 6+
4. Prometheus and Grafana
5. Minimum System Requirements:
   - CPU: 4 cores
   - RAM: 8GB
   - Storage: 50GB SSD

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd base-api-service
```

### 2. Environment Setup

Create `.env` file:

```bash
# Gorse Configuration
GORSE_URL=http://gorse.docker.localhost
GORSE_API_KEY=your-api-key
GORSE_ADMIN_PASS=your-admin-password

# PostgreSQL Configuration
GORSE_POSTGRES_USER=gorse
GORSE_POSTGRES_PASSWORD=your-db-password
GORSE_POSTGRES_DB=gorse

# Redis Configuration
GORSE_REDIS_PASSWORD=your-redis-password
```

### 3. Database Initialization

```bash
# Initialize PostgreSQL schema
docker-compose -f docker-compose.gorse.yml up -d gorse-postgres
docker exec -i gorse-postgres psql -U ${GORSE_POSTGRES_USER} ${GORSE_POSTGRES_DB} < infra/docker/gorse/init.sql
```

### 4. Start Services

```bash
# Start all services
docker-compose -f docker-compose.gorse.yml up -d

# Verify services are running
docker-compose -f docker-compose.gorse.yml ps
```

### 5. Health Check

```bash
# Check master node health
curl -H "X-API-Key: ${GORSE_API_KEY}" http://localhost:8088/api/health/ready

# Check worker nodes health
curl -H "X-API-Key: ${GORSE_API_KEY}" http://localhost:8089/api/health/ready
curl -H "X-API-Key: ${GORSE_API_KEY}" http://localhost:8090/api/health/ready
```

## Configuration

### 1. Gorse Configuration

Edit `infra/docker/gorse/config.toml`:

```toml
[master]
port = 8086
http_port = 8088
n_jobs = 4

[server]
api_key = "${GORSE_API_KEY}"
default_n = 10
cache_expire = "10s"

[recommend]
cache_size = 100
cache_expire = "72h"

[recommend.collaborative]
model_fit_period = "60m"
enable_index = true
```

### 2. Monitoring Setup

1. Configure Prometheus targets:

   ```yaml
   - job_name: 'gorse'
     static_configs:
       - targets:
         - 'gorse-master:9090'
         - 'gorse-worker-1:9091'
         - 'gorse-worker-2:9092'
   ```

2. Import Grafana dashboard:
   - Navigate to Grafana
   - Import dashboard from `infra/docker/grafana/dashboards/gorse.json`

### 3. Backup Configuration

Configure backup retention and schedule:

```bash
# Edit backup script configuration
vim infra/docker/gorse/backup.sh

# Add to crontab
0 2 * * * /path/to/infra/docker/gorse/backup.sh
```

## Maintenance

### 1. Regular Maintenance

```bash
# Run health checks
./test/failover/gorse-failover-test.sh

# Run load tests
k6 run test/load/gorse-load-test.js

# Verify metrics
curl -s http://localhost:9090/api/v1/query?query=gorse_health_status
```

### 2. Backup and Recovery

```bash
# Manual backup
./infra/docker/gorse/backup.sh

# Restore from backup
# PostgreSQL
gunzip -c /var/backups/gorse/gorse_postgres_*.sql.gz | \
  docker exec -i gorse-postgres psql -U ${GORSE_POSTGRES_USER} ${GORSE_POSTGRES_DB}

# Redis
docker cp /var/backups/gorse/gorse_redis_*.rdb gorse-redis:/data/dump.rdb
docker restart gorse-redis
```

### 3. Scaling

1. Add worker node:

   ```yaml
   gorse-worker-3:
     image: zhenghaoz/gorse-worker
     restart: unless-stopped
     ports:
       - "8091:8089"
       - "9093:9091"
     environment:
       GORSE_MASTER_ADDRESS: "gorse-master:8088"
       GORSE_CACHE_STORE: redis://redis:6379
     volumes:
       - gorse-worker-3-data:/var/lib/gorse
   ```

2. Update master configuration:

   ```toml
   [master]
   n_jobs = 6  # Increase job count
   ```

## Troubleshooting

### 1. High Latency

```bash
# Check system resources
docker stats gorse-master gorse-worker-1 gorse-worker-2

# Check cache performance
redis-cli -h gorse-redis info stats

# Check database performance
docker exec -i gorse-postgres psql -U ${GORSE_POSTGRES_USER} ${GORSE_POSTGRES_DB} \
  -c "SELECT * FROM pg_stat_activity WHERE datname = 'gorse';"
```

### 2. Sync Issues

```bash
# Check sync status
curl -H "X-API-Key: ${GORSE_API_KEY}" http://localhost:8088/api/sync/status

# Check sync logs
docker logs gorse-master | grep "sync"

# Verify data consistency
./scripts/verify-sync.sh
```

### 3. Cache Issues

```bash
# Check Redis memory
redis-cli -h gorse-redis info memory

# Monitor operations
redis-cli -h gorse-redis monitor

# Clear cache if needed
redis-cli -h gorse-redis flushdb
```

## Security

### 1. API Security

- Use strong API keys
- Enable SSL/TLS
- Configure proper CORS settings
- Implement rate limiting

### 2. Network Security

- Use internal Docker network
- Restrict port access
- Enable firewall rules
- Monitor access logs

### 3. Data Security

- Regular backups
- Encrypted connections
- Access control
- Audit logging

## Monitoring

### 1. Metrics to Monitor

- System health status
- API latency
- Cache hit rates
- Resource usage
- Recommendation quality
- User engagement

### 2. Alert Thresholds

- Error rate > 1%
- Latency > 200ms
- Cache hit rate < 90%
- CPU usage > 80%
- Memory usage > 80%

### 3. Logging

- Application logs
- Access logs
- Error logs
- Audit logs

## Performance Tuning

### 1. Cache Optimization

- Adjust cache size
- Set appropriate TTL
- Monitor hit rates
- Configure eviction policy

### 2. Database Optimization

- Index optimization
- Query optimization
- Connection pooling
- Regular maintenance

### 3. Worker Optimization

- Adjust worker count
- Configure batch size
- Optimize job scheduling
- Monitor resource usage
