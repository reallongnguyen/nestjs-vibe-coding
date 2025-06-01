# Infrastructure Setup Guide

This guide explains how to set up the development infrastructure using Docker, focusing on authentication services with Supabase GoTrue, email template API service, and monitoring capabilities.

## Directory Structure

```plaintext
infra/docker/
├── docker-compose.yml          # Main orchestration file
├── .gitignore                  # Git ignore rules
├── README.md                   # This documentation
├── auth-service/               # Auth service configurations
│   └── db/
│       └── auth.sql           # Database initialization script
├── grafana/                    # Grafana monitoring setup
│   ├── grafana.ini            # Grafana configuration
│   ├── dashboards/            # Pre-configured dashboards
│   │   ├── gorse.json
│   │   └── notification-dashboard.json
│   └── provisioning/          # Grafana provisioning configs
│       ├── dashboards/
│       │   └── dashboard.yml
│       └── datasources/
│           └── prometheus_ds.yml
├── prometheus/                 # Prometheus monitoring setup
│   ├── prometheus.yml         # Prometheus configuration
│   ├── gorse.rules.yml        # Gorse-specific monitoring rules
│   └── slos.rules.yml         # SLO monitoring rules
├── setup/                     # Setup scripts
│   └── setup-vm.sh           # VM setup automation script
├── terraform/                 # Infrastructure as Code
│   └── main.tf               # Terraform configuration
└── traefik-gateway/           # API Gateway configuration
    └── traefik.yaml          # Traefik configuration
```

## Recent Updates

### Docker Improvements ✅

- **Updated** Dockerfile to use **pnpm** instead of yarn
- **Optimized** build process with multi-stage builds
- **Enhanced** dependency management and caching

## Prerequisites

- Docker and Docker Compose installed
- Git
- Node.js 22+ (for local development)
- pnpm (for dependency management)

## Setup Steps

### 1. Configure Environment

Create a `.env` file in the `docker` directory with the following environment variables:

#### For Local Development (docker.localhost)

```bash
# Auth Service Configuration
AUTH_SERVICE_HOST=auth.docker.localhost
AUTH_SERVICE_POSTGRES_USER=supabase_auth_admin
AUTH_SERVICE_POSTGRES_PASSWORD=your_strong_password
AUTH_SERVICE_POSTGRES_DB=auth
AUTH_SERVICE_JWT_SECRET=your_jwt_secret_key
AUTH_SERVICE_API_EXTERNAL_URL=http://auth.docker.localhost
AUTH_SERVICE_SITE_URL=http://localhost:3000
AUTH_SERVICE_ADDITIONAL_REDIRECT_URLS=http://localhost:3000
AUTH_SERVICE_DISABLE_SIGNUP=false
AUTH_SERVICE_JWT_EXPIRY=3600

# API Service Configuration
API_SERVICE_HOST=api.docker.localhost
API_SERVICE_APP_URL=http://api.docker.localhost

# MQTT Service Configuration
MQTT_SERVICE_HOST=mqtt.docker.localhost

# Traefik Dashboard Configuration
TRAEFIK_DASHBOARD_HOST=traefik.docker.localhost
```

#### For Development Environment (dev.isling.me)

```bash
# Auth Service Configuration
AUTH_SERVICE_HOST=auth.dev.isling.me
AUTH_SERVICE_POSTGRES_USER=supabase_auth_admin
AUTH_SERVICE_POSTGRES_PASSWORD=your_strong_password
AUTH_SERVICE_POSTGRES_DB=auth
AUTH_SERVICE_JWT_SECRET=your_jwt_secret_key_32_characters_long
AUTH_SERVICE_API_EXTERNAL_URL=https://auth.dev.isling.me
AUTH_SERVICE_SITE_URL=https://dev.isling.me
AUTH_SERVICE_ADDITIONAL_REDIRECT_URLS=https://dev.isling.me
AUTH_SERVICE_DISABLE_SIGNUP=false
AUTH_SERVICE_JWT_EXPIRY=3600

# API Service Configuration
API_SERVICE_HOST=api.dev.isling.me
API_SERVICE_APP_URL=https://api.dev.isling.me

# MQTT Service Configuration
MQTT_SERVICE_HOST=mqtt.dev.isling.me

# Traefik Dashboard Configuration
TRAEFIK_DASHBOARD_HOST=traefik.dev.isling.me
```

