import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AppController } from 'src/app.controller';
import { FileModule } from 'src/storage/file.module';
import { NotificationModule } from 'src/notification/notification.module';
import { IdentityModule } from 'src/identity/identity.module';
import { GamificationModule } from 'src/gamification/gamification.module';
import { SocialModule } from 'src/social/social.module';
import { ContentModule } from 'src/content/content.module';
import { UserFollowModule } from 'src/user-follow/user-follow.module';
import { RecommendationModule } from 'src/recommendation/recommendation.module';
import { FeedModule } from 'src/feed/feed.module';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [
    CommonModule,
    // Register business modules here
    IdentityModule,
    GamificationModule,
    FileModule,
    NotificationModule,
    SocialModule,
    ContentModule,
    UserFollowModule,
    RecommendationModule,
    FeedModule,
    InvitationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
