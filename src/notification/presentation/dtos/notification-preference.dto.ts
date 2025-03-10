import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PageOptionsDto } from 'src/common';
import {
  NotificationChannel,
  NotificationPreference,
  NotificationType,
} from '../../entities/notification-preference.entity';

/**
 * DTO for notification preference list query parameters
 */
export class NotificationPreferenceListQuery extends PageOptionsDto {}

/**
 * DTO for creating a notification preference
 */
export class CreateNotificationPreferenceDto {
  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.POST_LIKE,
    required: true,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Channels to receive notifications through',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP],
    required: true,
  })
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels: NotificationChannel[];

  @ApiProperty({
    description: 'Whether the notification is enabled',
    type: 'boolean',
    example: true,
    required: true,
  })
  @IsBoolean()
  enabled: boolean;
}

/**
 * DTO for updating a notification preference
 */
export class UpdateNotificationPreferenceDto {
  @ApiPropertyOptional({
    description: 'Channels to receive notifications through',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiPropertyOptional({
    description: 'Whether the notification is enabled',
    type: 'boolean',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

/**
 * DTO for notification preference output
 */
export class NotificationPreferenceOutput {
  @ApiProperty({
    description: 'Unique identifier for the preference',
    type: 'string',
    example: 'd0e7beaa-f466-49c3-b00d-20e89a72abc8',
    required: true,
  })
  id: string;

  @ApiProperty({
    description: 'User ID that owns this preference',
    type: 'string',
    example: 'd0e7beaa-f466-49c3-b00d-20e89a72abc8',
    required: true,
  })
  userId: string;

  @ApiProperty({
    description: 'Type of notification this preference applies to',
    enum: NotificationType,
    example: NotificationType.POST_LIKE,
    required: true,
  })
  type: NotificationType;

  @ApiProperty({
    description:
      'Channels through which the user wants to receive this notification type',
    enum: NotificationChannel,
    isArray: true,
    example: [NotificationChannel.IN_APP],
    required: true,
  })
  channels: NotificationChannel[];

  @ApiProperty({
    description: 'Whether this notification type is enabled for the user',
    type: 'boolean',
    example: true,
    required: true,
  })
  enabled: boolean;

  @ApiProperty({
    description: 'When the preference was created',
    type: 'string',
    format: 'date-time',
    example: '2024-06-25T03:10:20Z',
    required: true,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the preference was last updated',
    type: 'string',
    format: 'date-time',
    example: '2024-06-25T03:20:20Z',
    required: true,
  })
  updatedAt: Date;

  /**
   * Create a NotificationPreferenceOutput from a NotificationPreference domain model
   *
   * @param preference The notification preference domain model
   * @returns A NotificationPreferenceOutput DTO
   */
  static fromDomain(
    preference: NotificationPreference,
  ): NotificationPreferenceOutput {
    const output = new NotificationPreferenceOutput();
    output.id = preference.id;
    output.userId = preference.userId;
    output.type = preference.type;
    output.channels = preference.channels;
    output.enabled = preference.enabled;
    output.createdAt = preference.createdAt;
    output.updatedAt = preference.updatedAt;
    return output;
  }
}
