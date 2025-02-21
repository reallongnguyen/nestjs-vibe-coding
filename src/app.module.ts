import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { AppController } from 'src/app.controller';
import { FileModule } from 'src/storage/file.module';
import { NotificationModule } from 'src/notification/notification.module';
import { IdentityModule } from './identity/identity.module';

@Module({
  imports: [
    CommonModule,
    // Register business modules here
    IdentityModule,
    FileModule,
    NotificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
