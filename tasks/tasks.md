# Sprint 004 Planning

## Goals

- Implement user following system
- Refactor notification module following DDD principles
- Enhance content distribution with following-based prioritization
- Improve code quality and maintainability

## Tasks

### SOC-006: Implement User Following System

Status: To Do
Priority: High
Dependencies: None

### Context

- Currently, users cannot follow other users they're interested in
- Need to implement a following system to enhance content discovery and personalization
- This feature will be used by the notification system and content distribution

### Requirements

- Allow users to follow/unfollow other users
- Display follower and following counts on user profiles
- Create a "Following" feed view showing only content from followed users
- Implement notifications for new followers
- Prioritize followed users' content in the main feed

### Acceptance Criteria

1. Users can follow/unfollow other users with a single click
2. User profiles display accurate follower and following counts
3. Users receive notifications when someone follows them
4. The main feed algorithm prioritizes content from followed users
5. A dedicated "Following" feed shows only content from followed users
6. Follow/unfollow actions are responsive (under 500ms)
7. Proper error handling for all operations
8. End-to-end tests verify the following functionality

### Technical Notes

- Use the UserFollow model added to the Prisma schema
- Implement proper database indexing for efficient queries
- Use the event bus for notifications
- Ensure proper cache invalidation when follow status changes
- Update feed scoring algorithm to consider follow relationships
- Follow the established module structure pattern
- Implement repository interfaces with dependency injection

### Sub-tasks

1. Create module structure:
   - Create user-follow module and register in app.module.ts
   - Set up folder structure following module-structure.md
   - Create empty files for all components
   - Define interfaces and DTOs

2. Implement data layer:
   - Create repository interface for user follows
   - Implement Prisma repository
   - Add repository tests
   - Register repository in module

3. Implement service layer:
   - Create UserFollowService with follow/unfollow methods
   - Implement follower/following count methods
   - Add event publishing for follow actions
   - Add service unit tests

4. Implement API layer:
   - Create DTOs for request/response
   - Create controller with follow/unfollow endpoints
   - Add endpoints for getting followers/following lists
   - Add authentication guards
   - Add controller tests

5. Implement following feed:
   - Create service method to get content from followed users
   - Update feed scoring algorithm to prioritize followed users
   - Add "Following" feed endpoint
   - Add feed tests

6. Implement notification integration:
   - Create event handlers for follow events
   - Add notification creation for new followers
   - Test notification flow

7. Add end-to-end tests:
   - Test follow/unfollow functionality
   - Test following feed
   - Test notification generation

---

### NOT-000: Refactor Notification Module following DDD

Status: To Do
Priority: High
Dependencies: None

### Context

- Current notification implementation lacks proper structure
- Need to refactor following Domain-Driven Design principles
- Will serve as foundation for enhanced notification features

### Requirements

- Refactor the Notification Module to follow Domain-Driven Design principles
- Implement proper separation of concerns with entities, repositories, services, and controllers
- Create repository interfaces with dependency injection
- Implement event handlers for social interactions (likes, comments, mentions)
- Add real-time notification delivery via MQTT powered by EQMX
- Support notification preferences management

### Acceptance Criteria

1. Module structure follows the pattern in `/docs/module-structure.md`
2. Clear separation between domain entities, repositories, services, and presentation layer
3. Repository interfaces properly implemented with dependency injection
4. Event handlers correctly respond to social events (likes, comments)
5. Notification preferences can be managed by users
6. Real-time notification delivery works within 5 seconds
7. End-to-end tests verify notification flow

### Technical Notes

- Use the social module as a reference for implementation patterns
- Leverage the common module for shared functionality
- Implement proper error handling with custom error classes
- Use the event bus for communication between modules
- Follow the barrel pattern for exports to simplify imports
- Use MQTT client for real-time delivery

### Sub-tasks

1. Create module structure:
   - Create notification module and register in app.module.ts
   - Set up folder structure following module-structure.md
   - Create empty files for all components
   - Define domain entities and interfaces

2. Implement domain layer:
   - Create notification entity
   - Create notification preference entity
   - Define domain events
   - Create custom error classes
   - Create error mapping

3. Implement data layer:
   - Create repository interfaces
   - Implement Prisma repositories
   - Add repository tests
   - Register repositories in module

