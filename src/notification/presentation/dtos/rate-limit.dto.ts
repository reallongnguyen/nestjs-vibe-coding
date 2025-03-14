import { ApiProperty } from '@nestjs/swagger';
import { RateLimitStatus } from '../../services/notification-rate-limit.service';

/**
 * DTO for rate limit limits
 */
export class RateLimitLimitsDto {
  @ApiProperty({
    description: 'Maximum number of notifications per minute',
    example: 16,
  })
  perMinute: number;

  @ApiProperty({
    description: 'Maximum number of notifications per hour',
    example: 64,
  })
  perHour: number;

  @ApiProperty({
    description: 'Maximum number of notifications per day',
    example: 256,
  })
  perDay: number;
}

/**
 * DTO for rate limit counters
 */
export class RateLimitCountersDto {
  @ApiProperty({
    description: 'Current number of notifications in the last minute',
    example: 3,
  })
  minute: number;

  @ApiProperty({
    description: 'Current number of notifications in the last hour',
    example: 27,
  })
  hour: number;

  @ApiProperty({
    description: 'Current number of notifications in the last day',
    example: 142,
  })
  day: number;
}

/**
 * DTO for rate limit status
 */
export class RateLimitStatusDto {
  @ApiProperty({
    description: 'Rate limit configuration limits',
    type: RateLimitLimitsDto,
  })
  limits: RateLimitLimitsDto;

  @ApiProperty({
    description: 'Current notification counts',
    type: RateLimitCountersDto,
  })
  current: RateLimitCountersDto;

  @ApiProperty({
    description: 'Remaining notifications before hitting limits',
    type: RateLimitCountersDto,
  })
  remaining: RateLimitCountersDto;

  @ApiProperty({
    description: 'Whether the user is currently rate limited',
    example: false,
  })
  isRateLimited: boolean;

  /**
   * Create a DTO from a domain model
   * @param status Rate limit status domain model
   * @returns Rate limit status DTO
   */
  static fromDomain(status: RateLimitStatus): RateLimitStatusDto {
    const dto = new RateLimitStatusDto();
    dto.limits = {
      perMinute: status.limits.perMinute,
      perHour: status.limits.perHour,
      perDay: status.limits.perDay,
    };
    dto.current = {
      minute: status.current.minute,
      hour: status.current.hour,
      day: status.current.day,
    };
    dto.remaining = {
      minute: status.remaining.minute,
      hour: status.remaining.hour,
      day: status.remaining.day,
    };
    dto.isRateLimited = status.isRateLimited;
    return dto;
  }
}
