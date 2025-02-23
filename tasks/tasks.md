# Current Sprint Tasks

## EMO-001: Implement Create User Emotion API

Status: To Do
Priority: High
Dependencies: None

### Requirements

- User create an emotion log
- Require USER role
- Emotion is one of ['joy', 'sadness', 'anger', 'fear', 'joker']
- In case there is an emotion at same hour in day
  - if emotion is difference, replace it by new emotion
  - if emotion is same, increment intensity util 5
- Publish new event to Event Bus

### Acceptance Criteria

1. Users create emotions many time
2. Users receive successfully response
3. Do not have duplicate emotion in same hour for 1 user (loose condition)

### Technical Notes

- Add this API into gamification module
- Add Swagger docs in controller, follow code src/identity/presentation/rest/user.controller.ts
- Follow Error handle from technical.md
- Follow code style from src/identity
- Use upsert to detect an emotion at same hour if possible

## EMO-002: Implement get streak API

Status: To Do
Priority: High
Dependencies: None

### Requirements

- Get streak of user
- Require USER role
- Streak is the number of consecutive days that the user has log emotion

### Acceptance Criteria

1. Users get streak successfully
2. Do not have duplicate emotion in same hour for 1 user (loose condition)

### Technical Notes

- Add this API into gamification module
- Follow code style from src/identity

## EMO-003: Update streak when user create emotion

Status: To Do
Priority: High
Dependencies: None

### Requirements

- Update streak when user create emotion
- Require USER role
- Streak is the number of consecutive days that the user has log emotion

### Acceptance Criteria

1. User can see streak updated after create emotion

### Technical Notes

- Use event bus to update streak
- Use upsert to prevent race condition
- Emit event through event bus when user create emotion
- Handle event in streak handler

## EMO-004: Update create emotion API: Allow user write note for emotion

Status: To Do
Priority: High
Dependencies: EMO-001

## Context

- Currently, user can create emotion without note
- Create emotion API is in src/gamification/presentation/emotion.controller.ts

### Requirements

- Allow user write note for emotion
- Require USER role
- Note is a text that user can write to describe the emotion. Max length is 256 characters
- Should not pass note to event bus

### Acceptance Criteria

1. User can write note for emotion
2. User can see note after create emotion
3. User can create emotion without note

### Technical Notes

- Add this API into gamification module
- Follow code style from src/identity

## EMO-005: Implement API to get emotion in last 7 days

Status: To Do
Priority: High
Dependencies: None

### Requirements

- Get emotion in last 7 days of logged in user (include today)
- Require USER role
- Should return emotion data in descending order of date
- Combine emotion data by date:
  - Emotion of day is most intensity emotion of day, if there are more than 1 emotion return the last one
  - If there is no emotion in day, return null
- Output should be an array of object with date and emotion

### Acceptance Criteria

1. User can get emotion in last 7 days
2. User can see emotion data in descending order of date
3. User can see array of null emotion if user has no emotion in last 7 days
4. User can see emotion data in UTC time
5. User can see correct emotion combine by date

### Technical Notes

- Add this API into gamification module
- Follow code style from src/identity
- API GET /emotions/last-7-days
- Get date in UTC time
- Expected output:

```json
[
  { "date": "2024-01-01", "emotion": "joy" },
  // ...
]
```

## EMO-006: Change logic create emotion

Status: To Do
Priority: High
Dependencies: None

## Context

- In create emotion API, if user create emotion at same hour, we will update intensity of emotion instead of create new emotion
- In get emotion history API, we will combine emotion by date and find the most intensity emotion of day

### Requirements

- In create emotion API, do not replace emotion if user create emotion at same hour. Add all emotions to database
- In get emotion history API, emotion of day is emotion that has the highest sum of intensity of day

### Acceptance Criteria

1. User can create emotion without replace if user create emotion at same hour
2. User can get emotion history correctly

### Technical Notes

- Edit these API
  - API POST /emotions
  - API GET /emotions/last-7-days

## SOC-001: Implement get feed API

