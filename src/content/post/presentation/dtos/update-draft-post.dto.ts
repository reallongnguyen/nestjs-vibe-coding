import { IsString, IsOptional, IsArray, IsObject } from 'class-validator';

export class UpdateDraftPostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  subtitle?: string | null;

  @IsOptional()
  @IsObject()
  content?: Record<string, any>;

  @IsOptional()
  @IsString()
  cover?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  toData() {
    return {
      ...(this.title && { title: this.title }),
      ...(this.subtitle !== undefined && { subtitle: this.subtitle }),
      ...(this.content && { content: this.content }),
      ...(this.cover !== undefined && { cover: this.cover }),
      ...(this.topics && { topics: this.topics }),
    };
  }
}
