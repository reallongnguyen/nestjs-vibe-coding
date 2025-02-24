import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AppController } from 'src/app.controller';
import { FileModule } from 'src/storage/file.module';
import { NotificationModule } from 'src/notification/notification.module';
import { IdentityModule } from './identity/identity.module';
import { GamificationModule } from './gamification/gamification.module';
import { SocialModule } from './social/social.module';
import { ContentModule } from './content/content.module';

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
  ],
  controllers: [AppController],
})
export class AppModule {}
