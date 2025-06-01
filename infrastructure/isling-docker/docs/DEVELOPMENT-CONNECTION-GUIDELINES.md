# Development Connection Guidelines

This guide helps developers connect to services running on the development server for debugging, data inspection, and testing.

## 🌐 **Connection Architecture**

```
Your Local Machine → IAP Tunnel → Development VM → Services
                                      ↓
                               ┌─────────────────┐
                               │  PostgreSQL     │ :5432
                               │  Redis          │ :6379
                               │  MQTT           │ :1883, :8083
                               │  Traefik        │ :8080
                               │  API Service    │ :8000
                               │  Auth Service   │ :9999
                               └─────────────────┘
```

## 🔧 **Prerequisites**

### **1. Install Required Tools**

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install database clients
brew install postgresql redis  # macOS
# OR
sudo apt-get install postgresql-client redis-tools  # Ubuntu

# Install DBeaver (GUI Database Tool)
# Download from: https://dbeaver.io/download/

# Install Redis GUI (Optional)
# RedisInsight: https://redis.com/redis-enterprise/redis-insight/
```

### **2. Setup GCP Authentication**

```bash
# Authenticate with GCP
gcloud auth login

# Set default project
gcloud config set project isling-dev-isling

# Grant IAP tunnel access (ask admin to run this)
gcloud projects add-iam-policy-binding isling-dev-isling \
  --member="user:your-email@company.com" \
  --role="roles/iap.tunnelResourceAccessor"
```

## 🚇 **SSH Tunnel Setup**

### **Quick Start Script**

Create `dev-tunnel.sh` for easy connection:

```bash
#!/bin/bash
# dev-tunnel.sh - One-command development server access

VM_NAME="dev01-tky-a-api-isling"
ZONE="asia-northeast1-a"
PROJECT_ID="isling-dev-isling"

echo "🚇 Connecting to Isling Development Server"
echo "📋 Services will be available at:"
echo "   🗄️  PostgreSQL:     localhost:15432"
echo "   🔴 Redis:          localhost:16379"
echo "   📡 MQTT WebSocket: ws://localhost:18083/mqtt"
echo "   📊 Traefik:        http://localhost:18080"
echo "   🚀 API Service:    http://localhost:18000"
echo "   🔐 Auth Service:   http://localhost:19999"
echo ""
echo "💡 Keep this terminal open while working"
echo "   Press Ctrl+C to disconnect"
echo ""

# Create SSH tunnel with all services
gcloud compute ssh $VM_NAME \
  --zone=$ZONE \
  --project=$PROJECT_ID \
  --tunnel-through-iap \
  --ssh-flag="-L 15432:localhost:5432" \
  --ssh-flag="-L 16379:localhost:6379" \
  --ssh-flag="-L 18083:localhost:8083" \
  --ssh-flag="-L 18080:localhost:8080" \
  --ssh-flag="-L 18000:localhost:8000" \
  --ssh-flag="-L 19999:localhost:9999" \
  --ssh-flag="-N"
```

```bash
chmod +x dev-tunnel.sh
./dev-tunnel.sh
```

### **Manual Tunnel Commands**

```bash
# Basic SSH access
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap

# Database only
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --ssh-flag="-L 15432:localhost:5432"

# All services
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --ssh-flag="-L 15432:localhost:5432" \
  --ssh-flag="-L 16379:localhost:6379" \
  --ssh-flag="-L 18083:localhost:8083" \
  --ssh-flag="-L 18080:localhost:8080"
```

## 🗄️ **Database Access**

### **PostgreSQL Connection**

#### **Using psql (Command Line)**

```bash
# After starting tunnel (localhost:15432)
psql -h localhost -p 15432 -U isling_api -d isling_api

# Common commands
\l              # List databases
\dt             # List tables
\d table_name   # Describe table
\q              # Quit
```

#### **Using DBeaver (GUI)**

1. **Create New Connection**

   - Database: PostgreSQL
   - Host: `localhost`
   - Port: `15432`
   - Database: `isling_api`
   - Username: `isling_api`
   - Password: (check .env file on server)

2. **Connection Settings**

   ```
   Server Host: localhost
   Port: 15432
   Database: isling_api
   Username: isling_api
   Password: [from server .env]
   ```

3. **Test Connection**
   - Click "Test Connection"
   - Should show "Connected"

#### **Environment-Specific Databases**

**Phase 1 (Containerized):**

```bash
# API Database
psql -h localhost -p 15432 -U isling_api -d isling_api

# Auth Database
psql -h localhost -p 15432 -U supabase_auth_admin -d auth
```

**Phase 2 (Cloud SQL):**

```bash
# Get Cloud SQL IP from terraform output
terraform output database_connection

