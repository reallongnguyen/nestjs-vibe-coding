import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for channel-specific metrics
 */
export class ChannelMetricsDto {
  @ApiProperty({ description: 'Number of delivery attempts' })
  attempts: number;

  @ApiProperty({ description: 'Number of successful deliveries' })
  successes: number;

  @ApiProperty({ description: 'Number of failed deliveries' })
  failures: number;
}

/**
 * DTO for total metrics with additional statistics
 */
export class TotalMetricsDto extends ChannelMetricsDto {
  @ApiProperty({ description: 'Success rate as percentage', example: '95.5%' })
  successRate: string;

  @ApiProperty({ description: 'Average delivery latency in milliseconds' })
  avgLatencyMs: number;
}

/**
 * DTO for metrics within a time window
 */
export class TimeWindowMetricsDto extends ChannelMetricsDto {
  @ApiProperty({ description: 'Success rate as percentage', example: '95.5%' })
  successRate: string;
}

/**
 * DTO for notification delivery metrics
 */
export class NotificationMetricsDto {
  @ApiProperty({ description: 'Total metrics since server start' })
  total: TotalMetricsDto;

  @ApiProperty({ description: 'Metrics for the last hour' })
  lastHour: TimeWindowMetricsDto;

  @ApiProperty({
    description: 'Metrics by delivery channel',
    additionalProperties: {
      type: 'object',
      $ref: '#/components/schemas/ChannelMetricsDto',
    },
  })
  channels: Record<string, ChannelMetricsDto>;
}
