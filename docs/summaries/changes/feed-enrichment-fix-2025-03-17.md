# Feed Enrichment Fix - 2025-03-17

## What Changed and Why

We fixed an issue with the feed enrichment functionality that occurred after refactoring the content module into tweet and post subfolders. The feed module couldn't find the `GetContentsHandler` through the CQRS command bus because it wasn't exported from the content module.

## Code Changes

The change was minimal and focused specifically on the module declaration in `src/content/content.module.ts`:

### Before

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetContentsHandler } from './presentation/handlers/get-contents.handler';
import { TweetModule } from './tweet/tweet.module';
import { PostModule } from './post/post.module';

@Module({
  imports: [CqrsModule, TweetModule, PostModule],
  providers: [GetContentsHandler],
  exports: [],
})
export class ContentModule {}
```

### After

```typescript
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetContentsHandler } from './presentation/handlers/get-contents.handler';
import { TweetModule } from './tweet/tweet.module';
import { PostModule } from './post/post.module';

const handlers = [GetContentsHandler];

@Module({
  imports: [CqrsModule, TweetModule, PostModule],
  providers: [...handlers],
  exports: [...handlers],
})
export class ContentModule {}
```

## Impact on Other Components

This change directly impacts the feed module, which relies on the `GetContentsHandler` to process `GetContentsCommand` through the CQRS command bus. With this fix, the feed enrichment functionality now works correctly after the content module refactoring.

## Testing Performed

We verified the fix by:

1. Running unit tests for the feed enrichment service: `yarn test src/feed/test/feed-enrichment.service.spec.ts`
2. Running integration tests: `yarn test src/feed/test/feed-enrichment.integration.spec.ts`
3. Starting the application to check for any startup errors

All tests passed successfully, confirming that the feed enrichment functionality is now working as expected.

## Commit Instructions

The changes need to be committed with:

```bash
git add src/content/content.module.ts
git commit -m "fix: export GetContentsHandler from content module to fix feed enrichment"
```

## References

- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)
- [NestJS Modules Documentation](https://docs.nestjs.com/modules)
