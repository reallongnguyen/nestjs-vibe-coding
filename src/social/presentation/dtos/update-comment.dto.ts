import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { UpdateCommentInput } from '../../services/dtos/comment.input';

export class UpdateCommentDto implements UpdateCommentInput {
  @ApiProperty({ description: 'Updated comment content' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
