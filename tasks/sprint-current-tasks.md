# Sprint 007: Notification System Foundation

## Sprint Overview

**Sprint Goal:** Implement the foundation for the notification system and enhance imgproxy monitoring.

**Sprint Duration:** 2 weeks
**Total Story Points:** 14
**Start Date:** 2024-03-21
**End Date:** 2024-04-04

## Tasks

### NOT-003.1: Event System Migration

**Metadata**:
  Type: Infrastructure
  Component: Backend
  Priority: High
  Risk Level: Medium
  Story Points: 5
  Sprint: 007

**Time Tracking**:
  Estimated Hours: 20
  Start Date: 2024-03-21
  Due Date: 2024-03-26

**Status**:
  State: Done
  Phase: Done
  Labels: []

**Quick Start**:
  Similar Feature: src/common/event-manager
  Example Test: src/common/event-manager/tests/
  Key Files:
    - src/common/event-manager/core/
    - src/common/event-manager/adapters/
    - src/social/events/
  Setup Steps:
    1. Review event system documentation
    2. Set up test environment
    3. Create event schemas

**Dependencies**:
  Blocks: [NOT-003.2, NOT-003.3]
  Blocked By: []
  Related: []

**Description**:
Migrate social interaction events to a standardized event system with type safety and validation.

**Context**:
  Feature Goal: Create a type-safe foundation for all notification events
  Similar Features: User events in identity module
  Code Patterns: Registry pattern, Event schema validation
  Common Pitfalls:
    - Breaking changes in event structure
    - Missing validation cases
    - Performance impact of validation
    - Type safety gaps

**Implementation Guide**:
  Architecture Pattern: Registry pattern with validation
  Code Style: Follow event-manager patterns
  Performance Requirements:
    - Event validation overhead < 1ms
    - Event publishing latency < 10ms

**Tasks**:

1. [ ] Create event schemas
   - Define base event interface
   - Create social event types
   - Add validation decorators
2. [ ] Implement event validation
   - Add schema validation
   - Add type guards
   - Create validation tests
3. [ ] Update event publishers
   - Migrate existing publishers
   - Add type safety
   - Update error handling
4. [ ] Add comprehensive testing
   - Unit tests for schemas
   - Integration tests for validation
   - Performance tests
5. [ ] Create documentation
   - Update event system docs
   - Add migration guide
   - Document new patterns

**Technical Notes**:

- Use class-validator for schema validation
- Implement proper versioning for events
- Add comprehensive validation
- Include proper metadata

**Quality Checklist**:

- [x] Technical Design Review
- [x] Implementation Complete
- [x] Unit Tests Added
- [x] Integration Tests Added
- [x] Documentation Updated
- [x] Code Review Completed
- [x] Performance Requirements Met

**Acceptance Criteria**:

1. All social events use new event system
2. Type safety is enforced at compile time
3. Runtime validation is in place
4. No breaking changes for existing consumers
5. Documentation is complete and accurate

### NOT-003.2: Like Notification Implementation

**Metadata**:
  Type: Feature
  Component: Backend
  Priority: High
  Risk Level: Low
  Story Points: 3
  Sprint: 007
  Change Type: Integration

**Time Tracking**:
  Estimated Hours: 12
  Start Date: 2024-03-26
  Due Date: 2024-03-29

**Status**:
  State: In Progress
  Phase: Development
  Labels: [Backend, Notification, Integration-Heavy]

**Integration Analysis**:
  Integration Type: Extends Existing
  Affected Systems:
    - Notification Module (Producer, Consumer, Delivery)
    - Social Module (Like events)
    - Template System
  Current Implementation:
    - NotificationProducerService: Converts events to notifications
    - NotificationConsumerService: Groups and processes notifications
    - NotificationDeliveryService: Handles multi-channel delivery
    - Current grouping uses key field for aggregation
    - Templates support multiple languages
  Integration Points:
    - Social events to notification pipeline
    - Template rendering system
    - MQTT delivery system
    - User preference system
  Breaking Changes: None

