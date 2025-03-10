#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/gorse"
POSTGRES_CONTAINER="gorse-postgres"
REDIS_CONTAINER="gorse-redis"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Backup PostgreSQL database
echo "Starting PostgreSQL backup..."
docker exec $POSTGRES_CONTAINER pg_dump -U ${GORSE_POSTGRES_USER} ${GORSE_POSTGRES_DB} | gzip > "$BACKUP_DIR/gorse_postgres_$DATE.sql.gz"

# Backup Redis data
echo "Starting Redis backup..."
docker exec $REDIS_CONTAINER redis-cli SAVE
docker cp $REDIS_CONTAINER:/data/dump.rdb "$BACKUP_DIR/gorse_redis_$DATE.rdb"

# Clean up old backups
echo "Cleaning up old backups..."
find "$BACKUP_DIR" -name "gorse_postgres_*.sql.gz" -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "gorse_redis_*.rdb" -mtime +$RETENTION_DAYS -delete

# Check backup status
if [ $? -eq 0 ]; then
    echo "Backup completed successfully"
    echo "PostgreSQL backup: $BACKUP_DIR/gorse_postgres_$DATE.sql.gz"
    echo "Redis backup: $BACKUP_DIR/gorse_redis_$DATE.rdb"
else
    echo "Backup failed"
    exit 1
fi 