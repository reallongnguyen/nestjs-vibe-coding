# Redis-based Notification Cache Service

The Redis-based Notification Cache Service provides a scalable and persistent caching solution for the notification system. This service replaces the previous in-memory cache implementation to improve performance, reliability, and support for distributed deployments.

## Features

- Redis-based caching for notifications and counts
- Configurable TTL (Time-To-Live) for different cache types
- Automatic cache invalidation for user-specific and type-specific caches
- Periodic cleanup of expired cache entries
- Comprehensive error handling and logging
- Support for distributed deployments

## Configuration

The cache service is configured through environment variables:

| Environment Variable | Description | Default Value |
|----------------------|-------------|---------------|
| `NOTIFICATION_CACHE_TTL` | Default TTL for cache entries (seconds) | 60 |
| `NOTIFICATION_CACHE_NOTIFICATIONS_TTL` | TTL for notification lists (seconds) | 300 |
| `NOTIFICATION_CACHE_COUNTS_TTL` | TTL for count values (seconds) | 60 |
| `NOTIFICATION_CACHE_CLEANUP_INTERVAL` | Interval for cleanup of expired entries (seconds) | 3600 |

## Usage

### Service Injection

```typescript
constructor(
  private readonly cacheService: NotificationCacheService,
) {}
```

### Caching Notifications

```typescript
// Get cached notifications
const notifications = await cacheService.getNotifications('user:123:unread');

// Cache notifications with default TTL
await cacheService.setNotifications('user:123:unread', notifications);

// Cache notifications with custom TTL (in seconds)
await cacheService.setNotifications('user:123:unread', notifications, 600);
```

### Caching Counts

```typescript
// Get cached count
const count = await cacheService.getCount('unread:123');

// Cache count with default TTL
await cacheService.setCount('unread:123', 5);

// Cache count with custom TTL (in seconds)
await cacheService.setCount('unread:123', 5, 120);
```

### Cache Invalidation

```typescript
// Invalidate all cache entries for a user
await cacheService.invalidateUserCache('123');

// Invalidate all cache entries for a notification type
await cacheService.invalidateTypeCache('like');
```

## Key Naming Convention

All cache keys are automatically prefixed with `notification:cache:` to avoid conflicts with other Redis keys. For example:

- Input key: `user:123:unread`
- Actual Redis key: `notification:cache:user:123:unread`

Count keys are additionally prefixed with `count:`:

- Input key: `unread:123`
- Actual Redis key: `notification:cache:count:unread:123`

## Cache Cleanup

The service automatically cleans up expired cache entries at a configurable interval. This helps prevent Redis memory usage from growing indefinitely.

## Integration with Repository

The `NotificationRepository` has been updated to use this cache service instead of the previous in-memory cache. This provides several benefits:

1. **Persistence**: Cache survives service restarts
2. **Scalability**: Works across multiple instances of the service
3. **Memory Efficiency**: Redis is optimized for caching and memory management
4. **Monitoring**: Redis provides tools for monitoring cache usage and performance

## Best Practices

1. **Use Specific Keys**: Create specific cache keys for different query patterns to avoid cache collisions.
2. **Consider TTL**: Use shorter TTL for frequently changing data and longer TTL for more stable data.
3. **Invalidate Proactively**: Call invalidation methods when data changes to ensure cache consistency.
4. **Handle Cache Misses**: Always have a fallback for cache misses to fetch data from the database.
5. **Monitor Performance**: Track cache hit/miss rates to optimize caching strategy.

## Error Handling

The service includes built-in error handling for all Redis operations. All errors are logged but do not propagate to the caller, ensuring that cache failures don't affect the core functionality of the application.

## Future Improvements

1. **Cache Warming**: Proactively populate cache for frequently accessed data
2. **Cache Statistics**: Track and expose cache hit/miss rates
3. **Cache Versioning**: Support for versioned cache entries to handle schema changes
4. **Selective Invalidation**: More granular cache invalidation strategies
5. **Circuit Breaker**: Implement circuit breaker pattern for Redis failures
