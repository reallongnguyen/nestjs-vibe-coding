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
  CreatedResponse,
  PaginatedResponse,
  PagedResult,
} from 'src/common';
import { GlobalErrorFilter, COMMON_ERRORS } from 'src/common/errors';
import { ErrorResponse } from 'src/common/errors/decorators/error-response.decorator';

import { CreateEmotionService } from '../services/create-emotion.service';
import { CreateEmotionDto, EmotionResponseDto } from './dtos/emotion.dto';
import { GetEmotionHistoryService } from '../services/get-emotion-history.service';
import { DailyEmotionDto } from './dtos/emotion-history.dto';
import { GAMIFICATION_ERRORS } from '../entities/errors/gamification.errors';

@ApiTags('emotions')
@Controller({
  path: 'emotions',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ErrorResponse(COMMON_ERRORS)
export class EmotionController {
  constructor(
    private readonly createEmotionService: CreateEmotionService,
    private readonly getEmotionHistoryService: GetEmotionHistoryService,
  ) {}

  @Post()
  @RequireAnyRoles('USER')
  @ApiOperation({ summary: 'Create an emotion log' })
  @CreatedResponse(EmotionResponseDto)
  @ErrorResponse({
    EMOTION_INVALID_TYPE: GAMIFICATION_ERRORS.EMOTION_INVALID_TYPE,
  })
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
  @ErrorResponse({})
  async getEmotionHistory(
    @AuthContextUser() user: { id: string },
  ): Promise<PagedResult<DailyEmotionDto>> {
    const items = await this.getEmotionHistoryService.execute(user.id);

    return new PagedResult(items, {
      totalItems: items.length,
      pageSize: 7,
      pageNumber: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  }
}
