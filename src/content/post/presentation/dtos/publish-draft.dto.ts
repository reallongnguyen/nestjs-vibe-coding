import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PublishDraftDto {
  @ApiProperty({
    description: 'Custom URL slug for the post',
    required: false,
    example: 'my-awesome-post',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  toData() {
    return {
      ...(this.slug && { slug: this.slug }),
    };
  }
}
