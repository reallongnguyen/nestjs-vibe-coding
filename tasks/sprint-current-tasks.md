### GRS-001: Gorse Recommendation System Integration (8 points)

**Status**: In Progress
**Progress**: 70%
**Blockers**: None

#### GRS-001.1: Gorse Infrastructure Setup (3 points)

**Status**: In Progress
**Progress**: 80%
**Priority**: High
**Assignee**: DevOps
**Dependencies**: None

**Completed Items**:

1. Infrastructure:
   - ✅ Gorse services defined in docker-compose
   - ✅ Dedicated PostgreSQL and Redis instances
   - ✅ Traefik integration with basic auth
   - ✅ Internal network configuration
   - ✅ Health checks configured
   - ✅ Monitoring setup with Prometheus

2. Configuration:
   - ✅ Environment variables defined
   - ✅ Gorse config.toml created
   - ✅ Service dependencies configured
   - ✅ Security settings implemented

**Pending Items**:

1. Infrastructure:
   - ⏳ Database initialization script
   - ⏳ Backup strategy implementation

2. Validation:
   - ⏳ Load testing
   - ⏳ Failover testing
   - ⏳ Performance metrics validation

**Technical Design**:

```typescript
// Gorse configuration interface
interface GorseConfig {
  master: {
    endpoint: string;
    apiKey: string;
    healthCheckInterval: number;
  };
  workers: {
    endpoints: string[];
    minWorkers: number;
    maxWorkers: number;
  };
  redis: {
    url: string;
    keyPrefix: string;
    ttl: number;
  };
  monitoring: {
    metricsPort: number;
    healthCheckEndpoint: string;
    alertThresholds: {
      errorRate: number;
      latency: number;
      cacheHitRate: number;
    };
  };
}

// Updated Gorse API Interfaces
interface GorseUser {
  UserId: string;
  Labels: string[];
  Subscribe?: string[];
  Comment?: string;
}

interface GorseItem {
  ItemId: string;
  Labels: string[];
  Categories?: string[];
  Timestamp: string;
  Comment?: string;
  IsHidden?: boolean;
}

interface GorseFeedback {
  FeedbackType: string;
  UserId: string;
  ItemId: string;
  Timestamp: string;
  Comment?: string;
}

interface GorseRecommendation {
  Id: string;
  Score: number;
}

interface GorseHealthStatus {
  CacheStoreConnected: boolean;
  CacheStoreError?: string;
  DataStoreConnected: boolean;
  DataStoreError?: string;
  Ready: boolean;
}

// Gorse client wrapper
@Injectable()
class GorseClient {
  // User Management
  async insertUser(userId: string, labels: string[], subscribe?: string[]): Promise<void>;
  async getUser(userId: string): Promise<GorseUser>;
  async updateUser(userId: string, labels?: string[], subscribe?: string[]): Promise<void>;
  async deleteUser(userId: string): Promise<void>;
  async listUsers(n?: number, cursor?: string): Promise<GorseUsersResponse>;
  
  // Item Management
  async insertItem(itemId: string, timestamp: Date, labels: string[], categories?: string[], isHidden?: boolean): Promise<void>;
  async getItem(itemId: string): Promise<GorseItem>;
  async updateItem(itemId: string, labels?: string[], categories?: string[], isHidden?: boolean): Promise<void>;
  async deleteItem(itemId: string): Promise<void>;
  
  // Feedback Management
  async insertFeedback(feedback: GorseFeedback): Promise<void>;
  
  // Recommendations
  async getRecommend(userId: string, writeBackType?: string, writeBackDelay?: string, n?: number, offset?: number): Promise<string[]>;
  async getRecommendByCategory(userId: string, category: string, writeBackType?: string, writeBackDelay?: string, n?: number, offset?: number): Promise<string[]>;
  async getPopular(userId?: string, n?: number, offset?: number): Promise<GorseRecommendation[]>;
  async getPopularByCategory(category: string, userId?: string, n?: number, offset?: number): Promise<GorseRecommendation[]>;
  async getLatest(n?: number): Promise<string[]>;
  async getSimilar(itemId: string, n?: number): Promise<GorseRecommendation[]>;
  async getUserNeighbors(userId: string, n?: number, offset?: number): Promise<GorseRecommendation[]>;
  
  // Health Checks
  async getLiveness(): Promise<GorseHealthStatus>;
  async getReadiness(): Promise<GorseHealthStatus>;
}
```