For complete configuration examples, see:

- `env.dev.example` - Development environment (dev.isling.me domains)
- Local development uses docker.localhost domains as shown above

### Additional Configuration

```bash
# Auth Service - Email Configuration with 1-hour expiration
AUTH_SERVICE_ENABLE_EMAIL_SIGNUP=true
AUTH_SERVICE_ENABLE_EMAIL_AUTOCONFIRM=true
AUTH_SERVICE_SMTP_ADMIN_EMAIL=admin@yourdomain.com
AUTH_SERVICE_SMTP_HOST=smtp.gmail.com
AUTH_SERVICE_SMTP_PORT=587
AUTH_SERVICE_SMTP_USER=your_email@gmail.com
AUTH_SERVICE_SMTP_PASS=your_app_password
AUTH_SERVICE_SMTP_SENDER_NAME=Your App Name
AUTH_SERVICE_MAILER_URLPATHS_INVITE=/auth/confirm
AUTH_SERVICE_MAILER_URLPATHS_CONFIRMATION=/auth/confirm
AUTH_SERVICE_MAILER_URLPATHS_RECOVERY=/auth/reset-password
AUTH_SERVICE_MAILER_URLPATHS_EMAIL_CHANGE=/auth/confirm

# Email Template Configuration (NEW)
GOTRUE_MAILER_OTP_EXP=3600  # 1 hour expiration for email confirmation links
GOTRUE_MAILER_TEMPLATES_INVITE=http://api.docker.localhost/v1/identity/email-template/userActivationInvite.html
GOTRUE_MAILER_TEMPLATES_CONFIRMATION=http://api.docker.localhost/v1/identity/email-template/userActivationInvite.html
GOTRUE_MAILER_TEMPLATES_RECOVERY=http://api.docker.localhost/v1/identity/email-template/userPasswordReset.html
GOTRUE_MAILER_TEMPLATES_MAGIC_LINK=http://api.docker.localhost/v1/identity/email-template/userMagicLink.html

# API Service - Additional Configuration
API_SERVICE_POSTGRES_USER=postgres
API_SERVICE_POSTGRES_PASSWORD=your_api_password
API_SERVICE_POSTGRES_DB=api_db
API_SERVICE_GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
API_SERVICE_APP_NAME=API Service

# Phone Authentication (Optional)
AUTH_SERVICE_ENABLE_PHONE_SIGNUP=false
AUTH_SERVICE_ENABLE_PHONE_AUTOCONFIRM=false
AUTH_SERVICE_ENABLE_ANONYMOUS_USERS=false
```

### 2. Build API Service Docker Image

Build the API service with pnpm:

```bash
# Navigate to API service directory
cd ../..

# Build Docker image with tag
docker build -t isling-api:latest .
```

### 3. Build Traefik Configuration

Generate the Traefik configuration from template and environment variables:

```bash
./scripts/create-traefik-config.sh .env
```

This will:

- Read `traefik.example.yaml` template file
- Load environment variables from `.env`
- Substitute `${AUTH_SERVICE_JWT_SECRET}` with actual JWT secret
- Generate final `traefik.yaml` configuration

> **🔒 Security Note**: The generated `traefik.yaml` contains real secrets and should never be committed to version control. Always use the template (`traefik.example.yaml`) for source control.

### 4. Start Infrastructure Services

Launch the infrastructure stack:

```bash
# Return to docker compose directory
cd ..

# Start all services
docker compose up -d
```

This will start:

- **Traefik API Gateway** (ports 80, 8080)
- **Auth Service** (Supabase GoTrue)
- **Auth PostgreSQL Database**
- **API Service** (NestJS with email templates)

### 5. Migrate api database

```bash
./scripts/db-migrate.sh status
./scripts/db-migrate.sh deploy
```

### 6. Verify Services

Check if all services are running:

```bash
docker compose ps
```

Test email template endpoints:

```bash
# Health check
curl http://api.docker.localhost/health

# Info
curl http://api.docker.localhost/info
```

## Service Access

### Local Development (docker.localhost)

- **Traefik Gateway**:

  - Dashboard: `http://traefik.docker.localhost:8080`
  - API Gateway: `http://traefik.docker.localhost`

