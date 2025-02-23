import { Inject } from '@nestjs/common';

export const InjectEventBus = () => Inject('EventBusPort');