Status: To Do
Priority: High
Dependencies: None

### Context

- Feed is a list of post or user emotion
- Feed is sorted by score and date
- Score is a value that calculated from post and user emotion
- Score is calculated from emotion intensity and time
- Score is calculated by formula:
  - Score = (intensity * 1000) / (time_diff + 1)
  - time_diff = (current_time - post_time) / 1000 / 60 / 60
  - intensity is the sum of intensity of emotion of post

### Requirements

- Get feed of user
- Require USER role
- Should return post data in
  - descending order of score
  - descending order of date
- Pagination:
  - Default page is 1
  - Default limit is 16
  - Should return total of feed
  - Should return feed data with pagination

### Acceptance Criteria

1. User can get feed successfully
2. User can see feed data in descending order of score
3. User can see feed data in descending order of date
4. User can see pagination of feed
5. User can see correct feed data with pagination

### Technical Notes

- Add this API into social module
- Follow code style from src/identity
- API GET /feeds
- Cache feed data in Redis using @nestjs/cache-manager

## SOC-002: Implement distribute content to feed

Status: To Do
Priority: High
Dependencies: SOC-001

### Context

- Need to distribute content (posts and emotions) to users' feeds efficiently
- Content needs to be pre-processed and distributed to improve feed loading performance
- Similar to TikTok's feed distribution system but simplified

### Requirements

- Implement a background job system to distribute content
- Process new content (posts and emotions) and calculate their scores
- Distribute content to Redis sorted sets for quick feed retrieval
- Handle content deletion and updates
- Implement cleanup mechanism for old content

### Architecture Overview

1. Content Processing Pipeline:
   - New content → Score Calculation → Distribution → Redis Storage
   - Uses Redis sorted sets for efficient scoring and retrieval
   - Background jobs for processing and distribution

2. Storage Structure:
   - Redis Key Pattern: `feed:global:{timestamp}`
   - Content stored with score as sorting key
   - TTL set for old content cleanup

### Tasks Breakdown

#### SOC-002.1: Implement Content Processing Service

Status: To Do
Priority: High

Requirements:

- Create background job system using Bull
- Implement score calculation service
- Process new content when created
- Handle content updates and deletions
- Emit events for content distribution

Technical Notes:

- Use Bull for job queue
- Implement in social module
- Follow existing patterns for event handling

#### SOC-002.2: Implement Feed Distribution Service

Status: To Do
Priority: High

Requirements:

- Create distribution service to handle content placement
- Implement Redis sorted set management
- Handle content scoring and placement
- Implement cleanup mechanism for old content

Technical Notes:

- Use Redis sorted sets
- Implement TTL for content cleanup
- Handle batch processing for efficiency

#### SOC-002.3: Implement Feed Cache Management

Status: To Do
Priority: High

Requirements:

- Implement cache invalidation strategy
- Handle content updates and deletions in cache
- Implement cache warming mechanism
- Handle cache cleanup for old content

Technical Notes:

- Use Redis for caching
- Implement cache versioning
- Handle partial cache updates

#### SOC-002.4: Create Content Events Handlers

Status: To Do
Priority: High

Requirements:

- Create event handlers for new content
- Handle content update events
- Handle content deletion events
- Implement retry mechanism for failed operations

Technical Notes:

- Use existing event bus
- Implement idempotent operations
- Handle event ordering

### Acceptance Criteria

1. New content is automatically processed and distributed
2. Content updates are reflected in feeds
3. Deleted content is removed from feeds
4. Feed retrieval is performant (< 100ms)
5. System handles high load efficiently
6. Old content is automatically cleaned up
7. Cache invalidation works correctly

### Technical Notes

- Implement in social module
- Use Bull for job queue management
- Use Redis sorted sets for feed storage
- Implement proper error handling and logging
- Add monitoring for job processing
- Add metrics for performance tracking
- Follow existing patterns for event handling
- Implement proper testing for all components
- Document all Redis key patterns and TTL strategies
- Implement for post is not published yet
