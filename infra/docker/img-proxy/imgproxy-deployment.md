# imgproxy Deployment Guide

## Overview

This document describes the deployment process for the imgproxy service, which handles image processing and optimization in our infrastructure.

## Prerequisites

1. Docker and Docker Compose installed
2. Access to Google Cloud Storage
3. Environment variables configured
4. Network access to required services

## Environment Variables

Configure the following environment variables in `infra/docker/.env`:

```env
# imgproxy Configuration
IMGPROXY_HOST=img.docker.localhost
IMGPROXY_KEY=your-secure-key
IMGPROXY_SALT=your-secure-salt
GCS_KEY_JSON=base64-encoded-service-account-key

# Optional Configuration
IMGPROXY_MAX_SRC_RESOLUTION=50
IMGPROXY_MAX_ANIMATION_FRAMES=200
IMGPROXY_ALLOW_ORIGIN=*
IMGPROXY_ENFORCE_WEBP=true
IMGPROXY_ENFORCE_AVIF=true
IMGPROXY_ENABLE_WEBP_DETECTION=true
IMGPROXY_ENABLE_AVIF_DETECTION=true
IMGPROXY_ENABLE_CLIENT_HINTS=true
```

## Deployment Steps

1. **Prepare Environment**

   ```bash
   # Clone repository if not already done
   git clone <repository-url>
   cd base-api-service
   
   # Copy environment template
   cp infra/docker/.env.example infra/docker/.env
   
   # Configure environment variables
   nano infra/docker/.env
   ```

2. **Configure Google Cloud Storage**

   ```bash
   # Base64 encode your GCS service account key
   base64 -i path/to/service-account.json | tr -d '\n' > gcs-key.txt
   
   # Add the encoded key to .env
   IMGPROXY_GCS_KEY=$(cat gcs-key.txt)
   ```

3. **Start Services**

   ```bash
   # Start all services
   docker-compose -f infra/docker/docker-compose.yml up -d
   
   # Start only imgproxy and dependencies
   docker-compose -f infra/docker/docker-compose.yml up -d traefik-gateway imgproxy
   ```

4. **Verify Deployment**

   ```bash
   # Check service status
   docker-compose -f infra/docker/docker-compose.yml ps imgproxy
   
   # Check logs
   docker-compose -f infra/docker/docker-compose.yml logs -f imgproxy
   
   # Test health endpoint
   curl -f http://img.docker.localhost/health
   ```

## Resource Configuration

The service is configured with the following resource limits:

- Memory Limit: 1GB
- Memory Reservation: 512MB
- Rate Limiting: 100 req/s average, 50 burst

Adjust these values in `docker-compose.yml` based on your requirements:

```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

## Health Checks

The service includes built-in health checks:

- Endpoint: `/health`
- Interval: 30s
- Timeout: 10s
- Retries: 3

Monitor health status:

```bash
docker inspect --format "{{json .State.Health }}" imgproxy
```

## Security Configuration

1. **URL Signing**
   - Required for all image operations
   - Uses IMGPROXY_KEY and IMGPROXY_SALT
   - Example URL signing in TypeScript:

   ```typescript
   import { createHmac } from 'crypto';
   
   const signUrl = (path: string): string => {
     const key = Buffer.from(process.env.IMGPROXY_KEY!, 'hex');
     const salt = Buffer.from(process.env.IMGPROXY_SALT!, 'hex');
     const hmac = createHmac('sha256', key)
       .update(salt)
       .update(path)
       .digest('base64url');
     return `/${hmac}${path}`;
   };
   ```

2. **Rate Limiting**
   - Configured through Traefik
   - Average: 100 req/s
   - Burst: 50 req/s

## Monitoring

Basic monitoring is available through Docker:

```bash
# CPU and Memory Usage
docker stats imgproxy

# Logs
docker-compose -f infra/docker/docker-compose.yml logs -f imgproxy
```

For advanced monitoring, refer to INF-002 ticket for Grafana dashboard implementation.

## Troubleshooting

1. **Service Won't Start**
   - Check environment variables
   - Verify network connectivity
   - Check resource availability
   - Review Docker logs

2. **Health Check Failures**

   ```bash
   # Check service logs
   docker-compose -f infra/docker/docker-compose.yml logs -f imgproxy
   
   # Verify network connectivity
   curl -v http://img.docker.localhost/health
   ```

3. **Performance Issues**
   - Check resource usage
   - Review rate limiting configuration
   - Verify cache settings
   - Monitor GCS connectivity

4. **Image Processing Errors**
   - Verify GCS permissions
   - Check image format support
   - Review transformation parameters
   - Check source image size

## Maintenance

1. **Updating the Service**

   ```bash
   # Pull new image
   docker-compose -f infra/docker/docker-compose.yml pull imgproxy
   
   # Restart service
   docker-compose -f infra/docker/docker-compose.yml up -d imgproxy
   ```

2. **Backup Configuration**

   ```bash
   # Backup environment configuration
   cp infra/docker/.env infra/docker/.env.backup
   ```

3. **Log Rotation**
   - Handled by Docker's built-in log rotation
   - Configure in daemon.json if needed

## Support

For additional support:

1. Review service documentation at [imgproxy Documentation](https://docs.imgproxy.net/)
2. Check Docker logs for detailed error messages
3. Contact DevOps team for infrastructure-related issues
4. Submit issues through the project's issue tracker

## References

1. [imgproxy Documentation](https://docs.imgproxy.net/)
2. [Docker Documentation](https://docs.docker.com/)
3. [Traefik Documentation](https://doc.traefik.io/traefik/)
4. [Google Cloud Storage Documentation](https://cloud.google.com/storage/docs)
