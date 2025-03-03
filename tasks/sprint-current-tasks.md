# Sprint 006 Planning: User Notification System and Image Processing Optimization

## Sprint Overview

**Sprint Goal:** Implement the User Notification System and deploy imgproxy for image processing optimization to enhance user experience and performance.

**Sprint Duration:** 2 weeks

**Story Points:** 34

## Team Roles and Responsibilities

- **Product Owner:** Define requirements, acceptance criteria, and prioritize tasks
- **Technical Leader:** Provide technical guidance, review architecture, and ensure code quality
- **Developers:** Implement features, write tests, and ensure code quality
- **Scrum Master:** Facilitate sprint planning, daily standups, and remove impediments

## Tasks Breakdown

### NOT-001: User Notification System Implementation (13 points)

**Status:** In Progress
**Priority:** High
**Dependencies:** NOT-000 (Completed)
**Assignee:** Backend Developer
**Reviewer:** Technical Leader

**Description:**
Implement a comprehensive notification system with real-time delivery, grouping, and preference management. Users should receive notifications for various social interactions and system events, with support for multiple delivery channels and customizable preferences.

**Requirements:**

- Implement notification features using the refactored DDD architecture from NOT-000
- Users should receive notifications for:
  - Likes on their posts and emotions
  - Comments on their posts and emotions
  - Mentions in posts/comments
  - System announcements and important updates
- Support multiple delivery channels:
  - In-app notifications (primary)
  - MQTT real-time delivery using existing infrastructure
  - Email notifications for important updates (optional)
- Implement notification grouping for high-volume activities
- Add notification preferences with granular control

#### Sub-Tasks

##### NOT-001.1: Notification Domain Models and DTOs (2 points)

**Status:** Partially Completed
**Priority:** High
**Assignee:** Backend Developer

**Description:**
Complete the domain models and DTOs for the notification system, following the DDD architecture.

**Current Implementation:**

- Basic notification entity is implemented with fields for id, key, type, userId, subjects, text, decorators, link, etc.
- Basic DTOs are implemented for notification creation and output
- MQTT integration is set up for real-time delivery
- Notification grouping logic is partially implemented in the consumer service

**Tasks:**

1. ✅ Create notification entity with required properties
2. Create notification preference domain model
3. ✅ Create notification template model (basic implementation exists)
4. ✅ Implement input DTOs with validation (basic implementation exists)
5. ✅ Implement output DTOs with Swagger documentation (basic implementation exists)
6. Add domain models following DDD architecture (currently using entities directly)

**Technical Notes:**

- Follow the domain model patterns established in the social module
- Use class-validator for input validation
- Use Swagger decorators for API documentation
- Implement fromDomain methods for output DTOs
- Move from entity-based to domain-model-based architecture

**Acceptance Criteria:**

- All domain models are properly defined with required properties
- Input DTOs include proper validation rules
- Output DTOs include proper Swagger documentation
- All models follow the established naming conventions
- Unit tests cover all models and DTOs

##### NOT-001.2: Notification Preferences Management (2 points)

**Status:** Not Started
**Priority:** High
**Assignee:** Backend Developer

**Description:**
Implement the notification preferences management system to allow users to control which notifications they receive and through which channels.

**Tasks:**

1. Create preference repository interface and implementation
2. Implement preference service with CRUD operations
3. Create API endpoints for preference management
4. Add validation and error handling
5. Implement unit and integration tests

**Technical Notes:**

- Use repository pattern with proper dependency injection
- Implement efficient database queries with proper indexing
- Add proper error handling with custom error classes

**API Endpoints:**

- `GET /notifications/preferences` - Get user notification preferences
- `POST /notifications/preferences` - Create a notification preference
- `GET /notifications/preferences/:type` - Get preference for a specific notification type
- `PUT /notifications/preferences/:type` - Update preference for a specific notification type

**Acceptance Criteria:**

- Users can view their notification preferences
- Users can create new notification preferences
- Users can update existing notification preferences
- Proper validation and error handling is implemented
- Unit and integration tests cover all functionality

