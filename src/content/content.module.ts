import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { GetContentsHandler } from './presentation/handlers/get-contents.handler';
import { TweetModule } from './tweet/tweet.module';
import { PostModule } from './post/post.module';
import { StoryModule } from './story/story.module';

const handlers = [GetContentsHandler];

@Module({
  imports: [CqrsModule, TweetModule, PostModule, StoryModule],
  providers: [...handlers],
  exports: [...handlers],
})
export class ContentModule {}