**Deployment Configuration**:

```yaml
# docker-compose.gorse.yml
version: '3'
services:
  gorse-master:
    image: zhenghaoz/gorse-master
    restart: unless-stopped
    ports:
      - "8086:8086"   # HTTP port
      - "8088:8088"   # gRPC port
      - "9090:9090"   # metrics
    environment:
      GORSE_CACHE_STORE: redis://redis:6379
      GORSE_DATA_STORE: postgres://postgres:5432/gorse
      GORSE_WORKER_ADDRESSES: "gorse-worker-1:8089,gorse-worker-2:8089"
      GORSE_DASHBOARD_USER: "admin"
      GORSE_DASHBOARD_PASS: "${GORSE_ADMIN_PASS}"
    volumes:
      - gorse-master-data:/var/lib/gorse
    depends_on:
      - redis
      - postgres

  gorse-worker-1:
    image: zhenghaoz/gorse-worker
    restart: unless-stopped
    ports:
      - "8089:8089"   # gRPC port
      - "9091:9091"   # metrics
    environment:
      GORSE_MASTER_ADDRESS: "gorse-master:8088"
      GORSE_CACHE_STORE: redis://redis:6379
    volumes:
      - gorse-worker-1-data:/var/lib/gorse

  gorse-worker-2:
    image: zhenghaoz/gorse-worker
    restart: unless-stopped
    ports:
      - "8090:8089"   # gRPC port
      - "9092:9091"   # metrics
    environment:
      GORSE_MASTER_ADDRESS: "gorse-master:8088"
      GORSE_CACHE_STORE: redis://redis:6379
    volumes:
      - gorse-worker-2-data:/var/lib/gorse

volumes:
  gorse-master-data:
  gorse-worker-1-data:
  gorse-worker-2-data:
```

**Acceptance Criteria**:

1. Infrastructure:
   - Gorse cluster deployed and healthy
   - All workers connected and operational
   - Metrics endpoint accessible
   - Dashboard accessible and secured

2. Performance:
   - API response time < 100ms (p95)
   - Recommendation generation < 200ms (p95)
   - Worker CPU usage < 80%
   - Memory usage < 80%

3. Monitoring:
   - Prometheus metrics configured
   - Grafana dashboard operational
   - Alerts configured for:
     - High error rate (>1%)
     - High latency (>200ms)
     - Worker disconnection
     - Low cache hit rate (<90%)

4. API Integration:
   - All API endpoints properly implemented and tested
   - Error handling and retries implemented
   - Rate limiting configured
   - Proper logging and monitoring
   - Documentation updated

#### GRS-001.2: Data Synchronization Service (3 points)

**Status**: In Progress
**Progress**: 50%
**Priority**: High
**Assignee**: Backend Developer
**Dependencies**: GRS-001.1

**Current Implementation Phase**:

1. Analysis ✅
   - Event system architecture reviewed
   - Event patterns identified
   - Integration points mapped

2. Development Environment Setup ✅
   - Create feature branch
   - Set up test environment
   - Configure development tools

3. Module Structure Implementation ✅
   - Recommendation module restructured
   - Event manager module restructured
   - Directory organization standardized
   - Import paths updated

4. Event System Implementation ✅
   - Event schemas defined with Zod
   - Event classes implemented
   - Event validation added
   - Unit tests created

**Next Steps**:

1. ⏳ Implement event handlers
2. ⏳ Implement sync service
3. ⏳ Add monitoring

**Completed Items**:
- ✅ Event schemas created and tested
- ✅ Module structure reorganized following standards
- ✅ Gorse client implementation
- ✅ Basic event handling setup
- ✅ Event validation implemented
- ✅ Unit tests for events

**Implementation Notes**:

1. Event System Architecture:
   - Using NestJS EventEmitter with validation
   - Event bus adapter with async support
   - Schema-based validation
   - Error handling with proper logging