**Quick Start**:
  Similar Feature: src/notification/comment-notification
  Example Test: src/notification/tests/notification.service.spec.ts
  Key Files:
    - src/notification/services/notification-producer.service.ts: Handles event to notification conversion
    - src/notification/services/notification-consumer.service.ts: Manages grouping and processing
    - src/notification/services/notification-delivery.service.ts: Handles delivery
    - src/social/events/social-interaction.events.ts: Social event definitions
  Setup Steps:
    1. Review notification pipeline documentation
    2. Understand current grouping mechanism
    3. Review template system
  Required Reading:
    - /docs/technical.md#notification-system-architecture
    - /docs/module-structure.md
    - Current notification templates

**Pre-Implementation Checklist**:
  Code Analysis:
    - [ ] Review notification pipeline flow
    - [ ] Understand current grouping mechanism
    - [ ] Review template system
    - [ ] Check existing event handlers
    - [ ] Verify integration points
  Design Review:
    - [ ] Confirm alignment with notification architecture
    - [ ] Verify grouping strategy
    - [ ] Check performance impact
    - [ ] Review security implications
  Integration Planning:
    - [ ] Map event to notification flow
    - [ ] Plan template integration
    - [ ] Define delivery configuration

**Dependencies**:
  Blocks: []
  Blocked By: [NOT-003.1]
  Related: []

**Description**:
Implement real-time notifications for post and emotion likes with proper grouping and delivery.

**Context**:
  Feature Goal: Notify users when their content receives likes
  Similar Features: Comment notifications
  Code Patterns: Event handlers, MQTT publishing
  Common Pitfalls:
    - Race conditions
    - Notification spam
    - Missing error handling
    - Performance issues

**Implementation Guide**:
  Architecture Pattern: Event-driven with MQTT
  Code Style: Follow notification module patterns
  Performance Requirements:
    - Notification delivery < 1s
    - Grouping window < 5s

  **Notification Flow Guidelines**:

  1. Producer Stage (NotificationProducerService):
     - Create PostLikedEvent with required fields:
       - likerId, likerName, likerAvatar
       - postId, postTitle, postOwnerId
     - Implement handlePostLiked method:
       - Generate unique grouping key: `likePost:${postId}`
       - Set notification type as 'likePost'
       - Configure subjects array with liker info
       - Set diObject with post details
       - Add deep link to post
     - Use proper queue configuration:
       - Set retry attempts: 3
       - Configure timeout: 60s
       - Use exponential backoff

  2. Consumer Stage (NotificationConsumerService):
     - Implement grouping strategy:
       - Group by postId within time window
       - Maintain subject order
       - Handle concurrent likes
     - Add template rendering:
       - Support multiple languages
       - Handle subject count variations
       - Include proper content escaping
     - Use RedLock for concurrency:
       - Set appropriate lock timeout
       - Handle lock failures
       - Implement retry logic

  3. Delivery Stage (NotificationDeliveryService):
     - Configure MQTT delivery:
       - Set proper QoS level
       - Implement timeout handling
       - Add retry mechanism
     - Handle delivery tracking:
       - Log delivery attempts
       - Record success/failure
       - Monitor performance

**Tasks**:

1. [ ] Create notification handlers
   - Implement PostLikedEvent handler
   - Configure notification grouping
   - Set up template rendering
   - Add error handling

2. [ ] Add notification templates
   - Create base templates
   - Add language variations
   - Implement preview logic
   - Test rendering

3. [ ] Implement delivery system
   - Configure MQTT topics
   - Set up retry logic
   - Add monitoring
   - Handle errors

4. [ ] Add testing
   - Test event handling
   - Verify grouping logic
   - Check delivery flow
   - Load test system

**Technical Notes**:

- Follow the three-stage pipeline: Producer → Consumer → Delivery
- Use proper error handling at each stage
- Implement comprehensive logging
- Monitor performance metrics
- Follow existing patterns in codebase

