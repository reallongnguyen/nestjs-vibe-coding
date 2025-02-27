import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';

export class RecordViewDto {
  @ApiProperty({ description: 'Hash identifying the viewer' })
  @IsString()
  viewerHash: string;

  @ApiPropertyOptional({ description: 'ID of the authenticated viewer' })
  @IsOptional()
  @IsUUID()
  viewerId?: string;
}