##### NOT-001.3: Notification Grouping Logic Enhancement (2 points)

**Status:** Partially Completed
**Priority:** High
**Assignee:** Backend Developer

**Description:**
Enhance the existing notification grouping logic to efficiently handle high-volume activities and provide a better user experience.

**Current Implementation:**

- Basic grouping logic exists in the NotificationConsumerService
- Notifications with the same key are merged if they occur within a configurable time threshold
- Subject lists are combined when merging notifications

**Tasks:**

1. Enhance grouping strategies for different notification types
2. Improve group processors for handling grouped notifications
3. Optimize group update mechanisms for real-time updates
4. Add performance optimizations for high-volume scenarios
5. Create comprehensive unit and integration tests

**Technical Notes:**

- Leverage the existing mutex implementation for concurrent updates
- Improve batch processing for group updates
- Optimize database queries with proper indexing
- Implement caching strategies for frequently accessed groups

**Acceptance Criteria:**

- Notifications are properly grouped by type and source
- Group updates are processed efficiently
- Performance is optimized for high-volume scenarios
- Unit and integration tests verify grouping logic
- Grouping works correctly for social interactions (likes, comments, etc.)

##### NOT-001.4: Real-time Notification Delivery Enhancement (2 points)

**Status:** Partially Completed
**Priority:** High
**Assignee:** Backend Developer

**Description:**
Enhance the existing real-time notification delivery system using MQTT to ensure users receive notifications promptly and reliably.

**Current Implementation:**

- Basic MQTT integration exists in the EventSubscriber
- Notifications are sent to user-specific MQTT topics
- Bull queue is used for processing notifications asynchronously

**Tasks:**

1. ✅ Set up MQTT integration using the common module client (completed)
2. Enhance delivery service with improved error handling
3. Implement comprehensive retry mechanism for failed deliveries
4. Add detailed monitoring and logging for delivery performance
5. Implement unit and integration tests for delivery reliability

**Technical Notes:**

- Leverage the existing MQTT client configuration
- Implement improved connection pooling for performance
- Enhance error handling with sophisticated retry logic
- Add comprehensive monitoring for delivery performance
- Implement queue management for handling delivery backlog

**Acceptance Criteria:**

- Notifications are delivered reliably in real-time via MQTT
- Delivery failures are properly handled with intelligent retries
- Monitoring provides detailed visibility into delivery performance
- Delivery time is consistently within 5 seconds for normal operations
- Unit and integration tests verify delivery reliability under various conditions

##### NOT-001.5: Notification Templates Management (2 points)

**Status:** Partially Completed
**Priority:** Medium
**Assignee:** Backend Developer

**Description:**
Enhance the notification templates management system to standardize notification content and support multiple languages.

**Current Implementation:**

- Basic template system exists with Handlebars for template rendering
- Templates are defined in a static object in notification.template.ts
- Basic decorator system exists for rich text formatting

**Tasks:**

1. Create dynamic template storage system with versioning
2. Enhance template validation and rendering
3. Add hot reload capability for template updates
4. Create admin API endpoints for template management
5. Implement unit and integration tests

**Technical Notes:**

- Leverage the existing Handlebars integration
- Implement database storage for templates instead of static objects
- Add validation for template syntax and variables
- Implement caching for frequently used templates

**API Endpoints:**

- `GET /notifications/templates` - Get all notification templates
- `POST /notifications/templates` - Create a notification template
- `GET /notifications/templates/:id` - Get a specific template by ID
- `PUT /notifications/templates/:id` - Update a specific template
- `DELETE /notifications/templates/:id` - Delete a template

**Acceptance Criteria:**

- Templates can be created, updated, and deleted by admins
- Template versioning tracks changes over time
- Hot reload updates templates without service restart
- Template validation prevents invalid templates
- Unit and integration tests verify template functionality

##### NOT-001.6: Social Interaction Notification Triggers (3 points)

**Status:** Partially Completed
**Priority:** High
**Assignee:** Backend Developer

