import { Inject } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from '../../core/domain/entities/tokens';

export const InjectEventBus = () => Inject(EVENT_BUS_TOKEN);
