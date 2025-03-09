# Redis Counter Service

The Redis Counter Service provides a robust and scalable solution for managing notification-related counters using Redis. This service ensures atomic operations and supports key expiration for temporary counters.

## Features

- Atomic increment and decrement operations
- TTL (Time-To-Live) support for counter expiration
- Retry mechanism for handling Redis connection issues
- Comprehensive error handling and logging
- Thread-safe operations

## Usage

### Service Injection

```typescript
constructor(
  private readonly counterService: NotificationCounterService,
) {}
```

### Basic Operations

#### Increment Counter

```typescript
// Increment by 1 with TTL
const value = await counterService.increment('counter-key', 300); // TTL in seconds

// Increment by specific value
const value = await counterService.increment('counter-key', 300, 5);
```

#### Decrement Counter

```typescript
// Decrement by 1 with TTL
const value = await counterService.decrement('counter-key', 300);

// Decrement by specific value
const value = await counterService.decrement('counter-key', 300, 5);
```

#### Get Counter Value

```typescript
const value = await counterService.get('counter-key');
// Returns 0 if counter doesn't exist
```

#### Reset Counter

```typescript
await counterService.reset('counter-key');
```

### TTL Operations

#### Check Counter Existence

```typescript
const exists = await counterService.exists('counter-key');
```

#### Get TTL

```typescript
const ttl = await counterService.getTTL('counter-key');
// Returns remaining time in seconds
```

#### Set TTL

```typescript
await counterService.setTTL('counter-key', 300);
```

## Key Naming Convention

All counter keys are automatically prefixed with `notification:counter:` to avoid conflicts with other Redis keys. For example:

- Input key: `unread-messages`
- Actual Redis key: `notification:counter:unread-messages`

## Error Handling

The service includes built-in retry mechanisms for handling temporary Redis connection issues:

- Increment/Decrement operations: 3 retries with 1000ms backoff
- Other operations: 3 retries with 500ms backoff

All Redis errors are logged and can be caught using try-catch blocks.

## Best Practices

1. **TTL Management**
   - Always set TTL for temporary counters
   - Use infinite TTL only for permanent counters
   - Monitor TTL values to prevent premature expiration

2. **Key Naming**
   - Use descriptive counter names
   - Follow kebab-case naming convention
   - Include relevant context in the key name

3. **Error Handling**
   - Always handle potential Redis errors
   - Use try-catch blocks for critical operations
   - Monitor error rates for service health

4. **Performance**
   - Batch related operations when possible
   - Monitor counter sizes for memory usage
   - Use appropriate TTL values to prevent memory leaks

## Example Use Cases

### Unread Notification Counter

```typescript
// Increment unread count
await counterService.increment('user:123:unread', 86400); // 24 hours TTL

// Get unread count
const unreadCount = await counterService.get('user:123:unread');

// Reset after reading
await counterService.reset('user:123:unread');
```

### Rate Limiting

```typescript
// Track API calls
const calls = await counterService.increment('api:rate:user:123', 3600); // 1 hour TTL

if (calls > RATE_LIMIT) {
  throw new RateLimitExceededException();
}
```

## Monitoring and Maintenance

- Monitor Redis memory usage
- Track counter expiration rates
- Monitor error rates and patterns
- Regular cleanup of expired counters

## Integration Testing

When writing integration tests:

1. Use a separate Redis database for testing
2. Clean up test counters after each test
3. Test edge cases and error scenarios
4. Verify TTL behavior
5. Test concurrent operations
