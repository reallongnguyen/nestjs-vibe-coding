export enum EmotionType {
  JOY = 'joy',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  JOKER = 'joker',
}

export class Emotion {
  id: string;
  type: EmotionType;
  intensity: number;
  timestamp: Date;
  userId: string;

  constructor(data: {
    id: string;
    type: EmotionType;
    intensity: number;
    timestamp: Date;
    userId: string;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.intensity = data.intensity;
    this.timestamp = data.timestamp;
    this.userId = data.userId;
  }
}