**Common Pitfalls to Avoid**:

1. Producer Stage:
   - Missing event fields
   - Incorrect grouping keys
   - Queue configuration issues
   - Error handling gaps

2. Consumer Stage:
   - Race conditions in grouping
   - Template rendering errors
   - Lock handling issues
   - Database performance

3. Delivery Stage:
   - Channel timeout issues
   - Missing retry logic
   - Resource leaks
   - Monitoring gaps

**Quality Checklist**:

- [ ] Technical Design Review
- [ ] Implementation Complete
- [ ] Unit Tests Added
- [ ] Integration Tests Added
- [ ] Documentation Updated
- [ ] Code Review Completed
- [ ] Performance Requirements Met

**Acceptance Criteria**:

1. Users receive notifications for likes
2. Multiple likes are properly grouped
3. Notifications are delivered in real-time
4. User preferences are respected
5. System handles high volume efficiently

### NOT-003.3: Comment Notification Implementation

**Metadata**:
  Type: Feature
  Component: Backend
  Priority: High
  Risk Level: Low
  Story Points: 3
  Sprint: 007

**Time Tracking**:
  Estimated Hours: 12
  Start Date: 2024-03-29
  Due Date: 2024-04-02

**Status**:
  State: To Do
  Phase: Planning
  Labels: []

**Quick Start**:
  Similar Feature: src/notification/like-notification
  Example Test: src/notification/tests/comment-notification.spec.ts
  Key Files:
    - src/notification/services/
    - src/social/events/
  Setup Steps:
    1. Review comment system
    2. Set up test data
    3. Configure templates

**Dependencies**:
  Blocks: []
  Blocked By: [NOT-003.1]
  Related: [NOT-003.2]

**Description**:
Implement notifications for post comments and replies with content preview and deep linking.

**Context**:
  Feature Goal: Notify users of comments on their content
  Similar Features: Like notifications
  Code Patterns: Event handlers, Content preview
  Common Pitfalls:
    - Long comment handling
    - Markdown processing
    - Deep linking complexity
    - Notification spam

**Implementation Guide**:
  Architecture Pattern: Event-driven with preview
  Code Style: Follow notification patterns
  Performance Requirements:
    - Preview generation < 100ms
    - Notification delivery < 1s

**Tasks**:

1. [ ] Create notification handlers
   - Implement comment handlers
   - Add reply detection
   - Create preview generator
2. [ ] Add notification templates
   - Design message templates
   - Add comment preview
   - Create deep links
3. [ ] Implement delivery system
   - Add MQTT publishing
   - Implement retry logic
   - Add error handling
4. [ ] Add testing
   - Unit tests for handlers
   - Integration tests for preview
   - Load tests for delivery

**Technical Notes**:

- Handle markdown in previews
- Implement proper truncation
- Add mention detection
- Include deep linking

**Quality Checklist**:

- [ ] Technical Design Review
- [ ] Implementation Complete
- [ ] Unit Tests Added
- [ ] Integration Tests Added
- [ ] Documentation Updated
- [ ] Code Review Completed
- [ ] Performance Requirements Met

**Acceptance Criteria**:

1. Users receive comment notifications
2. Comment previews are properly formatted
3. Deep links work correctly
4. Mentions are detected and handled
5. System handles high volume efficiently

### NOT-003.4: Implement Redis Counter Service

**Metadata**:
  Type: Technical
  Component: Backend
  Priority: High
  Risk Level: Medium
  Story Points: 3
  Sprint: 007

**Time Tracking**:
  Estimated Hours: 12
  Start Date: 2024-03-22
  Due Date: 2024-03-25

**Status**:
  State: In Progress
  Phase: Development
  Labels: [Backend, Redis]

