import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { CreateCommentInput } from '../../services/dtos/comment.input';

export class CreateCommentDto implements CreateCommentInput {
  @ApiProperty({ description: 'Comment content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Post ID' })
  @IsUUID()
  @IsNotEmpty()
  postId: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for replies',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