- **Services via Traefik**:
  - Auth Service: `http://auth.docker.localhost`
  - API Service: `http://api.docker.localhost`
  - Email Templates: `http://email-template.docker.localhost/list`
  - **MQTT Service**:
    - Dashboard: `http://mqtt.docker.localhost` (EMQX Web Dashboard)
    - WebSocket: `ws://mqtt.docker.localhost/mqtt` (MQTT over WebSocket)
    - WebSocket SSL: `wss://mqtt.docker.localhost/mqtts` (MQTT over WebSocket SSL)
    - TCP: `mqtt.docker.localhost:1883` (Standard MQTT TCP)

> **Note**: For local development, add the following entries to your `/etc/hosts` file:
>
> ```
> 127.0.0.1 traefik.docker.localhost
> 127.0.0.1 auth.docker.localhost
> 127.0.0.1 api.docker.localhost
> 127.0.0.1 mqtt.docker.localhost
> ```

### Development Environment (dev.isling.me)

- **Traefik Gateway**:

  - Dashboard: `https://traefik.dev.isling.me:8080`
  - API Gateway: `https://traefik.dev.isling.me`

- **Services via Traefik**:
  - Auth Service: `https://auth.dev.isling.me`
  - API Service: `https://api.dev.isling.me`
  - Email Templates: `https://api.dev.isling.me/v1/identity/email-template/`
  - **MQTT Service**:
    - Dashboard: `https://mqtt.dev.isling.me` (EMQX Web Dashboard)
    - WebSocket: `wss://mqtt.dev.isling.me/mqtt` (MQTT over WebSocket SSL)
    - TCP: `mqtt.dev.isling.me:1883` (Standard MQTT TCP)

## MQTT Service Features

### EMQX MQTT Broker

The MQTT service provides a full-featured message broker with:

- **Web Dashboard**: Complete administration interface at `http://mqtt.docker.localhost`
- **Multiple Protocols**: Support for MQTT, WebSocket, and SSL connections
- **High Performance**: Capable of handling millions of concurrent connections
- **Clustering**: Ready for horizontal scaling
- **Security**: Built-in authentication and authorization

### MQTT Connection Examples

```bash
# Test MQTT connection using mosquitto client
mosquitto_pub -h mqtt.docker.localhost -p 1883 -t test/topic -m "Hello MQTT"
mosquitto_sub -h mqtt.docker.localhost -p 1883 -t test/topic

# Test WebSocket connection (can be used from browser)
# Connect to: ws://mqtt.docker.localhost/mqtt

# Access EMQX Dashboard for monitoring and configuration
curl http://mqtt.docker.localhost
```

### MQTT Integration in Applications

```javascript
// Example: Connect to MQTT from JavaScript
const mqtt = require('mqtt');
const client = mqtt.connect('ws://mqtt.docker.localhost/mqtt');

client.on('connect', function () {
  console.log('Connected to MQTT broker');
  client.subscribe('api-service/notifications');
});

client.on('message', function (topic, message) {
  console.log(`Received message on ${topic}: ${message.toString()}`);
});
```

## Email Template API Service

### Available Endpoints

| Endpoint                                    | Method | Description                |
| ------------------------------------------- | ------ | -------------------------- |
| `/v1/identity/email-template/health`        | GET    | Service health check       |
| `/v1/identity/email-template/list`          | GET    | List available templates   |
| `/v1/identity/email-template/:templateName` | GET    | Get specific template HTML |

### Available Templates

- `userActivationInvite.html` - User invitation/activation emails
- `userMagicLink.html` - Magic link login emails
- `userPasswordReset.html` - Password reset emails

### Security Features

- **Template Allowlisting**: Only predefined templates can be accessed
- **Directory Traversal Protection**: Prevents access to unauthorized files
- **Error Handling**: Consistent error responses with proper HTTP status codes
- **Logging**: Comprehensive request/response logging

### Template Customization

Templates support multi-language content (German, French, Dutch, English) and include:

- **Responsive Design**: Mobile-friendly layouts
- **Dark Mode Support**: Automatic dark mode detection
- **Company Branding**: API Service branding and styling
- **Security Information**: 1-hour expiration notices
- **Professional Styling**: Modern, clean email design

## Development Workflow

### 1. Local Development Setup

```bash
# Start infrastructure services
docker compose up -d traefik-gateway auth-postgres auth-service

# For API service development, run locally:
cd ../../api-service
pnpm install
pnpm run start:dev

# Or run API service in Docker:
docker compose up -d api-service
```

