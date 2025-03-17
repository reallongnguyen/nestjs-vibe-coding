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