4. Implement service layer:
   - Create notification service
   - Create notification preference service
   - Add event publishing/handling
   - Add service unit tests

5. Implement presentation layer:
   - Create DTOs for request/response
   - Create controllers for notifications and preferences
   - Add event handlers for social events
   - Add controller tests

6. Implement MQTT integration:
   - Create MQTT notification service
   - Add real-time delivery functionality
   - Add retry mechanism
   - Test real-time delivery

7. Add end-to-end tests:
   - Test notification CRUD operations
   - Test preference management
   - Test event handling
   - Test real-time delivery

---

### SOC-006-1: Create User Following Module Structure

Status: Completed
Priority: High
Dependencies: None

### Context

- Need to establish the foundation for the user following system
- Must follow the established module structure pattern

### Requirements

- Create the module structure following DDD principles
- Define domain entities and interfaces
- Set up repository interfaces
- Create empty service and controller files

### Acceptance Criteria

1. Module structure follows the pattern in `/docs/module-structure.md`
2. All necessary files are created with proper naming conventions
3. Module is registered in the application

### Technical Notes

- Follow the folder structure in `/docs/module-structure.md`
- Create barrel files for clean exports
- Define clear interfaces for repositories and services

### Sub-tasks

1. Create module folder structure
2. Define domain entities (UserFollow)
3. Create repository interfaces
4. Set up empty service classes
5. Create controller skeletons
6. Register module in app.module.ts

### Completion Notes

- Created user-follow module with proper folder structure
- Defined UserFollow entity and related domain events
- Created repository interface with all required methods
- Implemented repository with Prisma
- Created service interface and skeleton implementation
- Set up controller skeleton with proper decorators
- Added barrel files for clean exports
- Registered module in app.module.ts

---

### SOC-006-2: Implement Follow/Unfollow Functionality

Status: Completed
Priority: High
Dependencies: SOC-006-1

### Context

- Core functionality of the following system
- Users need to be able to follow and unfollow other users

### Requirements

- Implement follow functionality
- Implement unfollow functionality
- Ensure proper validation and error handling
- Publish events for follow/unfollow actions

### Acceptance Criteria

1. Users can follow other users
2. Users can unfollow users they are following
3. Users cannot follow themselves
4. Users cannot follow the same user twice
5. Events are published for follow/unfollow actions
6. Proper error handling for all edge cases

### Technical Notes

- Use the UserFollow model in Prisma
- Use the event bus for publishing events
- Add proper validation and error handling
- Implement in the `user-follow` module
- Follow RESTful API design principles
- Use the Collection class from common/models for consistent pagination responses
- Use PaginationQueryDto for request parameters

### API Specification

```typescript
// Follow a user
POST /api/v1/users/{targetUserId}/following

Request:
No body required

Response (201):
No content

// Unfollow a user
DELETE /api/v1/users/{targetUserId}/following

Request:
No body required

Response (204):
No content

// Check if following
GET /api/v1/users/{userId}/following/{targetUserId}

Response (200):
{
  isFollowing: boolean;
}
```

### Sub-tasks

1. Implement repository methods for follow/unfollow
2. Create service methods for follow/unfollow
3. Add validation logic
4. Implement event publishing
5. Create controller endpoints
6. Add error handling

### Completion Notes

- Implemented follow/unfollow functionality in UserFollowService
- Added validation to prevent self-following and duplicate follows
- Created controller endpoints with proper HTTP status codes
- Implemented event publishing for follow/unfollow actions
- Added comprehensive error handling
- Ensured proper authentication and authorization

---

### SOC-006-3: Implement Follower/Following Lists and Counts

Status: Completed
Priority: High
Dependencies: SOC-006-2

### Context

- Users need to see who is following them and who they are following
- User profiles need to display follower and following counts

### Requirements

- Implement API endpoints to get a user's followers
- Implement API endpoints to get users a user is following
- Implement API endpoint to get follower and following counts
- Ensure proper pagination for list endpoints

### Acceptance Criteria

1. API returns paginated list of followers for a user
2. API returns paginated list of users a user is following
3. API returns accurate follower and following counts
4. All endpoints handle edge cases properly

### Technical Notes