**Description:**
Implement comprehensive notification triggers for social interactions such as likes, comments, and mentions to ensure users are notified of relevant activities.

**Current Implementation:**

- Basic event subscriber exists with a demo implementation for profile updates
- Event handling infrastructure is in place
- Producer service has a method for handling profile updates

**Tasks:**

1. Implement event handlers for likes, comments, and mentions
2. Create notification content generators for each interaction type
3. Add notification routing logic based on user preferences
4. Implement user-specific filtering for notifications
5. Create comprehensive unit and integration tests

**Technical Notes:**

- Leverage the existing event-driven architecture
- Implement efficient content generation for notifications
- Add proper error handling for event processing
- Implement batching for high-volume events

**Event Handlers:**

- `PostLikedNotificationEvent` - Handle post like notifications
- `CommentAddedNotificationEvent` - Handle comment notifications
- `UserMentionedNotificationEvent` - Handle mention notifications

**Acceptance Criteria:**

- Users receive notifications for likes on their posts
- Users receive notifications for comments on their posts
- Users receive notifications for mentions in posts and comments
- Notifications respect user preferences
- Unit and integration tests verify notification triggers

**API Specification:**

1. Notification Endpoints:
   - `GET /notifications` - Get user notifications with filtering and pagination
   - `GET /notifications/stats` - Get notification statistics (total, unread, by type)
   - `GET /notifications/:id` - Get a specific notification by ID
   - `POST /notifications/:id/read` - Mark a notification as read/unread
   - `POST /notifications/read-all` - Mark all notifications as read
   - `POST /notifications/batch-update` - Batch update notifications (admin only)
   - `DELETE /notifications/:id` - Delete a notification

2. Notification Preferences Endpoints:
   - `GET /notifications/preferences` - Get user notification preferences
   - `POST /notifications/preferences` - Create a notification preference
   - `GET /notifications/preferences/:type` - Get preference for a specific notification type
   - `PUT /notifications/preferences/:type` - Update preference for a specific notification type

3. Notification Templates Endpoints (Admin only):
   - `GET /notifications/templates` - Get all notification templates
   - `POST /notifications/templates` - Create a notification template
   - `GET /notifications/templates/:id` - Get a specific template by ID
   - `PUT /notifications/templates/:id` - Update a specific template
   - `DELETE /notifications/templates/:id` - Delete a template

**Event Interfaces:**

```typescript
// Existing events
export class NotificationCreatedEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly content: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class NotificationReadEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class AllNotificationsReadEvent extends BaseEvent {
  constructor(
    public readonly userId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

// New events
export class NotificationGroupUpdatedEvent extends BaseEvent {
  constructor(
    public readonly groupingKey: string,
    public readonly notificationIds: string[],
    public readonly userId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class NotificationTemplateCreatedEvent extends BaseEvent {
  constructor(
    public readonly templateId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly version: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class NotificationTemplateUpdatedEvent extends BaseEvent {
  constructor(
    public readonly templateId: string,
    public readonly version: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class NotificationContentUpdatedEvent extends BaseEvent {
  constructor(
    public readonly notificationId: string,
    public readonly content: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

// Social interaction events
export class PostLikedNotificationEvent extends BaseEvent {
  constructor(
    public readonly postId: string,
    public readonly postOwnerId: string,
    public readonly likerId: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class CommentAddedNotificationEvent extends BaseEvent {
  constructor(
    public readonly commentId: string,
    public readonly postId: string,
    public readonly postOwnerId: string,
    public readonly commenterId: string,
    public readonly commentText: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}

export class UserMentionedNotificationEvent extends BaseEvent {
  constructor(
    public readonly contentId: string,
    public readonly contentType: 'post' | 'comment',
    public readonly mentionedUserId: string,
    public readonly mentioningUserId: string,
    public readonly contentText: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }
}
```

**Command Interfaces:**