**Quick Start**:
  Similar Feature: src/social/services/feed-cache.service.ts
  Example Test: src/social/services/**tests**/feed-cache.service.spec.ts
  Key Files:
    - src/notification/services/notification-counter.service.ts
    - src/notification/services/**tests**/notification-counter.service.spec.ts
  Setup Steps:
    1. Review Redis configuration
    2. Set up test Redis instance
    3. Implement counter service
    4. Add unit tests

**Dependencies**:
  Blocks: NOT-003.5
  Blocked By: None
  Related: NOT-003.TEST.1

**Description**:
Implement a Redis-based counter service for tracking notification-related metrics and detecting milestones. This service will be used to track various counters like likes, comments, and views, with support for atomic operations and expiration.

**Context**:
  Feature Goal: Track notification metrics efficiently using Redis
  Similar Features: Feed cache service in social module
  Code Patterns: Redis atomic operations, key expiration
  Common Pitfalls:
    - Race conditions in counter updates
    - Key expiration management
    - Memory usage optimization
    - Error handling for Redis failures

**Implementation Guide**:
  Architecture Pattern: Repository pattern with Redis
  Code Style: Follow notification module patterns
  Performance Requirements:
    - Counter operations < 10ms
    - Memory usage < 100MB
    - Atomic operations for accuracy

**Tasks**:

1. [ ] Create NotificationCounterService
   - Implement increment/decrement operations
   - Add atomic counter operations
   - Implement key expiration
   - Add error handling
2. [ ] Add unit tests
   - Test counter operations
   - Test expiration handling
   - Test error scenarios
   - Test concurrent operations
3. [ ] Add integration tests
   - Test with Redis instance
   - Test milestone detection
   - Test performance requirements
4. [ ] Add documentation
   - API documentation
   - Usage examples
   - Performance considerations

**Technical Notes**:

- Use Redis MULTI for atomic operations
- Implement proper key namespacing
- Add retry mechanism for Redis operations
- Consider memory usage patterns
- Implement proper cleanup for expired keys

**Quality Checklist**:

- [ ] Counter operations are atomic
- [ ] Error handling is comprehensive
- [ ] Tests cover edge cases
- [ ] Documentation is complete
- [ ] Performance requirements are met

**Acceptance Criteria**:

1. Counter operations work correctly
   - Increment/decrement are atomic
   - Values are persisted correctly
   - Expiration works as expected
2. Milestone detection is accurate
   - Thresholds are detected correctly
   - No false positives/negatives
   - Events are emitted properly
3. Error handling is robust
   - Redis failures are handled
   - Retries work correctly
   - Error reporting is clear
4. Performance meets requirements
   - Operations complete in < 10ms
   - Memory usage is optimized
   - No memory leaks

**Notes**:

- Consider implementing a cleanup job for expired keys
- Add monitoring for counter operations
- Document key naming conventions
- Consider implementing a backup strategy

### NOT-003.5: Remove Redundant Notification Grouping Fields

**Metadata**:
  Type: Technical Debt
  Component: Backend
  Priority: Medium
  Risk Level: Low
  Story Points: 1
  Sprint: 007

**Time Tracking**:
  Estimated Hours: 4
  Start Date: 2024-04-03
  Due Date: 2024-04-04

**Status**:
  State: To Do
  Phase: Planning
  Labels: [Backend, Database, Cleanup]

**Quick Start**:
  Similar Feature: N/A
  Example Test: src/notification/tests/notification.service.spec.ts
  Key Files:
    - prisma/schema.prisma
    - src/notification/services/notification-consumer.service.ts
  Setup Steps:
    1. Review current notification grouping
    2. Create database migration
    3. Update affected code

**Dependencies**:
  Blocks: []
  Blocked By: [NOT-003.2, NOT-003.3]
  Related: []

**Description**:
Remove redundant grouping fields (groupKey, groupCount, lastEventId) from notification table as we're using the key field for grouping functionality.

**Context**:
  Feature Goal: Simplify notification data model
  Similar Features: N/A
  Code Patterns: Database migration
  Common Pitfalls:
    - Data migration issues
    - Breaking changes
    - Missing field references
    - Migration rollback

