import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