### 2. Email Template Development

```bash
# Edit templates in:
cd ../../api-service/src/identity/templates/email/

# Templates are automatically copied to dist/ during build
pnpm run build

# Restart API service to see changes:
docker compose restart api-service
```

### 3. Testing Authentication Flow

```bash
# Test auth service health
curl http://auth.docker.localhost/health

# Test email template service
curl http://api.docker.localhost/v1/identity/email-template/health

# Test specific template rendering
curl http://api.docker.localhost/v1/identity/email-template/userMagicLink.html
```

## Docker Build Guidelines

### API Service Dockerfile Features

- **Multi-stage Build**: Optimized for production
- **pnpm Integration**: Fast, efficient dependency management
- **Layer Caching**: Optimized for development workflow
- **Security**: Non-root user execution
- **Asset Copying**: Automatic template inclusion in build

### Build Commands

```bash
# Development build
docker build -t api-service-api:dev .

# Production build
docker build -t api-service-api:latest .

# Build with specific tag
docker build -t api-service-api:v1.0.0 .

# Build via docker-compose
docker compose build api-service
```

### Build Optimization Tips

1. **Use .dockerignore**: Exclude unnecessary files
2. **Layer Ordering**: Dependencies before source code
3. **pnpm Caching**: Leverage pnpm's efficient caching
4. **Multi-stage**: Separate build and runtime environments

## Optional Services

The following services are available but currently commented out in `docker-compose.yml`. Uncomment them as needed:

### Monitoring Stack

- **Grafana** (port 1300) - Monitoring dashboards
- **Prometheus** (port 9090) - Metrics collection
- **Node Exporter** - System metrics

To enable these services, uncomment the relevant sections in `docker-compose.yml` and ensure you have the required environment variables configured.

## Infrastructure Tools

### Terraform

Use the Terraform configuration in `terraform/main.tf` for cloud infrastructure deployment:

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### VM Setup

Use the setup script for automated VM configuration:

```bash
bash setup/setup-vm.sh
```

## Monitoring Configuration

### Grafana

- Pre-configured dashboards for Gorse and notifications
- Automatic Prometheus datasource provisioning
- Custom configuration in `grafana/grafana.ini`

### Prometheus

- Configured with Gorse-specific metrics
- SLO monitoring rules
- Node exporter integration ready

## Useful Commands

### Infrastructure Management

```bash
# Stop all services
docker compose down

# View logs for all services
docker compose logs -f

# View logs for specific service
docker compose logs -f auth-service
docker compose logs -f api-service

# Restart a specific service
docker compose restart auth-service
docker compose restart api-service

# Remove all data (volumes)
docker compose down -v

# Start only specific services
docker compose up -d traefik-gateway auth-postgres auth-service api-service
```

### Development Commands

```bash
# Rebuild and restart API service
docker compose build api-service
docker compose up -d api-service

# View API service logs in real-time
docker compose logs -f api-service

# Execute commands in running container
docker compose exec api-service pnpm run prisma:migrate
docker compose exec api-service pnpm run seed

# Rebuild Traefik configuration after environment changes
cd traefik-gateway && node build-config.js && cd ..
docker compose restart traefik-gateway

# View Traefik logs and configuration
docker compose logs -f traefik-gateway
curl http://localhost:8080/api/http/middlewares | jq
```

### Email Template Testing

```bash
# Test all email template endpoints
curl -s http://api.docker.localhost/v1/identity/email-template/health | jq
curl -s http://api.docker.localhost/v1/identity/email-template/list | jq

# Download templates for inspection
curl -o magic-link.html http://api.docker.localhost/v1/identity/email-template/userMagicLink.html
curl -o password-reset.html http://api.docker.localhost/v1/identity/email-template/userPasswordReset.html
curl -o activation.html http://api.docker.localhost/v1/identity/email-template/userActivationInvite.html
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure no other services are using ports 80, 8080
2. **Permission Issues**: Check folder permissions for mounted volumes
3. **Connection Refused**: Verify services are running (`docker compose ps`)
4. **Database Connection Issues**: Check PostgreSQL credentials and container networking
5. **Auth Service Issues**: Verify JWT secret and database configuration
6. **Email Template 404**: Ensure API service is running and templates are built
7. **pnpm Build Errors**: Check Node.js version and pnpm installation

### Email Template Specific Issues

```bash
# Check if email templates are accessible
curl -I http://api.docker.localhost/v1/identity/email-template/userMagicLink.html

