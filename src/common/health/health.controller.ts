import { Controller, Get, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CacheHealthIndicator } from './cache.health';

@Controller('health')
@UseFilters(GlobalErrorFilter)
@ErrorResponse(COMMON_ERRORS)
@ApiTags('app')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
    private readonly cache: CacheHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.cache.isHealthy('cache'),
    ]);
  }
}
