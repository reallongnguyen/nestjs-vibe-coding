# Sprint 003 Planning

## Goals

- Implement comment system for post
- Rollout like, view tracking and comment for emotion
- Enhance content distribution system
- Implement CRUD for topic
- Technical debt reduction:
  - Refactor post like tracking to use Redis
  - Clean redis data regularly

## Tasks

### SOC-001: Implement Post Comment System Base

Status: Completed
Priority: High
Dependencies: None

### Context

- Currently, posts don't have a comment system
- Need to implement basic commenting functionality

### Requirements

- Allow users to create, read, update, and delete comments on posts
- Support markdown formatting
- Support threaded replies
- Require USER role
- Track comment counts on posts

### Acceptance Criteria

1. Users can create comments on posts
2. Users can reply to existing comments
3. Users can edit their own comments
4. Users can delete their own comments
5. Comment counts are updated correctly
6. Markdown formatting works correctly

### Technical Notes

- Implement in social module
- Use existing Comment model
- Follow CQRS pattern for commands

### Completion Notes

- Implemented full CRUD operations with proper authorization
- Added support for both user and bot authored comments
- Optimized database queries with field selection
- Added proper error handling and domain events

---

### SOC-002: Implement Comment Like System

Status: Completed
Priority: Medium
Dependencies: SOC-001

### Context

- Comments need engagement features
- Users should be able to like comments

### Requirements

- Allow users to like/unlike comments
- Track like counts on comments
- Update like counts in real-time
- Require USER role

### Acceptance Criteria

1. Users can like comments
2. Users can unlike comments
3. Like counts are updated correctly
4. Users can't like their own comments
5. Users can see who liked comments

### Technical Notes

- Implement in social module
- Use Redis for like tracking
- Follow batch processing pattern

### Completion Notes

- Implemented Redis-backed batch processing for likes
- Added optimistic concurrency control
- Implemented proper error handling
- Added transaction support for consistency

---

### SOC-003: Implement Social Engagement Core System

Status: Completed
Priority: High
Dependencies: None

### Context

- Currently engagement features (likes, views, comments) are scattered
- Need a unified system to handle social interactions for both posts and emotions

### Requirements

- Create unified interfaces for social engagement:
  - ILikeable for like functionality
  - IViewable for view tracking
  - ICommentable for comment functionality
- Implement base Redis handlers for:
  - Like tracking
  - View counting
  - Comment management
- Support different content types (posts, emotions)
- Respect privacy settings for each content type

### Acceptance Criteria

1. Common interface for likes works on both posts and emotions
2. Common interface for views works on both posts and emotions
3. Common interface for comments works on both posts and emotions
4. Privacy settings are respected for each content type
5. Redis handlers efficiently manage data
6. Batch processing works for all engagement types

### Technical Notes

- Create in social module
- Use interfaces to define engagement contracts
- Implement Redis handlers with generic types
- Use decorator pattern for privacy checks

### Completion Notes

- Implemented ILikeable, IViewable, and ICommentable interfaces
- Created base handlers with Redis integration for batch processing
- Added support for different content types (POST, EMOTION)
- Implemented efficient batch processing for likes and views
- Added transaction support for data consistency
- Created unified API endpoints for engagement operations

### API Specification

```typescript
// No direct API endpoints - this is a core system used by other components

// Interface definitions
interface ILikeable {
  like(userId: string): Promise<void>;
  unlike(userId: string): Promise<void>;
  getLikeCount(): Promise<number>;
  isLikedBy(userId: string): Promise<boolean>;
}

interface IViewable {
  view(viewerHash: string, viewerId?: string): Promise<void>;
  getViewCount(): Promise<number>;
}

interface ICommentable {
  comment(userId: string, content: string, parentId?: string): Promise<Comment>;
  getComments(options: PaginationOptions): Promise<Collection<Comment>>;
  getCommentCount(): Promise<number>;
}
```

### Sub-tasks

1. Create core interfaces:
   - Define ILikeable, IViewable, ICommentable interfaces
   - Create abstract base classes for each interface
   - Add unit tests for base implementations

2. Implement Redis handlers:
   - Create generic LikeHandler with Redis integration
   - Create generic ViewHandler with Redis integration
   - Create generic CommentHandler with database integration
   - Add unit tests for handlers

3. Implement privacy management:
   - Create privacy decorator for engagement operations
   - Implement privacy check strategies
   - Add unit tests for privacy checks

