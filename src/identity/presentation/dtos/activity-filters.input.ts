import { IsOptional, IsDate, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ActivityFiltersDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  offset?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  limit?: number;
}
