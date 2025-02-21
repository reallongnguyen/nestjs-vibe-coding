import { IsOptional, IsDate, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ActivityFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  limit?: number;
}