2. Event Patterns to Implement:

   ```typescript
   // Event schemas
   interface GorseUserSyncEvent extends BaseEvent<UserSyncPayload> {}
   interface GorseItemSyncEvent extends BaseEvent<ItemSyncPayload> {}
   interface GorseFeedbackEvent extends BaseEvent<FeedbackPayload> {}

   // Event names
   const GORSE_EVENTS = {
     USER_SYNC: 'gorse.user.sync',
     ITEM_SYNC: 'gorse.item.sync',
     FEEDBACK_SYNC: 'gorse.feedback.sync',
   } as const;
   ```

3. Integration Points:
   - User events: profile updates, preferences
   - Content events: posts, emotions
   - Interaction events: views, likes, comments
   - Batch sync operations

**Technical Design**:

```typescript
// Data sync service
@Injectable()
class GorseSyncService {
  constructor(
    private readonly gorseClient: GorseClient,
    private readonly eventBus: EventBusAdapter,
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  // Initial sync
  async performInitialSync(): Promise<SyncResult>;
  async syncUsers(batchSize: number): Promise<void>;
  async syncItems(batchSize: number): Promise<void>;
  async syncFeedback(batchSize: number): Promise<void>;

  // Real-time sync
  @OnEvent('user.updated')
  async handleUserUpdate(event: UserUpdatedEvent): Promise<void>;

  @OnEvent('post.published')
  async handleNewContent(event: PostPublishedEvent): Promise<void>;

  @OnEvent('*.feedback')
  async handleFeedback(event: FeedbackEvent): Promise<void>;

  // Validation
  async validateSyncStatus(): Promise<ValidationResult>;
  async reconcileData(): Promise<ReconciliationResult>;
}

// Sync monitoring
interface SyncMetrics {
  lastSync: Date;
  syncDuration: number;
  itemsSynced: number;
  errorCount: number;
  retryCount: number;
}

// Event handlers
@Injectable()
class GorseEventHandlers {
  @OnEvent('user.interaction')
  async handleUserInteraction(event: UserInteractionEvent): Promise<void>;

  @OnEvent('content.engagement')
  async handleContentEngagement(event: ContentEngagementEvent): Promise<void>;

  @OnEvent('user.preference')
  async handleUserPreference(event: UserPreferenceEvent): Promise<void>;
}
```

**Acceptance Criteria**:

1. Data Synchronization:
   - All existing users synced to Gorse
   - All content items synced to Gorse
   - All historical feedback synced
   - Real-time sync operational

2. Performance:
   - Initial sync completed within 24 hours
   - Real-time sync delay < 5 seconds
   - No data loss during sync
   - Proper error handling and retries

3. Monitoring:
   - Sync progress tracking
   - Error reporting
   - Performance metrics
   - Data validation tools

#### GRS-001.3: Recommendation Integration (2 points)

**Priority**: High
**Assignee**: TBD
**Dependencies**: GRS-001.1, GRS-001.2

**Technical Design**:

```typescript
// Recommendation service
@Injectable()
class RecommendationService {
  constructor(
    private readonly gorseClient: GorseClient,
    private readonly cache: CacheService,
    private readonly metrics: MetricsService
  ) {}

  // Core recommendation methods
  async getPersonalizedFeed(userId: string, options: FeedOptions): Promise<FeedResult>;
  async getPopularContent(options: PopularOptions): Promise<FeedResult>;
  async getLatestContent(options: LatestOptions): Promise<FeedResult>;
  async getSimilarContent(itemId: string, options: SimilarOptions): Promise<FeedResult>;

  // Feedback handling
  async recordInteraction(interaction: UserInteraction): Promise<void>;
  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<void>;

  // Cache management
  async warmCache(userIds: string[]): Promise<void>;
  async invalidateCache(pattern: string): Promise<void>;
}

// Feed options
interface FeedOptions {
  count: number;
  offset?: number;
  categories?: string[];
  excludeIds?: string[];
  diversity?: number;
}

// Feed result
interface FeedResult {
  items: RecommendedItem[];
  hasMore: boolean;
  cursor?: string;
  metrics: {
    latency: number;
    cacheHit: boolean;
    scoreDistribution: number[];
  };
}
```

**Acceptance Criteria**:

1. Functionality:
   - Personalized recommendations working
   - Popular content recommendations working
   - Similar content recommendations working
   - All feedback types processed correctly