# Same connection through tunnel
psql -h localhost -p 15432 -U isling_api -d isling_api
```

### **Common Database Queries**

```sql
-- Check API users
SELECT id, email, name, created_at FROM users LIMIT 10;

-- Check auth users
SELECT id, email, email_confirmed_at, created_at FROM auth.users LIMIT 10;

-- Check API logs
SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 20;

-- Database statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

## 🔴 **Redis Access**

### **Using redis-cli**

```bash
# After starting tunnel (localhost:16379)
redis-cli -h localhost -p 16379

# Common commands
PING                    # Test connection
KEYS *                  # List all keys (dev only!)
GET key_name           # Get value
SET key_name value     # Set value
INFO                   # Server info
FLUSHDB                # Clear database (careful!)
```

### **Using RedisInsight (GUI)**

1. **Add Database**

   - Host: `localhost`
   - Port: `16379`
   - Name: `Isling Development`

2. **Browse Data**
   - View keys by pattern
   - Inspect JSON data
   - Monitor commands

### **Common Redis Operations**

```bash
# Check session data
redis-cli -h localhost -p 16379 KEYS "session:*"

# Check cache data
redis-cli -h localhost -p 16379 KEYS "cache:*"

# Monitor real-time commands
redis-cli -h localhost -p 16379 MONITOR

# Check memory usage
redis-cli -h localhost -p 16379 INFO memory
```

## 📡 **MQTT Access**

### **MQTT Over WebSocket**

#### **Using Browser/JavaScript**

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Isling MQTT Test</title>
    <script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
  </head>
  <body>
    <div id="status">Connecting...</div>
    <div id="messages"></div>

    <script>
      const client = mqtt.connect('ws://localhost:18083/mqtt', {
        clientId: 'dev-client-' + Math.random().toString(16).substr(2, 8),
      });

      client.on('connect', function () {
        document.getElementById('status').innerHTML = 'Connected to MQTT';

        // Subscribe to all topics for testing
        client.subscribe('#');

        // Send test message
        client.publish('test/topic', 'Hello from browser!');
      });

      client.on('message', function (topic, message) {
        const div = document.getElementById('messages');
        div.innerHTML += `<p><strong>${topic}:</strong> ${message.toString()}</p>`;
      });
    </script>
  </body>
</html>
```

#### **Using MQTT.js (Node.js)**

```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('ws://localhost:18083/mqtt', {
  clientId: 'dev-client-' + Math.random().toString(16).substr(2, 8),
});

client.on('connect', function () {
  console.log('Connected to MQTT broker');

  // Subscribe to device events
  client.subscribe('devices/+/events');
  client.subscribe('users/+/notifications');

  // Send test message
  client.publish(
    'test/development',
    JSON.stringify({
      type: 'test',
      timestamp: new Date().toISOString(),
      data: 'Development test message',
    }),
  );
});

client.on('message', function (topic, message) {
  console.log(`📡 ${topic}: ${message.toString()}`);
});
```

### **MQTT Over TCP (Advanced)**

```bash
# Create tunnel for TCP MQTT
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --ssh-flag="-L 11883:localhost:1883"

# Using mosquitto client
mosquitto_pub -h localhost -p 11883 -t "test/topic" -m "Hello MQTT"
mosquitto_sub -h localhost -p 11883 -t "#"
```

### **MQTT Testing Topics**

```bash
# Device simulation
devices/device-001/telemetry    # Device data
devices/device-001/status       # Device status
devices/device-001/commands     # Device commands

# User notifications
users/user-123/notifications    # User notifications
users/user-123/alerts          # User alerts

# System events
system/health                   # System health
system/logs                     # System logs
```

## 🚀 **API Services Access**

### **API Service (Port 8000 → 18000)**

```bash
# Health check
curl http://localhost:18000/health

# API endpoints
curl http://localhost:18000/api/v1/users
curl http://localhost:18000/api/v1/devices

# With authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:18000/api/v1/protected-endpoint
```

### **Auth Service (Port 9999 → 19999)**

```bash
# Health check
curl http://localhost:19999/health

# Auth endpoints
curl http://localhost:19999/auth/v1/settings
curl http://localhost:19999/auth/v1/signup \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### **Traefik Dashboard (Port 8080 → 18080)**

Open in browser: <http://localhost:18080>

- View routing rules
- Monitor service health
- Check load balancing
- Debug request routing

## 🔍 **Service Debugging**

### **Log Access via SSH**

```bash
# SSH to server
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap

# View all service logs
sudo docker compose logs -f

# View specific service logs
sudo docker compose logs -f api-service
sudo docker compose logs -f auth-service
sudo docker compose logs -f api-postgres

# Follow logs with timestamps
sudo docker compose logs -f -t api-service
```

### **Container Debugging**

