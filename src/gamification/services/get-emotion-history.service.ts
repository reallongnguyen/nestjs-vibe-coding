import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { IEmotionRepository } from './interfaces/emotion.repository.interface';
import { DailyEmotionDto } from '../presentation/dtos/emotion-history.dto';
import { EmotionType } from '../entities/emotion.entity';

@Injectable()
export class GetEmotionHistoryService {
  constructor(
    private readonly logger: Logger,
    @Inject('IEmotionRepository')
    private readonly emotionRepository: IEmotionRepository,
  ) {}

  async execute(userId: string): Promise<DailyEmotionDto[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days including today

    // Set to start of day UTC
    startDate.setUTCHours(0, 0, 0, 0);
    endDate.setUTCHours(23, 59, 59, 999);

    const emotions = await this.emotionRepository.findByUserIdAndDateRange(
      userId,
      startDate,
      endDate,
    );

    const dailyEmotions: DailyEmotionDto[] = [];

    // Generate all 7 days
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setUTCHours(0, 0, 0, 0);

      const dateStr = date.toISOString().split('T')[0];
      const dayEmotions = emotions.filter(
        (e) => e.timestamp.toISOString().split('T')[0] === dateStr,
      );

      if (dayEmotions.length === 0) {
        dailyEmotions.push({
          date: dateStr,
          emotion: null,
          intensity: null,
          note: null,
        });
        continue;
      }

      // Calculate total intensity per emotion type
      const intensityByType = dayEmotions.reduce(
        (acc, curr) => {
          acc[curr.type] = (acc[curr.type] || 0) + curr.intensity;
          return acc;
        },
        {} as Record<EmotionType, number>,
      );

      // Find emotion type with highest total intensity
      let maxIntensityType = dayEmotions[0].type;
      let maxIntensity = intensityByType[maxIntensityType];

      Object.entries(intensityByType).forEach(([type, intensity]) => {
        if (intensity > maxIntensity) {
          maxIntensityType = type as EmotionType;
          maxIntensity = intensity;
        }
      });

      // Get the latest emotion of the winning type
      const maxIntensityEmotions = dayEmotions.filter(
        (e) => e.type === maxIntensityType,
      );

      const latestOfType = maxIntensityEmotions.reduce((latest, curr) => {
        if (!latest || curr.timestamp > latest.timestamp) return curr;
        return latest;
      }, maxIntensityEmotions[0]);

      dailyEmotions.push({
        date: dateStr,
        emotion: maxIntensityType,
        intensity: maxIntensity,
        note: latestOfType.note || null,
      });
    }

    return dailyEmotions;
  }
}