# Verify template files exist in container
docker compose exec api-service ls -la /home/node/dist/identity/templates/email/

# Check API service health
curl http://api.docker.localhost/v1/identity/email-template/health
```

### Docker Build Issues

```bash
# Clear Docker cache for clean build
docker builder prune

# Build with no cache
docker build --no-cache -t api-service-api:latest .

# Check Docker build context
docker build -t api-service-api:debug --target builder .
```

For detailed logs:

```bash
docker compose logs -f [service-name]
```

## Security Best Practices

### Email Template Security

- **Template Allowlisting**: Only approved templates are served
- **Input Validation**: All parameters are validated
- **Error Handling**: No sensitive information in error responses
- **Access Control**: Templates served with appropriate headers

### Docker Security

- **Non-root User**: All services run as non-root users
- **Read-only Filesystems**: Where applicable
- **Secrets Management**: Use Docker secrets for sensitive data
- **Network Isolation**: Services communicate via Docker networks

### Authentication Security

- **Short Token Expiry**: 1-hour expiration for email links
- **Secure Headers**: HTTPS enforcement in production
- **CORS Configuration**: Restrictive CORS policies
- **Rate Limiting**: Prevent brute force attacks

## Additional Resources

- [Email Template API Migration Guide](../../tasks/EMAIL-TEMPLATE-API-MIGRATION.md)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [pnpm Documentation](https://pnpm.io/)
- [NestJS Documentation](https://nestjs.com/)

# API Service Infrastructure

This directory contains the Docker Compose infrastructure for the API Service application stack.

## 🏗️ Architecture

```
[Client] → [Traefik Gateway] → [API Service]
            ↓
    JWT Plugin (Direct Validation)
            ↓