```typescript
// Existing commands
export interface CreateNotificationCommand {
  userId: string;
  type: string;
  content: Record<string, unknown>;
  sourceId?: string;
  sourceType?: string;
  priority?: 'low' | 'normal' | 'high';
  groupingKey?: string;
  channels?: string[];
}

export interface MarkNotificationReadCommand {
  notificationId: string;
  userId: string;
}

export interface MarkAllNotificationsReadCommand {
  userId: string;
}

// New commands
export interface CreateNotificationGroupCommand {
  userId: string;
  groupingKey: string;
  type: string;
  initialContent: Record<string, unknown>;
  sourceId?: string;
  sourceType?: string;
  priority?: 'low' | 'normal' | 'high';
}

export interface UpdateNotificationGroupCommand {
  groupingKey: string;
  userId: string;
  content?: Record<string, unknown>;
  addNotificationIds?: string[];
  removeNotificationIds?: string[];
}

export interface GetNotificationStatsCommand {
  userId: string;
  includeRead?: boolean;
  groupByType?: boolean;
}

export interface GetNotificationPreferencesCommand {
  userId: string;
}

export interface CreateNotificationPreferenceCommand {
  userId: string;
  type: string;
  channels: string[];
  enabled: boolean;
}

export interface GetNotificationPreferenceByTypeCommand {
  userId: string;
  type: string;
}

export interface GetNotificationTemplatesCommand {
  types?: string[];
  page?: number;
  limit?: number;
}

export interface GetNotificationTemplateByIdCommand {
  templateId: string;
}

export interface DeleteNotificationTemplateCommand {
  templateId: string;
}

// Social interaction commands
export interface ProcessPostLikeNotificationCommand {
  postId: string;
  postOwnerId: string;
  likerId: string;
}

export interface ProcessCommentNotificationCommand {
  commentId: string;
  postId: string;
  postOwnerId: string;
  commenterId: string;
  commentText: string;
}

export interface ProcessMentionNotificationCommand {
  contentId: string;
  contentType: 'post' | 'comment';
  mentionedUserId: string;
  mentioningUserId: string;
  contentText: string;
}
```

**Testing Requirements:**

- Unit tests for all components
- Integration tests for notification flow
- Performance tests for real-time delivery
- Load tests for notification grouping
- End-to-end tests for social interaction notifications

**Acceptance Criteria:**

- Users can view their notification list with proper pagination
- Notifications are grouped appropriately (e.g., "5 people liked your post")
- Users can mark notifications as read
- Users can manage notification preferences
- Real-time delivery within 5 seconds via MQTT
- Proper error handling with retry mechanism
- Notification count badge updates in real-time
- End-to-end tests verify the complete flow
- Users receive notifications for likes, comments, and mentions
- Notification grouping works correctly for high-volume activities

---

### INF-001: Deploy imgproxy for Image Processing and Optimization (13 points)

**Status:** To Do
**Priority:** Medium-High
**Dependencies:** None
**Assignee:** DevOps Engineer
**Reviewer:** Technical Leader

**Description:**
Deploy and configure imgproxy service to optimize image delivery for the frontend, enabling efficient image transformations and improved performance.

#### Sub-Tasks

##### INF-001.1: Docker Deployment Setup (3 points)

**Status:** To Do
**Priority:** High
**Assignee:** DevOps Engineer

**Description:**
Set up the Docker deployment for imgproxy, including configuration, environment variables, health checks, and logging.

**Tasks:**

1. Create Docker Compose configuration with proper networking
2. Configure environment variables for security and performance
3. Set up health check endpoints and monitoring integration
4. Implement logging with proper levels and rotation
5. Create deployment documentation

**Technical Notes:**

- Use the official imgproxy Docker image (darthsim/imgproxy)
- Configure proper resource limits for containers
- Implement proper logging with structured format
- Set up health checks with appropriate thresholds

**Acceptance Criteria:**

- Docker Compose configuration is created and tested
- Environment variables are properly configured
- Health checks are implemented and working
- Logging is configured with proper levels and rotation
- Documentation is created for deployment process

##### INF-001.2: Google Cloud Storage Integration (3 points)

**Status:** To Do
**Priority:** High
**Assignee:** DevOps Engineer