**Implementation Guide**:
  Architecture Pattern: Database migration
  Code Style: Follow Prisma migration patterns
  Performance Requirements:
    - Migration runtime < 5min
    - No service downtime

**Tasks**:

1. [ ] Create database migration
   - Remove groupKey column
   - Remove groupCount column
   - Remove lastEventId column
   - Update indexes

2. [ ] Update notification service
   - Remove unused field references
   - Update tests if needed
   - Verify grouping still works

3. [ ] Test migration
   - Test on staging data
   - Verify rollback works
   - Check performance impact

4. [ ] Update documentation
   - Update schema docs
   - Update API docs if needed
   - Document migration process

**Technical Notes**:

- Current grouping uses key field with Hash index
- groupKey and related fields are unused
- Migration should be backward compatible
- Consider data volume for migration time

**Quality Checklist**:

- [ ] Technical Design Review
- [ ] Migration Script Created
- [ ] Tests Updated
- [ ] Migration Tested
- [ ] Documentation Updated
- [ ] Code Review Completed
- [ ] Performance Verified

**Acceptance Criteria**:

1. Redundant fields removed from schema
2. Migration runs successfully
3. Notification grouping works as before
4. No impact on existing functionality
5. Documentation is updated

### INF-002: Implement imgproxy Monitoring

**Metadata**:
  Type: Infrastructure
  Component: Infrastructure
  Priority: Medium
  Risk Level: Low
  Story Points: 3
  Sprint: 007

**Time Tracking**:
  Estimated Hours: 12
  Start Date: 2024-03-21
  Due Date: 2024-04-04

**Status**:
  State: To Do
  Phase: Planning
  Labels: []

**Quick Start**:
  Similar Feature: infra/grafana/dashboards/
  Example Test: N/A
  Key Files:
    - infra/grafana/dashboards/imgproxy.json
    - infra/prometheus/imgproxy.rules.yml
  Setup Steps:
    1. Enable Prometheus metrics
    2. Configure scraping
    3. Create dashboard

**Dependencies**:
  Blocks: []
  Blocked By: []
  Related: []

**Description**:
Create comprehensive monitoring for imgproxy service including metrics, dashboards, and alerts.

**Context**:
  Feature Goal: Ensure reliable operation of imgproxy service
  Similar Features: Existing service monitoring
  Code Patterns: Prometheus metrics, Grafana dashboards
  Common Pitfalls:
    - Missing critical metrics
    - Alert fatigue
    - Dashboard performance
    - Metric cardinality

**Implementation Guide**:
  Architecture Pattern: Prometheus + Grafana
  Code Style: Follow monitoring standards
  Performance Requirements:
    - Metric collection interval: 15s
    - Dashboard refresh rate: 1m
    - Alert notification latency < 1m

**Tasks**:

1. [ ] Configure metrics collection
   - Enable Prometheus endpoint
   - Configure metric labels
   - Set up scraping
2. [ ] Create Grafana dashboard
   - System metrics
   - Application metrics
   - Error rates
   - Resource utilization
3. [ ] Configure alerting
   - Define alert rules
   - Set up notifications
   - Add documentation
4. [ ] Add testing
   - Verify metric collection
   - Test alert rules
   - Load test dashboard

**Technical Notes**:

- Use official imgproxy metrics
- Follow Grafana best practices
- Implement proper thresholds
- Consider metric cardinality

**Quality Checklist**:

- [ ] Technical Design Review
- [ ] Implementation Complete
- [ ] Metrics Configured
- [ ] Dashboard Created
- [ ] Alerts Configured
- [ ] Documentation Updated
- [ ] Performance Verified

**Acceptance Criteria**:

1. All critical metrics are collected
2. Dashboard shows system health
3. Alerts fire appropriately
4. Documentation is complete
5. Performance impact is minimal
