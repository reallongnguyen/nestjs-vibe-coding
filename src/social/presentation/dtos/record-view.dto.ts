import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RecordViewDto {
  @ApiProperty()
  @IsString()
  viewerHash: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  viewerId?: string;
}
