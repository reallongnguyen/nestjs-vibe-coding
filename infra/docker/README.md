# Infrastructure Setup Guide

This guide explains how to set up the development infrastructure using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git
- Access to required repositories

## Setup Steps

### 1. Clone Required Repositories

```bash
rm -rf api-service \
&& git clone https://github.com/reallongnguyen/nestjs-vibe-coding \
&& mv nestjs-vibe-coding api-service
```

### 2. Configure Environment

Create a `.env` file in the `docker` directory:

```bash
cp .env.example .env
```

Update the following environment variables:

- `AUTH_SERVICE_POSTGRES_USER`: Database username for auth service
- `AUTH_SERVICE_POSTGRES_PASSWORD`: Database password for auth service
- `AUTH_SERVICE_JWT_SECRET`: JWT secret for auth service
- `API_SERVICE_POSTGRES_USER`: Database username for api service
- `API_SERVICE_POSTGRES_PASSWORD`: Database password for api service
- `API_SERVICE_GOOGLE_APPLICATION_CREDENTIALS`: Google application credentials for api service

### 3. Start Infrastructure Services

Launch the infrastructure stack:

```bash
docker compose up -d
```

This will start:

- Traefik API Gateway (port 80, 8080)
- Auth service
- API service
- Auth Postgres
- API Postgres
- API Redis
- API MQTT

### 4. Verify Services

Check if all services are running:

```bash
docker compose ps
```

## Service Access

- **Traefik Gateway**:
  - Dashboard: `http://traefik.docker.localhost:8080`
  - API Gateway: `http://traefik.docker.localhost`

- **Services via Traefik**:
  - Auth Service: `http://auth.docker.localhost`
  - API Service: `http://api.docker.localhost`

> **Note**: Traefik uses host-based routing to direct traffic to the appropriate service. When you access `auth.docker.localhost` or `api.docker.localhost`, Traefik examines the `Host` header and routes the request to the corresponding service.

## Useful Commands

```bash
# Stop all services
docker compose down

# View logs
docker compose logs -f [service-name]

# Restart a specific service
docker compose restart [service-name]

# Remove all data (volumes)
docker compose down -v
```

## Troubleshooting

1. **Port Conflicts**: Ensure no other services are using the required ports
2. **Permission Issues**: Check folder permissions for mounted volumes
3. **Connection Refused**: Verify services are running (`docker compose ps`)

For detailed logs:

```bash
docker compose logs -f
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
