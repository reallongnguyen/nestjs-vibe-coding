import { Test } from '@nestjs/testing';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { ContentModule } from '../content/content.module';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventBusModule } from '../common/event-bus/event-bus.module';

export async function createTestingApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ContentModule,
      PrismaModule,
      EventBusModule,
      CacheModule.register(),
      ThrottlerModule.forRoot([
        {
          ttl: 60000,
          limit: 10,
        },
      ]),
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}