[Auth Service] [Template Server] [Databases]
```

## 🚀 Services

- **Traefik Gateway**: Load balancer and reverse proxy with JWT validation
- **API Service**: Main application API
- **Auth Service**: Supabase Auth for authentication
- **Template Server**: Nginx server for email templates
- **Databases**: PostgreSQL and Redis for data storage
- **Message Queue**: MQTT broker for real-time communication

## 🔐 JWT Validation

We use the **traefik-jwt-plugin** for direct JWT validation, providing:

- ⚡ **50-80% latency reduction** vs ForwardAuth
- 🔒 **Cryptographic signature validation**
- 📋 **Automatic payload validation** (exp, sub, aud)
- 🏷️ **Header injection** for user context

### Configuration Status

✅ **Plugin Loaded**: JWT plugin successfully configured  
✅ **Routes Configured**: Public and protected routes working  
⚠️ **JWT Secret**: Needs your actual Supabase Auth secret

### Setup JWT Validation

1. **Get your JWT secret** from Supabase Auth:

   ```bash
   # From your Supabase dashboard: Settings → API → JWT Secret
   # Or check your auth service environment:
   docker exec isling-docker-auth-service-1 env | grep JWT_SECRET
   ```

2. **Update the configuration** in `traefik-gateway/traefik.yaml`:

   ```yaml
   jwt-auth:
     plugin:
       jwt:
         Keys:
           - 'your_actual_jwt_secret_here'
   ```

3. **Restart Traefik**:

   ```bash
   docker compose restart traefik-gateway
   ```

4. **Test the setup**:

   ```bash
   ./test-jwt-plugin.sh
   ```

For detailed setup instructions, see [JWT-PLUGIN-SETUP.md](./JWT-PLUGIN-SETUP.md).

## 🔗 Route Configuration

### Public Routes (No JWT required)

- `GET /health` - Health check
- `GET /metrics` - Metrics endpoint
- `GET /v1/identity/email-template/*` - Email templates

### Protected Routes (JWT required)

- `GET /v1/*` - All other API endpoints
- Automatic header injection:
  - `X-Auth-Id`: User ID from JWT `sub` claim

## 🚀 Quick Start

1. **Clone and navigate**:

   ```bash
   cd infrastructure/isling-docker
   ```

2. **Set up environment** (copy from env.example):

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start services**:

   ```bash
   docker compose up -d
   ```

4. **Configure JWT secret** (see setup section above)

5. **Verify setup**:

   ```bash
   # Check all services are running
   docker compose ps

   # Test public endpoint
   curl http://api.docker.localhost/health

   # Test protected endpoint (should return 401/403)
   curl http://api.docker.localhost/v1/profile
   ```

## 🧪 Testing

### Manual Testing

```bash
# Test public endpoints
curl http://api.docker.localhost/health
curl http://api.docker.localhost/metrics

# Test protected endpoints without JWT (should fail)
curl http://api.docker.localhost/v1/profile

# Test with invalid JWT (should fail)
curl -H "Authorization: Bearer invalid_token" \
  http://api.docker.localhost/v1/profile
```

### Automated Testing

```bash
# Run the JWT plugin test suite
./test-jwt-plugin.sh

# Check service health
./health-check.sh
```

## 📊 Monitoring

### Traefik Dashboard

- **URL**: <http://localhost:8080>
- **Routers**: View configured routes and middlewares
- **Services**: Monitor service health and load balancing

### Service Logs

```bash
# Traefik logs
docker logs isling-docker-traefik-gateway-1

# API service logs
docker logs isling-docker-api-service-1

# Auth service logs
docker logs isling-docker-auth-service-1
```

### Performance Monitoring

```bash
# Test latency improvements
time curl http://api.docker.localhost/health
time curl -H "Authorization: Bearer $TOKEN" \
  http://api.docker.localhost/v1/profile
```

## 🔧 Configuration Files

- `docker-compose.yml` - Service definitions and networking
- `traefik-gateway/traefik.yaml` - Traefik configuration with JWT plugin
- `.env` - Environment variables (copy from env.example)
- `test-jwt-plugin.sh` - JWT validation testing script

## 🛠️ Development

### Adding New Services

1. **Add to docker-compose.yml**:

   ```yaml
   new-service:
     image: your-image:latest
     labels:
       - 'traefik.enable=true'
       - 'traefik.http.routers.new-service.rule=Host(`new.docker.localhost`)'
     networks:
       - vpc-bridge
   ```

2. **Configure routing** in Traefik labels or traefik.yaml

3. **Test the service**:

   ```bash
   docker compose up -d new-service
   curl http://new.docker.localhost
   ```

### Updating JWT Configuration

1. **Edit traefik.yaml** middleware configuration
2. **Restart Traefik**: `docker compose restart traefik-gateway`
3. **Test changes**: `./test-jwt-plugin.sh`

## 🆘 Troubleshooting

### Common Issues

**JWT Plugin not working:**

```bash
# Check plugin status
curl -s http://localhost:8080/api/http/middlewares | \
  jq '.[] | select(.name == "jwt-auth@file")'

# Check Traefik logs
docker logs isling-docker-traefik-gateway-1 | grep -i jwt
```

**Services not accessible:**

```bash
# Check service health
docker compose ps

# Check Traefik routing
curl -s http://localhost:8080/api/http/routers | jq '.[].name'

# Check network connectivity
docker network inspect isling-docker_vpc-bridge
```

**Performance issues:**

```bash
# Monitor resource usage
docker stats

# Check service logs for errors
docker logs isling-docker-api-service-1 --tail 50
```

### Getting Help

1. **Check service logs** for specific error messages
2. **Review configuration files** for syntax errors
3. **Test individual components** in isolation
4. **Consult documentation**:
   - [Traefik JWT Plugin](https://github.com/traefik-plugins/traefik-jwt-plugin)
   - [Traefik Documentation](https://doc.traefik.io/traefik/)
   - [Docker Compose Documentation](https://docs.docker.com/compose/)

## 📚 Additional Documentation

- [JWT Plugin Setup Guide](./JWT-PLUGIN-SETUP.md) - Detailed JWT configuration
- [JWT Validation Explained](./JWT-VALIDATION-EXPLAINED.md) - Technical deep dive
- [Performance Testing](./test-jwt-plugin.sh) - Automated test script

## 🔄 Migration Notes

**From ForwardAuth to JWT Plugin:**

- ✅ **Completed**: JWT plugin configured and loaded
- ✅ **Routing**: Public and protected routes working
- ⚠️ **JWT Secret**: Needs your actual Supabase Auth secret
- 📈 **Performance**: Expect 50-80% latency reduction

**Rollback Plan:**
If needed, you can rollback to ForwardAuth by restoring the Docker labels configuration and removing the JWT plugin from traefik.yaml.
