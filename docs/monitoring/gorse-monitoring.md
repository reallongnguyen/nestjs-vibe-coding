# Gorse Monitoring Guide

## Overview

This document outlines the monitoring setup for the Gorse recommendation system, including metrics, alerts, dashboards, and troubleshooting procedures.

## Metrics

### System Metrics

1. Health Status
   - `gorse_health_status`: Overall system health (1 = healthy, 0 = unhealthy)
   - `gorse_cache_store_connected`: Cache store connectivity (1 = connected, 0 = disconnected)
   - `gorse_data_store_connected`: Data store connectivity (1 = connected, 0 = disconnected)

2. Performance Metrics
   - `gorse_request_duration_seconds`: API request latency (histogram)
   - `gorse_recommendation_duration_seconds`: Recommendation generation time (histogram)
   - `gorse_batch_processing_duration_seconds`: Batch processing time (histogram)

3. Resource Usage
   - `gorse_cpu_usage_percent`: CPU usage per worker
   - `gorse_memory_usage_bytes`: Memory usage per worker
   - `gorse_goroutines`: Number of active goroutines

### Business Metrics

1. Recommendation Quality
   - `gorse_recommendation_relevance_score`: Relevance score (0-1)
   - `gorse_recommendation_diversity_score`: Diversity score (0-1)
   - `gorse_user_engagement_rate`: User engagement with recommendations

2. Data Synchronization
   - `gorse_sync_delay_seconds`: Time between event and sync
   - `gorse_sync_success_rate`: Successful sync operations rate
   - `gorse_sync_batch_size`: Number of items per sync batch

3. Cache Performance
   - `gorse_cache_hit_rate`: Cache hit rate
   - `gorse_cache_miss_rate`: Cache miss rate
   - `gorse_cache_eviction_rate`: Cache eviction rate

## Alert Rules

### Critical Alerts

1. System Health

   ```yaml
   - alert: GorseSystemDown
     expr: gorse_health_status == 0
     for: 5m
     labels:
       severity: critical
     annotations:
       summary: "Gorse system is down"
       description: "System health check has failed for 5 minutes"
   ```

2. High Error Rate

   ```yaml
   - alert: GorseHighErrorRate
     expr: rate(gorse_error_count[5m]) > 0.01
     for: 5m
     labels:
       severity: critical
     annotations:
       summary: "High error rate in Gorse"
       description: "Error rate exceeds 1% for 5 minutes"
   ```

3. High Latency

   ```yaml
   - alert: GorseHighLatency
     expr: histogram_quantile(0.95, rate(gorse_request_duration_seconds_bucket[5m])) > 0.2
     for: 5m
     labels:
       severity: warning
     annotations:
       summary: "High latency in Gorse"
       description: "95th percentile latency exceeds 200ms"
   ```

### Warning Alerts

1. Cache Performance

   ```yaml
   - alert: GorseLowCacheHitRate
     expr: rate(gorse_cache_hit[5m]) / (rate(gorse_cache_hit[5m]) + rate(gorse_cache_miss[5m])) < 0.9
     for: 5m
     labels:
       severity: warning
     annotations:
       summary: "Low cache hit rate"
       description: "Cache hit rate below 90%"
   ```

2. Sync Delay

   ```yaml
   - alert: GorseHighSyncDelay
     expr: gorse_sync_delay_seconds > 30
     for: 5m
     labels:
       severity: warning
     annotations:
       summary: "High sync delay"
       description: "Sync delay exceeds 30 seconds"
   ```

## Grafana Dashboards

### System Overview Dashboard

1. Health Status Panel
   - System health status
   - Component connectivity
   - Error rates

2. Performance Panel
   - Request latency
   - Recommendation generation time
   - Cache hit rates

3. Resource Usage Panel
   - CPU usage per worker
   - Memory usage per worker
   - Network I/O

### Recommendation Quality Dashboard

1. Quality Metrics Panel
   - Relevance scores
   - Diversity scores
   - User engagement rates

2. Cache Performance Panel
   - Hit rates
   - Miss rates
   - Eviction rates

3. Sync Status Panel
   - Sync delays
   - Success rates
   - Batch sizes

## Troubleshooting Procedures

### High Latency

1. Check system resources:

   ```bash
   docker stats gorse-master gorse-worker-1 gorse-worker-2
   ```

2. Check cache performance:

   ```bash
   redis-cli -h gorse-redis info stats
   ```

3. Check database performance:

   ```sql
   SELECT * FROM pg_stat_activity WHERE datname = 'gorse';
   ```

### Sync Issues

1. Check sync status:

   ```bash
   curl -H "X-API-Key: ${GORSE_API_KEY}" http://localhost:8088/api/sync/status
   ```

2. Check sync logs:

   ```bash
   docker logs gorse-master | grep "sync"
   ```

3. Verify data consistency:

   ```bash
   ./scripts/verify-sync.sh
   ```

### Cache Issues

1. Check Redis memory usage:

   ```bash
   redis-cli -h gorse-redis info memory
   ```

2. Monitor cache operations:

   ```bash
   redis-cli -h gorse-redis monitor
   ```

3. Clear cache if necessary:

   ```bash
   redis-cli -h gorse-redis flushdb
   ```

## Backup and Recovery

### Automated Backups

1. Database backup:

   ```bash
   ./infra/docker/gorse/backup.sh
   ```

2. Verify backup:

   ```bash
   ls -l /var/backups/gorse/
   ```

### Recovery Procedures

1. Restore database:

   ```bash
   gunzip -c /var/backups/gorse/gorse_postgres_*.sql.gz | docker exec -i gorse-postgres psql -U ${GORSE_POSTGRES_USER} ${GORSE_POSTGRES_DB}
   ```

2. Restore Redis:

   ```bash
   docker cp /var/backups/gorse/gorse_redis_*.rdb gorse-redis:/data/dump.rdb
   docker restart gorse-redis
   ```

## Maintenance Procedures

### Regular Maintenance

1. Check system health:

   ```bash
   ./test/failover/gorse-failover-test.sh
   ```

2. Run load tests:

   ```bash
   k6 run test/load/gorse-load-test.js
   ```

3. Verify metrics:

   ```bash
   curl -s http://localhost:9090/api/v1/query?query=gorse_health_status
   ```

### Emergency Procedures

1. Stop all components:

   ```bash
   docker-compose -f docker-compose.gorse.yml down
   ```

2. Clear all data:

   ```bash
   docker volume rm gorse-master-data gorse-worker-1-data gorse-worker-2-data
   ```

3. Rebuild and restart:

   ```bash
   docker-compose -f docker-compose.gorse.yml up -d --build
   ```