**Description:**
Configure the integration between imgproxy and Google Cloud Storage to enable image retrieval and processing from cloud storage.

**Tasks:**

1. Set up GCS service account with minimal required permissions
2. Configure GCS access in imgproxy environment variables
3. Implement and test image retrieval from GCS buckets
4. Add security restrictions for allowed buckets
5. Create documentation for GCS integration

**Technical Notes:**

- Use service account with minimal required permissions
- Configure proper authentication for GCS access
- Implement security restrictions for allowed sources
- Test with various image formats and sizes

**Acceptance Criteria:**

- Service account is created with appropriate permissions
- imgproxy can retrieve images from GCS buckets
- Security restrictions prevent access to unauthorized buckets
- Documentation is created for GCS integration
- Tests verify successful image retrieval from GCS

##### INF-001.3: URL Signing and Security Implementation (2 points)

**Status:** To Do
**Priority:** High
**Assignee:** DevOps Engineer

**Description:**
Implement URL signing and security measures for imgproxy to prevent unauthorized access and ensure secure image processing.

**Tasks:**

1. Generate and configure key/salt pairs for URL signing
2. Create URL signing utilities for backend and frontend
3. Configure allowed sources and referrers
4. Implement CORS settings for frontend access
5. Create documentation for security configuration

**Technical Notes:**

- Generate strong key/salt pairs for URL signing
- Implement proper URL signing algorithm
- Configure allowed sources and referrers
- Set up CORS for frontend access
- Document security best practices

**Acceptance Criteria:**

- URL signing is implemented and working correctly
- Only signed URLs can access protected images
- Allowed sources and referrers are properly configured
- CORS settings allow frontend access
- Documentation is created for security configuration

##### INF-001.4: Image Processing Configuration (2 points)

**Status:** To Do
**Priority:** Medium
**Assignee:** DevOps Engineer

**Description:**
Configure image processing options in imgproxy to enable efficient transformations and optimizations for different use cases.

**Tasks:**

1. Configure resizing and cropping options
2. Set up format conversion for WebP and AVIF
3. Optimize quality settings for different image types
4. Configure caching for improved performance
5. Create documentation for image processing options

**Technical Notes:**

- Configure optimal resizing algorithms
- Set up format conversion with proper quality settings
- Implement efficient caching strategy
- Test with various image types and sizes
- Document recommended settings for different use cases

**Acceptance Criteria:**

- Resizing and cropping options are properly configured
- Format conversion works correctly for WebP and AVIF
- Quality settings are optimized for different image types
- Caching is configured for improved performance
- Documentation is created for image processing options

##### INF-001.5: Frontend Integration (3 points)

**Status:** To Do
**Priority:** Medium
**Assignee:** Frontend Developer

**Description:**
Develop frontend integration for imgproxy to enable efficient image loading and transformations in the NextJS application.

**Tasks:**

1. Create TypeScript utility functions for URL generation
2. Implement responsive image components with proper srcset
3. Add fallback mechanisms for unsupported browsers
4. Test browser compatibility and performance
5. Create documentation for frontend integration

**Technical Notes:**

- Implement TypeScript utilities for URL generation
- Create responsive image components with proper srcset
- Add fallback mechanisms for older browsers
- Test with various devices and screen sizes
- Document usage patterns and best practices

**Acceptance Criteria:**

- TypeScript utilities generate correct imgproxy URLs
- Responsive image components work correctly on different devices
- Fallback mechanisms handle unsupported browsers
- Browser compatibility tests pass for major browsers
- Documentation is created for frontend integration

**Infrastructure Configuration:**

- Docker Compose configuration with proper networking and volume mounts
- Environment variables for security keys, allowed sources, and performance tuning
- Health check endpoints and monitoring integration
- Logging configuration with proper log levels and rotation
- Google Cloud Storage service account with minimal required permissions
- CORS configuration for frontend access
- Cache configuration for optimal performance

**Testing Requirements:**

- Functional tests for image transformations
- Performance tests for image delivery
- Security tests for URL signing
- Browser compatibility tests
- Load testing under high traffic

