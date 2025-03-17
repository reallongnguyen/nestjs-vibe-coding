# Tweet Feature Technical Design

## Database Schema Changes

### New Tweet Model

```prisma
model Tweet {
  id          String    @id @default(uuid())
  content     String    @db.Text
  userId      String    @map("user_id")
  images      String[]  // Array of image URLs
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz()
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz()
  isArchived  Boolean   @default(false) @map("is_archived")
  
  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  feeds       Feed[]    @relation(map: "feeds_tweet_fkey")
  comments    Comment[] 
  
  @@index([userId])
  @@index([createdAt])
  @@index([isArchived])
  @@map("tweets")
}
```

### FeedContentType Enum Update

```prisma
enum FeedContentType {
  POST
  USER_EMOTION
  TWEET  // New content type
}
```

### Feed Model Update

```prisma
model Feed {
  // Existing fields...
  tweetId        String?   @map("tweet_id")
  // Existing relations...
  tweet          Tweet?    @relation(fields: [tweetId], references: [id], map: "feeds_tweet_fkey")
  
  @@index([contentType, tweetId])
}
```

## API Contracts

### Create Tweet

```typescript
// POST /api/v1/tweets
interface CreateTweetDto {
  content: string;     // Max 280 characters
  imageIds?: string[]; // Optional array of uploaded image IDs
}

interface TweetResponseDto {
  id: string;
  content: string;
  images: string[];
  createdAt: Date;
  author: {
    id: string;
    firstName: string;
    lastName: string | null;
    avatar: string | null;
  };
}
```

### Get Tweet Upload URL

```typescript
// GET /api/v1/tweets/upload-url
interface GetTweetImageUploadUrlDto {
  mimeType: string;
  size: number;
}

interface TweetUploadUrlDto {
  uploadUrl: string;
  imageId: string;
  expiresAt: Date;
}
```

### List Tweets

```typescript
// GET /api/v1/tweets
interface ListTweetsQueryDto {
  page?: number;
  limit?: number;
  userId?: string;
}

interface ListTweetsResponseDto {
  data: TweetResponseDto[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}
```

## Module Structure

### Tweet Module

- `src/content/tweet/tweet.module.ts`: Main module definition
- `src/content/tweet/entities/tweet.entity.ts`: Domain entity
- `src/content/tweet/repositories/tweet.repository.ts`: Data access
- `src/content/tweet/services/tweet.service.ts`: Business logic
- `src/content/tweet/presentation/tweet.controller.ts`: REST API endpoints
- `src/content/tweet/dto/`: Data transfer objects

### Storage Module Updates

- Update `src/storage/file.service.ts` to handle tweet images
- Update `src/storage/file.controller.ts` to add tweet image endpoints

### Feed Module Updates

- Update `src/feed/entities/feed.types.ts` to include tweet content type
- Update `src/feed/services/feed.service.ts` to handle tweets in feed

## Implementation Approach

### Phase 1: Basic Tweet Creation

1. Update Prisma schema
2. Create tweet module with basic CRUD
3. Implement tweet controller and service
4. Add tweet repository implementation

### Phase 2: Image Attachment Support

1. Extend file service for tweet images
2. Add image upload endpoint for tweets
3. Update tweet creation to link with images
4. Implement image validation and processing

### Phase 3: Feed Integration

1. Update feed service to include tweets
2. Modify feed enrichment for tweets
3. Implement tweet ranking in feed algorithm
4. Add tweet-specific feed filters

### Phase 4: Engagement Features

1. Enable comments on tweets
2. Add like functionality for tweets
3. Update notification triggers
4. Implement engagement metrics tracking

## Security Considerations

- Validate tweet content for malicious code
- Scan images for inappropriate content
- Implement rate limiting on tweet creation (max 10 per hour)
- Ensure proper access control for private tweets

## Performance Optimizations

- Index tweets by userId and createdAt for fast retrieval
- Implement caching for popular tweets
- Lazy load images in tweets
- Optimize image assets for faster loading

## Testing Strategy

- Unit tests for tweet entity and service
- Integration tests for tweet repository
- API tests for tweet controller
- End-to-end tests for tweet creation and viewing
- Performance tests for feed with tweets