- Use the UserFollow model in Prisma
- Implement proper pagination using the Collection class
- Follow RESTful API design principles
- Ensure efficient database queries

### API Specification

```typescript
// Get followers
GET /api/v1/users/{userId}/followers?limit=10&offset=0

Response (200):
{
  items: [
    {
      id: string;
      firstName: string;
      lastName: string | null;
      avatar: string | null;
      followedAt: Date;
    }
  ],
  meta: {
    total: number;
    limit: number;
    offset: number;
  }
}

// Get following
GET /api/v1/users/{userId}/following?limit=10&offset=0

Response (200):
{
  items: [
    {
      id: string;
      firstName: string;
      lastName: string | null;
      avatar: string | null;
      followedAt: Date;
    }
  ],
  meta: {
    total: number;
    limit: number;
    offset: number;
  }
}

// Get follow counts
GET /api/v1/users/{userId}/follow-counts

Response (200):
{
  followersCount: number;
  followingCount: number;
}
```

### Sub-tasks

1. Implement repository methods for getting followers and following
2. Create service methods for followers, following, and counts
3. Implement controller endpoints with pagination
4. Add proper error handling
5. Add unit tests

### Completion Notes

- Implemented repository methods for retrieving followers and following lists
- Added service methods with proper pagination support
- Created controller endpoints with Swagger documentation
- Implemented count functionality for user profiles
- Added comprehensive error handling
- Ensured efficient database queries with proper joins

---

### SOC-006-4: Implement Following Feed

Status: To Do
Priority: Medium
Dependencies: SOC-006-2

### Context

- Users want to see content specifically from users they follow
- Need a dedicated feed showing only followed users' content

### Requirements

- Create a "Following" feed view
- Show only content from followed users
- Support pagination and sorting
- Maintain performance for users with many follows

### Acceptance Criteria

1. API returns feed containing only content from followed users
2. Feed is properly paginated
3. Content is sorted by recency by default
4. Feed performance is acceptable (under 500ms)
5. Proper error handling for all operations

### Technical Notes

- Use efficient JOIN queries
- Implement proper indexing for performance
- Consider caching strategies for active users
- Reuse existing feed infrastructure where possible
- Implement in the `social` module
- Use the Collection class from common/models for consistent pagination responses
- Use PaginationQueryDto for request parameters

### API Specification

```typescript
// Get feed with content only from followed users
GET /api/v1/feed/following

Request:
{
  // Using PaginationQueryDto
  offset?: number; // default: 0
  limit?: number;  // default: 10
  sortBy?: string; // default: "recent", options: "recent", "popular"
}

Response (200):
{
  // Using Collection<T> format
  edges: [
    {
      id: string;
      type: "POST" | "USER_EMOTION";
      content: {
        id: string;
        // Post or emotion specific fields
        title?: string;
        content?: any;
        emotion?: string;
        intensity?: number;
        // Common fields
        createdAt: Date;
        author: {
          id: string;
          firstName: string;
          lastName: string | null;
          avatar: string | null;
        }
      };
      metrics: {
        likeCount: number;
        commentCount: number;
        viewCount: number;
      };
    }
  ],
  pagination: {
    limit: number;
    offset: number;
    total: number;
  }
}
```

### Sub-tasks

1. Extend feed repository to filter by followed users
2. Create service method for following feed
3. Add controller endpoint with pagination
4. Optimize queries for performance
5. Add unit tests for service and repository
6. Add integration tests for API endpoint

---

### SOC-006-5: Implement Main Feed Prioritization

Status: To Do
Priority: Medium
Dependencies: SOC-006-2

### Context

- Content from followed users should be prioritized in the main feed
- Need to update the feed scoring algorithm

### Requirements

- Update feed scoring algorithm to prioritize followed users' content
- Maintain a balance between followed and recommended content
- Ensure performance is not degraded

### Acceptance Criteria

1. Content from followed users appears higher in the main feed
2. Feed still includes some recommended content for discovery
3. Feed performance is maintained (under 500ms)
4. Algorithm can be tuned via configuration

### Technical Notes

- Modify existing feed scoring algorithm
- Add following status as a factor in scoring
- Implement configurable weighting for followed content
- Ensure efficient queries with proper indexing
- Implement in the `social` module
- Use the Collection class from common/models for consistent pagination responses
- Use PaginationQueryDto for request parameters