**Acceptance Criteria:**

- imgproxy service is deployed and accessible
- Service can retrieve and process images from Google Cloud Storage
- NextJS frontend can request optimized images through imgproxy
- Image URLs are properly signed for security
- Service supports multiple image transformations
- Performance metrics show improved image load times
- Proper error handling for missing or invalid images
- Documentation for developers on how to use the service

---

### NOT-002: Notification Technical Debt Resolution (8 points)

**Status:** To Do
**Priority:** Medium
**Dependencies:** NOT-001 (User Notification System)
**Assignee:** Backend Developer
**Reviewer:** Technical Leader

**Description:**
Resolve technical debt in the notification system by implementing profile change notifications and improving template management.

#### Sub-Tasks

##### NOT-002.1: Profile Change Notification Implementation (3 points)

**Status:** Partially Completed
**Priority:** Medium
**Assignee:** Backend Developer

**Description:**
Enhance the profile change notification system to notify followers when a user updates their profile information.

**Current Implementation:**

- Basic profile update notification exists in the NotificationProducerService
- Event handler for profile updates is implemented in the EventSubscriber

**Tasks:**

1. ✅ Create event handlers for profile update events (basic implementation exists)
2. Implement follower notification service with proper filtering
3. Add notification grouping for bulk profile changes
4. Optimize performance for high-follower accounts
5. Implement unit and integration tests

**Technical Notes:**

- Leverage the existing event-driven architecture
- Implement efficient follower lookup with proper indexing
- Add batching for high-follower accounts
- Consider using background processing for large batches

**Event Handlers:**

- `ProfileChangedNotificationEvent` - Handle profile change notifications

**Acceptance Criteria:**

- Followers receive notifications when a user updates their profile
- Notifications are grouped appropriately for bulk changes
- Performance is optimized for high-follower accounts
- Unit and integration tests verify notification flow
- Configurable triggers allow control over which changes trigger notifications

##### NOT-002.2: Notification Content Update Mechanism (3 points)

**Status:** Not Started
**Priority:** Medium
**Assignee:** Backend Developer

**Description:**
Implement the notification content update mechanism to ensure notifications remain accurate when referenced content changes.

**Tasks:**

1. Create content update service with proper validation
2. Implement batch processing for efficient updates
3. Add consistency checks to prevent invalid updates
4. Optimize performance for high-volume updates
5. Implement unit and integration tests

**Technical Notes:**

- Consider using database transactions for atomic updates
- Implement efficient batch processing for updates
- Add proper validation for content updates
- Consider using a queue for handling update backlog

**Command Interfaces:**

- `UpdateNotificationContentCommand` - Update notification content
- `BatchUpdateNotificationsCommand` - Batch update notifications

**Acceptance Criteria:**

- Notification content updates when referenced content changes
- Batch updates are processed efficiently
- Consistency checks prevent invalid updates
- Performance is optimized for high-volume updates
- Unit and integration tests verify update functionality

##### NOT-002.3: Template Management System Enhancement (2 points)

**Status:** Partially Completed
**Priority:** Medium
**Assignee:** Backend Developer

**Description:**
Enhance the template management system to support versioning, validation, and testing frameworks.

**Current Implementation:**

- Basic template system exists with static templates in notification.template.ts
- Handlebars is used for template rendering
- Helper functions exist for text processing and decorator creation

**Tasks:**

1. Implement database-backed template storage system with proper versioning
2. Add validation framework for template syntax and variables
3. Create testing framework for template rendering
4. Implement migration support for template changes
5. Create documentation for template management

**Technical Notes:**

- Leverage the existing Handlebars integration
- Implement versioning with proper history tracking
- Add validation for template syntax and variables
- Create testing framework for template rendering
- Document template management best practices

**Acceptance Criteria:**

- Template versioning tracks changes over time
- Validation prevents invalid templates
- Testing framework verifies template rendering
- Migration support handles template changes
- Documentation provides clear guidelines for template management

**Event Interfaces:**

