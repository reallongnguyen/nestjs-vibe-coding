import { IsString, IsOptional } from 'class-validator';

export class PublishDraftDto {
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
      ...(this.title && { title: this.title }),
      ...(this.subtitle !== undefined && { subtitle: this.subtitle }),
      ...(this.excerpt && { excerpt: this.excerpt }),
    };
  }
}
