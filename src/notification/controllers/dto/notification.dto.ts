import { Prisma } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import {
  Notification,
  NotificationDecorator,
} from '../../entities/notification.model';

export class NotificationCreateInput
  implements
    Pick<
      Prisma.NotificationCreateInput,
      | 'key'
      | 'type'
      | 'userId'
      | 'subjects'
      | 'subjectCount'
      | 'diObject'
      | 'inObject'
      | 'prObject'
      | 'link'
    >
{
  key: string;
  type: string;
  userId: string;
  subjects?: PrismaJson.NotificationObjectType[];
  subjectCount: number;
  diObject?: PrismaJson.NotificationObjectType;
  inObject?: PrismaJson.NotificationObjectType;
  prObject?: PrismaJson.NotificationObjectType;
  link?: string;
}

export class NotificationListQuery {
  @ApiProperty({
    description: 'Pagination offset',
    type: 'number',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  offset: number;

  @ApiProperty({
    description: 'Pagination limit',
    type: 'number',
    example: 20,
    default: 20,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(1000)
  limit: number;
}

export class NotificationDecoratorOutput extends NotificationDecorator {
  @ApiProperty({
    description: 'The index of the first character that applied decorator',
    type: 'number',
    example: 0,
    required: true,
  })
  offset: number;

  @ApiProperty({
    description: 'The length of the text that applied decorator',
    type: 'number',
    example: 3,
    required: true,
  })
  length: number;

  @ApiProperty({
    description:
      'The class show how to format this text that inspried by Tailwindcss class',
    type: 'string',
    example: 'font-semibold text-blue-500',
    required: true,
  })
  class: string;

  @ApiProperty({
    description:
      'The type of decorator that relate to original object such as user, post, group...',
    type: 'string',
    example: 'user',
    required: false,
  })
  type?: string;

  @ApiProperty({
    description: 'The link relate to this object',
    type: 'string',
    example: '/users/d0e7beaa-f466-49c3-b00d-20e89a72abc8/profile',
    required: false,
  })
  link?: string;
}

export class NotificationOutput
  implements
    Pick<
      Notification,
      'id' | 'text' | 'decorators' | 'link' | 'notificationTime' | 'readAt'
    >
{
  @ApiProperty({
    description: 'The id',
    type: 'string',
    example: 'd0e7beaa-f466-49c3-b00d-20e89a72abc8',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'The content of a notification without any format',
    type: 'string',
    example: 'Tom and 2 other users like your post',
    required: true,
  })
  text: string;

  @ApiProperty({
    description: 'The decorators that help content can be formated in frontend',
    type: [NotificationDecoratorOutput],
    required: true,
  })
  decorators: NotificationDecoratorOutput[];

  @ApiProperty({
    description: 'The URL that related to this notification',
    type: 'string',
    example: '/posts/f5c8403e-69cc-434b-a545-e45097965cec',
    required: true,
  })
  link: string;

  @ApiProperty({
    description: 'The timestamp of the notification',
    type: 'string',
    example: '2024-06-25T03:10:20Z',
    required: true,
  })
  notificationTime: Date;

  @ApiProperty({
    description:
      'The read timestamp. If it NULL it mean this notification has not been read yet',
    type: 'string',
    example: '2024-06-25T03:20:20Z',
    required: false,
  })
  readAt: Date;

  static from(noti: Notification): NotificationOutput {
    const notiOutput = new NotificationOutput();

    notiOutput.id = noti.id;
    notiOutput.text = noti.text;
    notiOutput.decorators = noti.decorators;
    notiOutput.link = noti.link;
    notiOutput.notificationTime = noti.notificationTime;
    notiOutput.readAt = noti.readAt;

    return notiOutput;
  }
}

export class NotificationPatchQuery {
  @ApiProperty({
    description: 'The exactly notification you want to delete',
    type: 'string',
    example: '664b82b0-180a-4cbe-b84a-f5b1831f5089',
    required: false,
  })
  @IsString()
  @IsOptional()
  id?: string;
}
