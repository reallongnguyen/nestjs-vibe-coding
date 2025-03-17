import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApplyDraftDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;
}
