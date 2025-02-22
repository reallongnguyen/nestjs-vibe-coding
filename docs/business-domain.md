# Business Domain

1. Identity Management
   - User
   - UserRole
   - UserActivity
   - UserActivityType
   - UserInSpaces
   - SpaceMemberRole

2. Content Management
   - DraftPost
   - PublishedPost
   - Comment
   - Topic
   - PostTopic
   - Space

3. Social Engagement
   - PostLike
   - CommentLike
   - Bookmark
   - Feed
   - BookmarkContentType
   - FeedContentType
   - Notification

4. Gamification
   - UserEmotion
   - UserStreak
   - Achievement
   - UserAchievement
   - AchievementType

5. AI Services
   - Bot
   - BotType
   - BotInteraction

## Module Structure

The application is divided into the following business domains:

1. **Identity Module** (`src/identity/`)
   - User profile management
   - Activity tracking

2. **Content Module** (`src/content/`)
   - Post management
   - Comment system
   - Content moderation

3. **Engagement Module** (`src/engagement/`)
   - Likes and reactions
   - Bookmarks
   - Feed management

4. **Emotional Module** (`src/emotional/`)
   - Emotion tracking
   - Wellness features
   - Streak management

5. **Gamification Module** (`src/gamification/`)
   - Achievements
   - User progress tracking
   - Rewards system

6. **Notification Module** (`src/notification/`)
   - Notification management
   - Delivery system
   - Preferences

7. **Spaces Module** (`src/spaces/`)
   - Community management
   - Member roles
   - Space settings

8. **Bot Module** (`src/bots/`)
   - Bot management
   - Interaction tracking
   - Automation features