4. Create batch processors:
   - Implement generic batch processor for likes
   - Implement generic batch processor for views
   - Add monitoring and metrics
   - Add unit tests for batch processors

5. Add integration tests:
   - Test with mock content types
   - Test batch processing
   - Test privacy rules
   - Test error scenarios

---

### SOC-004: Implement Post Social Features

Status: To Do
Priority: Medium
Dependencies: SOC-003

### Context

- Core social engagement system is implemented
- Need to implement post-specific social features

### Requirements

- Implement post-specific social engagement features
- Integrate with existing post system
- Ensure proper event handling for social actions

### Acceptance Criteria

1. Posts can be liked and unliked
2. Post views are tracked
3. Post engagement statistics are available
4. Events are emitted for social actions
5. Batch processing works correctly

### Technical Notes

- Use the core social engagement system from SOC-003
- Implement any post-specific handlers not covered in SOC-003
- Add event handlers for post engagement events
- Ensure proper integration with the content module

### API Specification

```typescript
// Like a post
POST /api/v1/posts/{postId}/like
Response: 204 No Content

// Unlike a post
DELETE /api/v1/posts/{postId}/like
Response: 204 No Content

// View a post
POST /api/v1/posts/{postId}/view
Request: { viewerHash: string }
Response: 204 No Content

// Get post comments
GET /api/v1/posts/{postId}/comments
Query parameters: offset, limit
Response: Collection<CommentDto>

// Add comment to post
POST /api/v1/posts/{postId}/comments
Request: { content: string, parentId?: string }
Response: CommentDto
```

### Sub-tasks

1. Implement post like functionality:
   - Create PostLikeable class implementing ILikeable
   - Add Redis integration for like tracking
   - Add database sync for persistence
   - Add unit tests

2. Implement post view tracking:
   - Create PostViewable class implementing IViewable
   - Add Redis integration for view counting
   - Add database sync for persistence
   - Add unit tests

3. Implement post comment system:
   - Create PostCommentable class implementing ICommentable
   - Add support for threaded comments
   - Add support for Yoopta-Editor content
   - Add unit tests

4. Create API endpoints:
   - Add like/unlike endpoints
   - Add view tracking endpoint
   - Add comment endpoints
   - Add controller tests

5. Add integration tests:
   - Test like/unlike flows
   - Test view tracking
   - Test comment creation and threading
   - Test error scenarios

---

### SOC-005: Implement Emotion Social Features

Status: To Do
Priority: Medium
Dependencies: SOC-003

### Context

- Core social engagement system is implemented
- Need to implement emotion-specific social features

### Requirements

- Implement emotion-specific social engagement features
- Integrate with existing emotion system
- Ensure proper event handling for social actions

### Acceptance Criteria

1. Emotions can be liked and unliked
2. Emotion views are tracked
3. Emotion engagement statistics are available
4. Events are emitted for social actions
5. Batch processing works correctly

### Technical Notes

- Use the core social engagement system from SOC-003
- Create EmotionLikeHandler and EmotionViewHandler classes
- Add event handlers for emotion engagement events
- Ensure proper integration with the emotion module

### API Specification

```typescript
// Like an emotion
POST /api/v1/emotions/{emotionId}/like
Response: 204 No Content

// Unlike an emotion
DELETE /api/v1/emotions/{emotionId}/like
Response: 204 No Content

// View an emotion
POST /api/v1/emotions/{emotionId}/view
Request: { viewerHash: string }
Response: 204 No Content

// Get emotion comments
GET /api/v1/emotions/{emotionId}/comments
Query parameters: offset, limit
Response: Collection<CommentDto>

// Add comment to emotion
POST /api/v1/emotions/{emotionId}/comments
Request: { content: string, parentId?: string }
Response: CommentDto
```

### Sub-tasks

1. Implement emotion like functionality:
   - Create EmotionLikeable class implementing ILikeable
   - Add Redis integration for like tracking
   - Add privacy checks for like operations
   - Add unit tests

2. Implement emotion view tracking:
   - Create EmotionViewable class implementing IViewable
   - Add Redis integration for view counting
   - Add privacy checks for view operations
   - Add unit tests

3. Implement emotion comment system:
   - Create EmotionCommentable class implementing ICommentable
   - Add privacy checks for comment operations
   - Add support for threaded comments
   - Add unit tests

4. Create API endpoints:
   - Add like/unlike endpoints
   - Add view tracking endpoint
   - Add comment endpoints
   - Add controller tests

