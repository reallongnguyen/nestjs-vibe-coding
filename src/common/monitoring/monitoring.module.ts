import { Module, Global } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { SystemMetricsService } from './system-metrics.service';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsService, SystemMetricsService],
  exports: [MetricsService],
})
export class MonitoringModule {}
