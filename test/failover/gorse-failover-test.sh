#!/bin/bash

# Configuration
MASTER_CONTAINER="gorse-master"
WORKER_CONTAINERS=("gorse-worker-1" "gorse-worker-2")
REDIS_CONTAINER="gorse-redis"
POSTGRES_CONTAINER="gorse-postgres"
TEST_DURATION=300  # 5 minutes
HEALTH_CHECK_INTERVAL=5

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_health() {
    local container=$1
    if [ "$(docker inspect -f {{.State.Running}} $container 2>/dev/null)" = "true" ]; then
        return 0
    else
        return 1
    fi
}

test_api() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" -H "X-API-Key: ${GORSE_API_KEY}" http://localhost:8088/api/health/ready)
    if [ "$response" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Main test scenarios
test_worker_failover() {
    log_info "Testing worker failover..."
    
    # Stop one worker
    local worker=${WORKER_CONTAINERS[0]}
    log_info "Stopping $worker..."
    docker stop $worker
    
    # Check if system remains operational
    sleep 5
    if test_api; then
        log_info "System remains operational after worker failure"
    else
        log_error "System is not responding after worker failure"
        return 1
    fi
    
    # Restart worker
    log_info "Restarting $worker..."
    docker start $worker
    sleep 5
    
    if check_health $worker; then
        log_info "Worker recovered successfully"
    else
        log_error "Worker failed to recover"
        return 1
    fi
}

test_redis_failover() {
    log_info "Testing Redis failover..."
    
    # Stop Redis
    log_info "Stopping Redis..."
    docker stop $REDIS_CONTAINER
    
    # Check if system degrades gracefully
    sleep 5
    if ! test_api; then
        log_info "System properly degraded during Redis outage"
    else
        log_warn "System unexpectedly operational during Redis outage"
    fi
    
    # Restart Redis
    log_info "Restarting Redis..."
    docker start $REDIS_CONTAINER
    sleep 10
    
    if test_api; then
        log_info "System recovered after Redis restart"
    else
        log_error "System failed to recover after Redis restart"
        return 1
    fi
}

test_master_failover() {
    log_info "Testing master failover..."
    
    # Stop master
    log_info "Stopping master..."
    docker stop $MASTER_CONTAINER
    
    # Check if system degrades gracefully
    sleep 5
    if ! test_api; then
        log_info "System properly degraded during master outage"
    else
        log_warn "System unexpectedly operational during master outage"
    fi
    
    # Restart master
    log_info "Restarting master..."
    docker start $MASTER_CONTAINER
    sleep 15
    
    if test_api; then
        log_info "System recovered after master restart"
    else
        log_error "System failed to recover after master restart"
        return 1
    fi
}

# Run all tests
main() {
    log_info "Starting failover tests..."
    
    # Initial health check
    if ! test_api; then
        log_error "System not healthy before tests"
        exit 1
    fi
    
    # Run tests
    test_worker_failover || exit 1
    sleep 10
    test_redis_failover || exit 1
    sleep 10
    test_master_failover || exit 1
    
    log_info "All failover tests completed successfully"
}

main 