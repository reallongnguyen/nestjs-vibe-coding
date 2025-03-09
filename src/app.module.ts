import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AppController } from 'src/app.controller';
import { FileModule } from 'src/storage/file.module';
import { NotificationModule } from 'src/notification/notification.module';
import { IdentityModule } from './identity/identity.module';
import { GamificationModule } from './gamification/gamification.module';
import { SocialModule } from './social/social.module';
import { ContentModule } from './content/content.module';
import { UserFollowModule } from './user-follow/user-follow.module';
import { RecommendationModule } from './recommendation/recommendation.module';

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
  ],
  controllers: [AppController],
})
export class AppModule {}
