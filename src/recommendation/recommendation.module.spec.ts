import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module';
import { EventManagerModule } from '../common/event-manager/event-manager.module';
import { RecommendationModule } from './recommendation.module';
import { GorseClient } from './services/gorse.client';
import { GorseSyncService } from './services/gorse-sync.service';

describe('RecommendationModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        RecommendationModule,
        ConfigModule.forRoot(),
        PrismaModule,
        EventManagerModule,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide GorseClient', () => {
    const client = module.get<GorseClient>(GorseClient);
    expect(client).toBeDefined();
    expect(client).toBeInstanceOf(GorseClient);
  });

  it('should provide GorseSyncService', () => {
    const service = module.get<GorseSyncService>(GorseSyncService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(GorseSyncService);
  });
});
