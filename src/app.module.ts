import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { UserModule } from 'src/user-management/user.module';
import { AppController } from 'src/app.controller';
import { FileModule } from 'src/storage/file.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [
    CommonModule,
    // Register business modules here
    UserModule,
    FileModule,
    NotificationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
