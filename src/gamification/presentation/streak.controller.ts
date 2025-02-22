import { Controller, UseGuards, UseFilters, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthGuard,
  AuthContextUser,
  RolesGuard,
  RequireAnyRoles,
} from 'src/common/auth';
import {
  ErrorResponse,
  RestExceptionFilter,
  OkResponse,
} from 'src/common/presentation/rest';
import { emotionErrorMap } from '../entities/emotion-error.map';
import { GetStreakService } from '../services/get-streak.service';
import { StreakResponseDto } from './dtos/streak.dto';

const REST_CONFIG = {
  guards: [AuthGuard, RolesGuard],
  filters: [new RestExceptionFilter(emotionErrorMap)],
};

@ApiTags('streaks')
@Controller({
  path: 'streaks',
  version: '1',
})
@UseGuards(...REST_CONFIG.guards)
@UseFilters(...REST_CONFIG.filters)
export class StreakController {
  constructor(private readonly getStreakService: GetStreakService) {}

  @Get('')
  @RequireAnyRoles('USER')
  @ApiOperation({ summary: 'Get user streak' })
  @OkResponse(StreakResponseDto)
  @ErrorResponse('streak.get', emotionErrorMap)
  async getStreak(
    @AuthContextUser() user: { id: string },
  ): Promise<StreakResponseDto> {
    const streak = await this.getStreakService.execute(user.id);
    return StreakResponseDto.fromDomain(streak);
  }
}
