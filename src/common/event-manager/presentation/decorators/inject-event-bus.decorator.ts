import { Inject } from '@nestjs/common';
import { EVENT_BUS_TOKEN } from '../../entities/tokens';

export const InjectEventBus = () => Inject(EVENT_BUS_TOKEN);