5. Add integration tests:
   - Test like/unlike flows with privacy settings
   - Test view tracking with privacy settings
   - Test comment creation with privacy settings
   - Test error scenarios

---

### TOP-001: Implement Topic CRUD Operations

Status: To Do
Priority: Medium
Dependencies: None

### Context

- Need complete topic management system
- Support for hierarchical topics

### Requirements

- Create, read, update, delete topics
- Support topic hierarchy
- Generate unique slugs
- Track topic usage

### Acceptance Criteria

1. Admins can create topics
2. Topics can be organized hierarchically
3. Topics can be updated and deleted
4. Slugs are generated correctly
5. Topic usage is tracked

### Technical Notes

- Implement in content module
- Use existing Topic model
- Add migration for new fields

### API Specification

```typescript
// Create topic
POST /api/v1/topics
Request: {
  name: string;
  description?: string;
  parentId?: string;
}
Response: TopicDto

// Get topic by id
GET /api/v1/topics/{id}
Response: TopicDto

// Get all topics
GET /api/v1/topics
Query parameters: offset, limit, parentId
Response: Collection<TopicDto>

// Update topic
PATCH /api/v1/topics/{id}
Request: {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
}
Response: TopicDto

// Delete topic
DELETE /api/v1/topics/{id}
Response: 204 No Content
```

### Sub-tasks

1. Create module structure:
   - Set up folder structure in content module
   - Create migration for topic hierarchy fields
   - Define interfaces and DTOs
   - Add repository interface

2. Implement data layer:
   - Create topic repository
   - Add slug generation logic
   - Add hierarchy management
   - Add repository tests

3. Implement business logic:
   - Create topic service
   - Add validation logic
   - Add error handling
   - Add service unit tests

4. Create API endpoints:
   - Add CRUD endpoints
   - Add authentication and authorization
   - Add input validation
   - Add controller tests

5. Add integration tests:
   - Test CRUD operations
   - Test hierarchy management
   - Test slug generation
   - Test error scenarios

---

### TECH-001: Migrate Post Likes to Redis

Status: Cancelled
Priority: High
Dependencies: None

### Context

- Current post like system needs optimization
- Redis will improve performance

### Requirements

- Move like tracking to Redis
- Implement batch processing
- Ensure data consistency
- Add monitoring

### Acceptance Criteria

1. Likes are stored in Redis
2. Batch processing works correctly
3. Data is consistent
4. Performance is improved
5. Monitoring is in place

### Technical Notes

- Use Redis Sorted Sets
- Implement batch processor
- Add health checks

### Sub-tasks

1. Design Redis schema:
   - Define key structure for likes
   - Define batch processing approach
   - Create migration plan
   - Document Redis schema

2. Implement Redis storage:
   - Create Redis repository for likes
   - Add batch processor
   - Add monitoring hooks
   - Add unit tests

3. Create migration script:
   - Add script to migrate existing likes
   - Add validation checks
   - Add rollback capability
   - Test migration process

4. Update post like service:
   - Modify service to use Redis
   - Add database sync logic
   - Add error handling
   - Add service unit tests

5. Add monitoring and health checks:
   - Add Redis health check
   - Add batch processing metrics
   - Add performance monitoring
   - Add alerting for failures

---

### TECH-002: Implement Redis Data Cleanup

Status: Cancelled
Priority: Medium
Dependencies: TECH-001

### Context

- Need to manage Redis data growth
- Implement cleanup procedures

### Requirements

- Regular cleanup of old data
- TTL for cached items
- Monitoring and alerts
- Recovery procedures

### Acceptance Criteria

1. Old data is cleaned up
2. TTL is enforced
3. Alerts work correctly
4. Recovery works correctly

### Technical Notes

- Use Redis TTL features
- Implement cleanup job
- Add monitoring

### Sub-tasks

1. Design cleanup strategy:
   - Define TTL policies for different data types
   - Create cleanup schedule
   - Define monitoring requirements
   - Document cleanup strategy

2. Implement TTL management:
   - Add TTL to Redis keys
   - Create TTL enforcement service
   - Add unit tests
   - Add monitoring

3. Create cleanup job:
   - Implement scheduled cleanup job
   - Add logging and metrics
   - Add error handling
   - Add job tests

4. Implement recovery procedures:
   - Create data recovery service
   - Add consistency checks
   - Add manual recovery tools
   - Test recovery scenarios

5. Add monitoring and alerts:
   - Add Redis memory monitoring
   - Add cleanup job monitoring
   - Add alerts for failures
   - Add dashboard for Redis health
