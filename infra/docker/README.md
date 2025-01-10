# Docker Deployment Guide

This guide provides instructions for deploying the system using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git
- Access to the required repositories

## Installation Steps

### 1. Clone Service Repositories

Clone the required service repositories:

```bash
# Clone API Service
rm -rf api-service \
&& git clone https://github.com/reallongnguyen/base-api-service.git \
&& mv base-api-service api-service
```

### 2. Configure Environment Variables

1. Create `.env` files for each service following their respective documentation:
   - [API Service Configuration Guide](https://github.com/reallongnguyen/base-api-service/blob/main/README.md)

2. Ensure all required environment variables are properly set before proceeding.

### 3. Deploy Services

Launch the entire system using Docker Compose:

```bash
docker compose up -d
```

The `-d` flag runs the containers in detached mode (background).

## Useful Commands

```bash
# View running containers
docker compose ps

# View container logs
docker compose logs -f [service-name]

# Stop all services
docker compose down

# Rebuild and restart services
docker compose up -d --build
```

## Troubleshooting

If you encounter any issues:

1. Check if all required ports are available
2. Verify environment variables are correctly set
3. Ensure all required services are running (`docker compose ps`)
4. Review service logs for errors (`docker compose logs`)

## Additional Resources

For more detailed information about individual services, refer to their respective documentation:

- [API Service Documentation](https://github.com/reallongnguyen/base-api-service/blob/main/README.md)