```bash
# Enter running container
sudo docker compose exec api-service bash
sudo docker compose exec api-postgres psql -U isling_api isling_api

# Check container status
sudo docker compose ps
sudo docker stats

# Restart services
sudo docker compose restart api-service
sudo docker compose up -d --force-recreate api-service
```

### **Network Debugging**

```bash
# Check port listening
sudo ss -tulpn | grep :5432
sudo ss -tulpn | grep :6379

# Test internal connectivity
sudo docker compose exec api-service curl http://auth-service:9999/health
sudo docker compose exec api-service nc -zv api-postgres 5432
```

## 📊 **Development Workflows**

### **Database Development**

1. **Schema Changes**

   ```bash
   # Edit Prisma schema locally
   # Generate migration
   npx prisma migrate dev --name add_new_feature

   # Apply to development server via CI/CD
   git push origin develop
   ```

2. **Data Seeding**

   ```bash
   # SSH to server
   gcloud compute ssh dev01-tky-a-api-isling --zone=asia-northeast1-a --tunnel-through-iap

   # Run seed script
   cd /opt/isling
   sudo docker compose exec api-service npm run db:seed
   ```

3. **Data Export/Import**

   ```bash
   # Export data for testing
   pg_dump -h localhost -p 15432 -U isling_api isling_api > local_backup.sql

   # Import to local database
   psql -h localhost -p 5432 -U postgres -d local_isling < local_backup.sql
   ```

### **API Development**

1. **Local Development with Remote DB**

   ```bash
   # Start tunnel
   ./dev-tunnel.sh

   # Run API locally with remote database
   DATABASE_URL="postgresql://isling_api:password@localhost:15432/isling_api" \
   npm run dev
   ```

2. **Testing API Changes**

   ```bash
   # Test against development server
   curl http://localhost:18000/api/v1/test-endpoint

   # Compare with local
   curl http://localhost:8000/api/v1/test-endpoint
   ```

### **MQTT Development**

1. **Message Simulation**

   ```javascript
   // Simulate device messages
   const mqtt = require('mqtt');
   const client = mqtt.connect('ws://localhost:18083/mqtt');

   client.on('connect', () => {
     setInterval(() => {
       client.publish(
         'devices/sim-001/telemetry',
         JSON.stringify({
           temperature: 20 + Math.random() * 10,
           humidity: 50 + Math.random() * 20,
           timestamp: new Date().toISOString(),
         }),
       );
     }, 5000);
   });
   ```

2. **Real-time Monitoring**

   ```bash
   # Monitor all messages
   mosquitto_sub -h localhost -p 11883 -t "#" -v
   ```

## 🔐 **Security Notes**

### **Connection Security**

- ✅ **Encrypted**: All traffic goes through IAP encrypted tunnel
- ✅ **Authenticated**: Requires GCP authentication
- ✅ **Audited**: All connections logged in Cloud Audit Logs
- ✅ **Isolated**: No direct internet access to services

### **Best Practices**

- 🔒 Never expose database passwords in scripts
- 🔒 Use read-only database users when possible
- 🔒 Don't run destructive operations on shared development data
- 🔒 Close tunnels when not in use
- 🔒 Use VPN or secure networks for connections

### **Environment Variables**

```bash
# Get credentials from server
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --command="sudo cat /opt/isling/.env | grep -E '(POSTGRES_PASSWORD|JWT_SECRET)'"
```

## 🛠️ **Troubleshooting**

### **Common Issues**

**Connection Refused:**

```bash
# Check if tunnel is running
ps aux | grep gcloud

# Restart tunnel
pkill -f "gcloud compute ssh"
./dev-tunnel.sh
```

**Database Connection Failed:**

```bash
# Check if PostgreSQL is running on server
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --command="sudo docker compose ps"
```

**IAP Permission Denied:**

```bash
# Check IAP permissions
gcloud projects get-iam-policy isling-dev-isling \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/iap.tunnelResourceAccessor"
```

### **Port Conflicts**

If local ports are in use:

```bash
# Check what's using a port
lsof -i :15432

# Use different ports
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --ssh-flag="-L 25432:localhost:5432"  # Use 25432 instead
```

### **Performance Issues**

```bash
# Check tunnel bandwidth
# Download test file through tunnel
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --command="dd if=/dev/zero bs=1M count=100 | gzip -c" > /dev/null
```

## 📱 **Mobile Development**

For mobile app development connecting to the API:

```bash
# Expose API on all interfaces (development only)
gcloud compute ssh dev01-tky-a-api-isling \
  --zone=asia-northeast1-a \
  --tunnel-through-iap \
  --ssh-flag="-L 0.0.0.0:18000:localhost:8000"

# Mobile app can connect to: http://YOUR_LOCAL_IP:18000
```

This setup provides secure, convenient access to all development services while maintaining proper security boundaries.
