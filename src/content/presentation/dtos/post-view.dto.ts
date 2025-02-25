import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class RecordViewDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  viewerId?: string;

  @ApiProperty()
  @IsString()
  viewerHash: string;
}
