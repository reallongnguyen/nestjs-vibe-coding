import { Controller, Get, UseFilters } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
// import { ErrorResponse, COMMON_ERRORS } from 'src/common/errors'; // Removed ErrorResponse and COMMON_ERRORS
import { GlobalErrorFilter } from 'src/common/errors'; // Keep GlobalErrorFilter
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CacheHealthIndicator } from './cache.health';

@Controller('health')
@UseFilters(GlobalErrorFilter)
// @ErrorResponse(COMMON_ERRORS) // Removed
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
  @ApiAppErrors([CommonErrorCode.SERVER_ERROR])
  check() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.prisma.pingCheck('database', this.prismaService),
      () => this.cache.isHealthy('cache'),
    ]);
  }
}
