import { Test } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Logger } from 'nestjs-pino';
import { AuthGuard, RolesGuard } from 'src/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JWTGuard } from 'src/common/auth/adapter/presentation/nestjs/jwt.guard';
import { JwtAuthCtxRepo } from 'src/common/auth/adapter/infrastructure/repositories/jwt-auth-ctx.repo';
import { PostModule } from '../post.module';

describe('PostModule', () => {
  it('should compile the module', async () => {
    const mockPrismaService = {
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockJwtAuthCtxRepo = {
      getAuthCtx: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [PostModule],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(JWTGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(JwtAuthCtxRepo)
      .useValue(mockJwtAuthCtxRepo)
      .useMocker((token) => {
        if (token === Logger) {
          return {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          };
        }
        if (token === CACHE_MANAGER) {
          return {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          };
        }
        // Use string token for IEventBus
        if (token === 'IEventBus') {
          return {
            publish: jest.fn(),
          };
        }
        // Mock any other dependencies
        if (typeof token === 'string') {
          return {
            create: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findAll: jest.fn(),
          };
        }
        return undefined;
      })
      .compile();

    expect(moduleRef).toBeDefined();
  });
});
