# Application Schema Overview

This document outlines the core business logic and data structures of our emotional wellness and content sharing platform.

## Core Features

### User Management

- Granular role system with specialized permissions:
  - Basic roles: USER, MODERATOR, EDITOR, ADMIN, ROOT
  - Special roles: CONTENT_CREATOR, COMMUNITY_MANAGER, SUPPORT, ANALYST
- Comprehensive activity tracking:
  - Authentication events (login, logout, password changes)
  - Profile updates (avatar, email, phone)
  - Account status changes
  - Security events (2FA, alerts)
  - Space-related activities
- Detailed activity logging with:
  - IP address tracking
  - Device identification
  - Geographic location
  - Success/failure status
  - User agent information

### Content Management

#### Posts

The platform uses a two-stage content management system:

1. **Draft Posts**
   - Private working space for users
   - Flexible content structure using JSON
   - Basic metadata (title, subtitle, emotion)
   - Simple topic tagging
   - Link to published version

2. **Published Posts**
   - Public-facing content
   - SEO-friendly with slugs and excerpts
   - Reading time calculation
   - Engagement metrics (likes, replies, views)
   - Structured topic relationships
   - Archiving capability
   - Support for both user and bot authors

#### Comments

- Hierarchical comment system (supports nested replies)
- Soft deletion support
- Like/engagement tracking
- Performance-optimized indexing
- Bot comment support

### Emotional Wellness Features

#### Emotion Tracking

- Daily emotion logging
- Intensity scale (1-5)
- Optional notes for context
- Metadata for analytics
- Date-based organization
- Timestamp precision for detailed analysis

#### User Engagement Mechanisms

1. **Streak System**
   - Daily activity tracking
   - Current streak counting
   - All-time best streak recording
   - Engagement incentivization

2. **Achievement System**
   - Multiple achievement types:
     - Streak maintenance
     - Post creation milestones
     - Engagement metrics
     - Emotion logging consistency
     - Platform milestones
   - Level-based progression
   - Progress tracking
   - Visual rewards (icons)

3. **Feed System**
   - Supports posts and emotions
   - Algorithmic scoring
   - View tracking
   - Personalization capability

4. **Bookmark System**
   - Supports posts and emotions
   - Quick access to saved content
   - User preference tracking

### Notification System

- Rich notification structure
- Multiple object support
- Customizable decorators
- Read status tracking
- Optimized indexing for:
  - Latest notifications (descending time)
  - Read/unread filtering
  - Type-based queries
  - Key-based lookups

### Space Management

- Multi-space support
- Role-based access (OWNER, ADMIN, MEMBER)
- Membership tracking
- Hierarchical permissions

### Bot System

- Multiple bot types:
  - CONTENT_CREATOR
  - COMMENTER
  - MODERATOR
  - ASSISTANT
  - EMOTIONAL_SUPPORT
- Bot configuration via metadata
- Interaction tracking
- Content attribution

## Technical Considerations

### Performance Optimizations

- Strategic indexing for common queries
- Efficient date-based queries
- Hash indexes for notifications
- Compound indexes for related data
- Bot-user interaction tracking

### Data Types

- UUID for IDs
- Timestamptz for temporal precision
- JSON for flexible data storage
- Text for unlimited string length
- Custom enums for type safety

### Relations

- Cascade deletions where appropriate
- Soft deletes for content preservation
- Many-to-many relationship handling
- Optional relationships where needed
- Bot-content relationships

## Analytics Support

- Comprehensive event tracking
- User engagement metrics
- Content performance analytics
- Emotional wellness insights
- Achievement progression tracking
- Bot performance metrics

## Security Considerations

- Granular role-based access control
- Detailed activity logging
- Soft deletion support
- Privacy-conscious data structure
- Bot interaction monitoring

## Future Extensibility

- Flexible content type system
- Expandable achievement types
- Metadata fields for future features
- Modular notification system
- Bot system extensibility

This schema is designed to support a wellness-focused social platform that encourages regular engagement through emotional tracking, content creation, and community interaction, while maintaining high performance and scalability. The addition of the bot system enables automated support and content generation capabilities.
