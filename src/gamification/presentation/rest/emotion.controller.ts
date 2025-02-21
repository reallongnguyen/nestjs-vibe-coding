import { Body, Controller, Post, UseGuards, UseFilters } from '@nestjs/common';
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
} from 'src/common/presentation/rest';
import { CreateEmotionService } from '../../services/create-emotion.service';
import { emotionErrorMap } from '../../entities/emotion-error.map';
import { CreateEmotionDto, EmotionResponseDto } from '../dtos/emotion.dto';

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
  constructor(private readonly createEmotionService: CreateEmotionService) {}

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
    });

    return EmotionResponseDto.fromDomain(emotion);
  }
}
