import { Controller, Get, UseFilters, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { commonErrorMap, RestExceptionFilter, ErrorResponse } from 'src/common';
import { ApiKeyGuard } from 'src/common/auth';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@ApiSecurity('api_key')
@ErrorResponse('common', commonErrorMap)
@Controller('metrics')
@UseGuards(ApiKeyGuard)
@UseFilters(new RestExceptionFilter(commonErrorMap))
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
