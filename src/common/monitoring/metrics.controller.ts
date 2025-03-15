import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { GlobalErrorFilter } from 'src/common/errors/error.filter';
import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';
import { COMMON_ERRORS } from 'src/common/errors/common.errors';
import { ApiKeyGuard } from 'src/common/auth';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@ApiSecurity('api_key')
@ErrorResponse(COMMON_ERRORS)
@Controller('metrics')
@UseGuards(ApiKeyGuard)
@UseFilters(GlobalErrorFilter)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get Prometheus metrics',
    description: 'Returns all registered metrics in Prometheus text format',
  })
  @ApiResponse({
    status: 200,
    description: 'Metrics retrieved successfully',
    content: {
      'text/plain': {
        schema: {
          type: 'string',
          example:
            '# HELP http_requests_total Total number of HTTP requests\n# TYPE http_requests_total counter\nhttp_requests_total{method="get"} 1234',
        },
      },
    },
  })
  async getMetrics(): Promise<string> {
    return this.metricsService.getRegistry().metrics();
  }
}
