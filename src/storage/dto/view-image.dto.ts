import { IsNotEmpty, IsString } from 'class-validator';

export class ViewImageDto {
  @IsString()
  @IsNotEmpty()
  url: string;
}
