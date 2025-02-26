# Redis Usage Guidelines

### Keys and Patterns

1. Key Naming Convention:

   ```
   {module}:{entity}:{id}:{purpose}
   ```

   Example: `post:123:views:increment`

2. Common Patterns:
   - Cache: `{entity}:{id}:cache`
   - List: `{entity}:list:{filter}`
   - Counter: `{entity}:{id}:count`
   - Lock: `{entity}:{id}:lock`
   - Batch: `{entity}:batch`

### Data Structures

1. HyperLogLog
   - Use for unique counting (views, visitors)
   - Commands: `pfadd`, `pfcount`

   ```typescript
   // Add to HyperLogLog
   await redis.pfadd('post:123:views:increment', viewerHash);
   // Get count
   const count = await redis.pfcount('post:123:views:increment');
   ```

2. Lists
   - Use for queues and batching
   - Commands: `rpush`, `lrange`, `llen`, `del`

   ```typescript
   // Add to batch
   await redis.rpush('post-views-batch', JSON.stringify(data));
   // Get batch size
   const size = await redis.llen('post-views-batch');
   // Get all items
   const items = await redis.lrange('post-views-batch', 0, -1);
   ```

3. Strings with TTL
   - Use for temporary flags and caching
   - Commands: `setex`, `get`

   ```typescript
   // Set with TTL
   await redis.setex('post:123:views:recent', 1800, '1');
   // Check existence
   const exists = await redis.get('post:123:views:recent');
   ```

### Performance Optimization

1. Pipelining

   ```typescript
   const pipeline = redis.pipeline();
   keys.forEach(key => pipeline.pfcount(key));
   const results = await pipeline.exec();
   ```

2. Batching

   ```typescript
   // Batch configuration
   const BATCH_SIZE = 100;
   const BATCH_TIMEOUT = 1000; // ms

   // Process when batch is full or timeout reached
   if (batchSize >= BATCH_SIZE || timeSinceStart >= BATCH_TIMEOUT) {
     await processBatch();
   }
   ```

3. Transaction

   ```typescript
   await redis.multi()
     .set('key1', 'value1')
     .set('key2', 'value2')
     .exec();
   ```

### Best Practices

1. Memory Management
   - Always set TTL for temporary data
   - Use HyperLogLog for large sets
   - Implement cleanup jobs for expired data

2. Error Handling

   ```typescript
   try {
     await redis.set('key', 'value');
   } catch (error) {
     logger.error('Redis operation failed:', error);
     throw new AppError('redis.operation.failed');
   }
   ```

3. Monitoring
   - Track Redis memory usage
   - Monitor operation latency
   - Set up alerts for connection issues