```typescript
export class ProfileChangedNotificationEvent extends BaseEvent {
  constructor(
    public readonly userId: string,
    public readonly changeType: 'name' | 'avatar' | 'bio' | 'other',
    public readonly oldValue: unknown,
    public readonly newValue: unknown,
    public readonly metadata?: Record<string, unknown>,
  ) {
    super({ metadata });
  }

  eventName(): string {
    return 'notification.profile.changed';
  }

  toJSON(): unknown {
    return {
      userId: this.userId,
      changeType: this.changeType,
      oldValue: this.oldValue,
      newValue: this.newValue,
      metadata: this.metadata,
    };
  }
}
```

**Command Interfaces:**

```typescript
export interface UpdateNotificationContentCommand {
  notificationId: string;
  content: Record<string, unknown>;
}

export interface BatchUpdateNotificationsCommand {
  filter: {
    userIds?: string[];
    types?: string[];
    sourceIds?: string[];
    sourceTypes?: string[];
    createdBefore?: Date;
    createdAfter?: Date;
  };
  update: {
    content?: Record<string, unknown>;
    isRead?: boolean;
  };
}

export interface ProcessProfileChangeNotificationCommand {
  userId: string;
  changeType: 'name' | 'avatar' | 'bio' | 'other';
  oldValue: unknown;
  newValue: unknown;
  notifyFollowers: boolean;
}
```

**Testing Requirements:**

- Unit tests for template system
- Integration tests for profile notifications
- Performance tests for update mechanism
- Migration tests for template changes

**Acceptance Criteria:**

- Profile Updates:
  - Followers receive notifications for profile changes
  - Notifications are grouped appropriately
  - Configurable triggers for notifications
- Notification Updates:
  - Efficient updates when user data changes
  - Batch update support
  - Proper history handling
  - Optimized performance
- Template Management:
  - Easy-to-use management system
  - Version control support
  - Hot-reload capability
  - Validation system
  - Migration support

## Definition of Done

- All code follows DDD principles and the established code style
- Documentation is updated
- Tests are passing with 80% coverage
- Performance metrics meet requirements
- Code review completed
- Integration tests passing
- API documentation updated
- Monitoring and alerts configured

## Sprint Dependencies

- Backend infrastructure must be stable
- MQTT broker must be available for notification delivery
- Redis cluster must be operational for caching
- Database performance must be optimized
- Google Cloud Storage access must be configured

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| MQTT performance issues | High | Medium | Implement proper connection pooling and monitoring |
| GCS access issues | High | Low | Test thoroughly and have fallback mechanisms |
| Image processing performance | Medium | Medium | Configure proper caching and optimize settings |
| Database performance for notifications | High | Medium | Proper indexing and query optimization |
| Template system complexity | Medium | Medium | Start with simple templates and iterate |

## Sprint Review and Demo Plan

- Demo notification system with real-time delivery
- Show imgproxy image transformations and performance improvements
- Demonstrate performance metrics
- Review monitoring dashboards

## Code Style Reminder

All developers should follow the code style established in the social module, which aligns with our TypeScript and NestJS guidelines:

1. **Module Structure**
   - Follow the structure defined in `/docs/module-structure.md`
   - Maintain clear separation between entities, repositories, services, and presentation layers
   - Use proper folder organization for each component type

2. **TypeScript Best Practices**
   - Use proper typing for all variables, parameters, and return values
   - Avoid using `any` type
   - Create necessary interfaces and types
   - Use PascalCase for classes and interfaces
   - Use camelCase for variables, functions, and methods

3. **NestJS Patterns**
   - Use dependency injection through constructors
   - Define interfaces for repositories
   - Use proper decorators for controllers, services, and DTOs
   - Follow the barrel pattern for exports

4. **Code Organization**
   - One export per file
   - Clear separation of concerns
   - Proper error handling with custom error classes
   - Comprehensive documentation with JSDoc

5. **API Design**
   - Use proper DTO validation with class-validator
   - Add Swagger decorators for API documentation
   - Implement consistent error mapping
   - Follow RESTful principles