### API Specification

```typescript
// The existing feed API will be enhanced with following prioritization
GET /api/v1/feed

Request:
{
  // Using PaginationQueryDto
  offset?: number; // default: 0
  limit?: number;  // default: 10
  sortBy?: string; // default: "recommended", options: "recent", "popular", "recommended"
}

Response (200):
{
  // Using Collection<T> format
  edges: [
    {
      id: string;
      type: "POST" | "USER_EMOTION";
      content: {
        id: string;
        // Post or emotion specific fields
        title?: string;
        content?: any;
        emotion?: string;
        intensity?: number;
        // Common fields
        createdAt: Date;
        author: {
          id: string;
          firstName: string;
          lastName: string | null;
          avatar: string | null;
          isFollowed: boolean; // New field indicating if user follows this author
        }
      };
      metrics: {
        likeCount: number;
        commentCount: number;
        viewCount: number;
      };
      score: number; // Score used for ranking (higher for followed users)
    }
  ],
  pagination: {
    limit: number;
    offset: number;
    total: number;
  }
}
```

### Sub-tasks

1. Update feed scoring algorithm
2. Add configuration for followed content weight
3. Optimize queries for performance
4. Add unit tests for updated algorithm
5. Add integration tests for feed results

---

### SOC-006-6: Implement Follow Notifications

Status: To Do
Priority: Low
Dependencies: SOC-006-2, NOT-000

### Context

- Users should be notified when someone follows them
- Requires integration with the notification system

### Requirements

- Create notifications when a user is followed
- Deliver notifications in real-time via MQTT
- Store notifications for later viewing

### Acceptance Criteria

1. Users receive notifications when someone follows them
2. Notifications are delivered in real-time
3. Notifications are stored for later viewing
4. Notifications include follower information

### Technical Notes

- Use the event bus to trigger notifications
- Integrate with MQTT for real-time delivery
- Follow notification module patterns
- Respect user notification preferences
- Implement event handler in the `notification` module
- Publish events from the `user-follow` module

### Event Specification

```typescript
// Event published when a user follows another user
export class UserFollowedEvent {
  static readonly eventName = 'user.followed';
  
  constructor(
    public readonly followerId: string,
    public readonly followingId: string,
    public readonly followerName: string,
    public readonly followerAvatar: string | null,
    public readonly timestamp: Date
  ) {}
  
  toJSON() {
    return {
      followerId: this.followerId,
      followingId: this.followingId,
      followerName: this.followerName,
      followerAvatar: this.followerAvatar,
      timestamp: this.timestamp
    };
  }
}

// Notification created from the event
{
  id: string;
  userId: string; // The user being followed (followingId)
  type: "NEW_FOLLOWER";
  title: "New Follower";
  content: "{followerName} started following you";
  sourceId: string; // followerId
  sourceType: "USER";
  actorId: string; // followerId
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  readAt: Date | null;
  metadata: {
    followerName: string;
    followerAvatar: string | null;
  };
}
```

### Sub-tasks

1. Create event handler for follow events
2. Implement notification creation
3. Add MQTT delivery
4. Test notification flow
5. Add unit tests for notification creation
6. Add integration tests for notification delivery

---

### SOC-006-7: Add End-to-End Tests

Status: To Do
Priority: Low
Dependencies: SOC-006-1, SOC-006-2, SOC-006-3, SOC-006-4, SOC-006-5, SOC-006-6

### Context

- Need to verify the entire following system works correctly
- End-to-end tests will validate the complete flow

### Requirements

- Create end-to-end tests for the following system
- Test all major functionality
- Ensure proper error handling

### Acceptance Criteria

1. Tests verify follow/unfollow functionality
2. Tests verify follower/following lists and counts
3. Tests verify following feed
4. Tests verify main feed prioritization
5. Tests verify notification generation

### Technical Notes

- Use NestJS testing module
- Create test database
- Clean up after tests
- Mock external dependencies

### Sub-tasks

1. Create test setup
2. Implement follow/unfollow tests
3. Implement list and count tests
4. Implement feed tests
5. Implement notification tests
6. Add cleanup procedures