2. Performance:
   - Recommendation latency < 100ms (p95)
   - Cache hit rate > 90%
   - Proper error handling
   - Graceful degradation

3. Integration:
   - Feed service integration complete
   - Notification service integration complete
   - Event handling operational
   - Monitoring operational

### Risk Assessment

1. **Technical Risks**:
   - Data synchronization performance
   - Recommendation quality
   - System resource usage
   - Cache coherency

2. **Mitigation Strategies**:
   - Phased rollout with feature flags
   - Comprehensive monitoring
   - A/B testing framework
   - Fallback mechanisms

3. **Rollback Plan**:
   - Feature flag disable
   - Data backup strategy
   - Cache invalidation plan
   - Communication plan

### Success Metrics

1. **System Performance**:
   - API latency < 100ms (p95)
   - Cache hit rate > 90%
   - Error rate < 1%
   - Sync delay < 5s

2. **Business Metrics**:
   - User engagement increase > 20%
   - Content discovery rate increase > 30%
   - Recommendation relevance score > 0.8
   - User satisfaction score > 4.0/5.0

#### GRS-001.4: Identity Module Event Integration (2 points)

**Metadata**:
  Type: Feature
  Component: Backend
  Priority: High
  Risk Level: Low
  Story Points: 2
  Sprint: Current
  Change Type: Enhancement

**Time Tracking**:
  Estimated Hours: 8
  Start Date: 2024-03-21
  Due Date: 2024-03-22

**Status**:
  State: In Progress
  Phase: Development
  Labels: [Integration-Heavy]
  Progress: 80%

**Integration Analysis**:
  Integration Type: Extends Existing
  Affected Systems:
    - Identity Module
    - Event Manager
    - Gorse Sync Service
  Current Implementation:
    - Identity module handles user CRUD operations
    - Event manager has base event infrastructure
    - Gorse sync service handles user synchronization
  Integration Points:
    - User creation/update in identity service
    - Event bus for publishing events
    - Gorse sync handler for consuming events
  Breaking Changes: None

**Quick Start**:
  Similar Feature: src/recommendation/entities/events/gorse-sync.events.ts
  Example Test: src/recommendation/services/gorse-sync.service.spec.ts
  Key Files:
    - src/identity/services/user.service.ts: User service to extend
    - src/identity/entities/events/user.events.ts: New event definitions
    - src/common/event-manager/entities/events/schemas/user.events.ts: New event schemas

**Description**:
Implement event publishing for user creation and updates in the identity module to enable automatic synchronization with Gorse.

**Context**:
  Feature Goal: Enable real-time user data synchronization with Gorse
  Similar Features: Gorse sync events
  Code Patterns: Event-driven architecture
  Common Pitfalls: Event schema validation, proper error handling
  Current Limitations: Manual sync only

**Implementation Guide**:
  Architecture Pattern: Event-driven
  Code Style: Follow event manager patterns
  Integration Requirements:
    - Define user events in identity module
    - Publish events on user operations
    - Handle errors appropriately
  Performance Requirements:
    - Event publishing < 50ms
    - No blocking operations

**Tasks**:

1. [✓] Analysis Phase
   - [✓] Review existing user service implementation
   - [✓] Document event schema requirements
   - [✓] Map integration points
2. [✓] Development Phase
   - [✓] Create user event schemas
   - [✓] Implement event publishing in user service
   - [✓] Add error handling
3. [⏳] Testing Phase
   - [✓] Unit tests for event publishing
   - [⏳] Integration tests with Gorse sync
   - [⏳] Error scenario testing

**Technical Notes**:

- Follow event naming convention: identity.user.{action}
- Include all necessary user data in events
- Handle transaction rollback on event failures
- Consider event versioning

**Quality Checklist**:

- [✓] Event schemas follow conventions
- [✓] Error handling implemented
- [⏳] Tests cover main scenarios
- [⏳] Documentation updated

**Acceptance Criteria**:

1. [✓] Events published for:
   - [✓] User creation
   - [✓] User profile updates
   - [✓] Role changes
2. [✓] Events contain correct user data
3. [✓] Error handling implemented
4. [⏳] Tests passing with good coverage

**Completed Items**:

