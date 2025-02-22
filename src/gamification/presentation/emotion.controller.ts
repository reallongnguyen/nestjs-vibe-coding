import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseFilters,
  Get,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  AuthContextUser,
  RolesGuard,
  RequireAnyRoles,
} from 'src/common/auth';
import {
  ErrorResponse,
  CreatedResponse,
  RestExceptionFilter,
  PaginatedResponse,
} from 'src/common/presentation/rest';
import { Collection } from 'src/common/models';

import { CreateEmotionService } from '../services/create-emotion.service';
import { emotionErrorMap } from '../entities/emotion-error.map';
import { CreateEmotionDto, EmotionResponseDto } from './dtos/emotion.dto';
import { GetEmotionHistoryService } from '../services/get-emotion-history.service';
import { DailyEmotionDto } from './dtos/emotion-history.dto';

const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [new RestExceptionFilter(emotionErrorMap)],
};

@ApiTags('emotions')
@Controller({
  path: 'emotions',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
export class EmotionController {
  constructor(
    private readonly createEmotionService: CreateEmotionService,
    private readonly getEmotionHistoryService: GetEmotionHistoryService,
  ) {}

  @Post()
  @RequireAnyRoles('USER')
  @ApiOperation({ summary: 'Create an emotion log' })
  @CreatedResponse(EmotionResponseDto)
  @ErrorResponse('emotion.create', emotionErrorMap, { hasValidationErr: true })
  async createEmotion(
    @AuthContextUser() user: { id: string },
    @Body() dto: CreateEmotionDto,
  ): Promise<EmotionResponseDto> {
    const emotion = await this.createEmotionService.execute({
      userId: user.id,
      type: dto.type,
      note: dto.note,
    });

    return EmotionResponseDto.fromDomain(emotion);
  }

  @Get('last-7-days')
  @RequireAnyRoles('USER')
  @ApiOperation({ summary: 'Get emotions for the last 7 days' })
  @PaginatedResponse(DailyEmotionDto)
  @ErrorResponse('emotion.history', emotionErrorMap)
  async getEmotionHistory(
    @AuthContextUser() user: { id: string },
  ): Promise<Collection<DailyEmotionDto>> {
    const items = await this.getEmotionHistoryService.execute(user.id);

    return new Collection(items, {
      total: items.length,
      limit: 7,
      offset: 0,
    });
  }
}
