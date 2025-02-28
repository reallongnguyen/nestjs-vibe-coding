import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CreateCommentInput } from '../../services/dtos/comment.input';

export class CreateCommentDto implements Omit<CreateCommentInput, 'postId'> {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