- ✅ Event schemas created and tested
- ✅ Event classes implemented with proper validation
- ✅ User service updated to publish events
- ✅ Unit tests for user activity service
- ✅ Unit tests for user activity handler
- ✅ Error handling implemented

**Pending Items**:

- ⏳ Integration tests with Gorse sync
- ⏳ Error scenario testing
- ⏳ Documentation updates
- ⏳ Final test coverage review

#### GRS-001.5: Content Event Integration

**Status**: In Progress (90%)
**Phase**: Development

**Completed**:

- ✅ Created event schemas for content module (post events)
- ✅ Created event schemas for gamification module (emotion events)
- ✅ Moved emotion events from content to gamification module
- ✅ Updated event payloads with proper validation decorators
- ✅ Implemented GamificationEvents service for emotion events
- ✅ Cleaned up ContentEvents service to handle only post events
- ✅ Added proper exports in event-manager module
- ✅ Implemented proper module boundaries between content and gamification

**Pending**:

- Create tests for GamificationEvents service
- Update documentation with new event structure

**Integration Analysis**:

- ✅ Event Schema Requirements:

  ```typescript
  // Post Events
  class BasePostEventPayload {
    draftId: string;
    userId: string;
    title: string;
    slug: string;
    topics: string[];
  }

  class PostPublishedEventPayload extends BasePostEventPayload {
    publishedId: string;
  }

  class PostUpdatedEventPayload extends BasePostEventPayload {
    postId: string;
  }

  // Emotion Events (moved to gamification module)
  class BaseEmotionEventPayload {
    emotionId: string;
    userId: string;
    intensity: number;
    type: EmotionType;
  }
  ```

- ✅ Integration Points Mapping:
  - Content Service emits post events
  - Gamification Service emits emotion events
  - Gorse Sync Handler consumes these events

**Required Changes**:

- ✅ Event Definitions:
  - Created post event schemas in content module
  - Created emotion event schemas in gamification module
  - Added proper validation decorators
  - Added proper event metadata

- ✅ Service Methods:
  - Updated ContentEvents service for post events
  - Created GamificationEvents service for emotion events
  - Implemented proper event emission methods

- ✅ Event Handler:
  - Moved emotion event handling to gamification module
  - Maintained proper module boundaries

**Technical Notes**:

- Emotion events moved to gamification module for better module boundaries
- Common EmotionType enum created in event-manager for event payloads
- Event schemas follow consistent pattern across modules
- Proper validation decorators added to all event payloads

**Next Steps**:

1. Create unit tests for GamificationEvents service
2. Update documentation to reflect new event structure
3. Review and merge changes

#### GRS-001.6: View Event Integration (2 points)

**Status**: Complete (100%)
**Phase**: Review

**Completed**:

- ✅ Analyzed existing view tracking implementation
- ✅ Created view event schemas
- ✅ Implemented ContentViewedEvent class
- ✅ Updated SocialEngagementService to emit view events
- ✅ Added unit tests for view events
- ✅ Implemented proper event validation
- ✅ Created integration tests with Gorse sync
- ✅ Implemented rate limiting for view sync
- ✅ Added error handling and logging
- ✅ Updated documentation
  - ✅ API documentation in `/docs/api/social-engagement.md`
  - ✅ Event schema documentation in `/docs/events/social-events.md`
  - ✅ Integration guide with performance considerations

**Implementation Summary**:

1. Event Integration:
   - Created unified view event schema
   - Implemented event emission in SocialEngagementService
   - Added Gorse sync handler for view events
   - Added comprehensive test coverage

2. Performance Optimizations:
   - Batch processing for views (100 items, 8s timeout)
   - Rate limiting for Gorse sync (100 req/s)
   - Redis HyperLogLog for view deduplication
   - Error handling with graceful degradation

3. Documentation:
   - Detailed API documentation
   - Event schema reference
   - Performance considerations
   - Integration guide

**Technical Notes**:

- View deduplication uses 10-minute TTL
- Redis HyperLogLog for unique counting
- Event emission only for new views
- Support for both anonymous and authenticated views
- Rate limiting to prevent Gorse overload
- Graceful error handling to prevent event processing failures

**Next Steps**:

1. Code review
2. Performance testing in staging
3. Gradual rollout to production
4. Monitor error rates and performance
