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
  note?: string;

  constructor(data: {
    id: string;
    type: EmotionType;
    intensity: number;
    timestamp: Date;
    userId: string;
    note?: string;
  }) {
    this.id = data.id;
    this.type = data.type;
    this.intensity = data.intensity;
    this.timestamp = data.timestamp;
    this.userId = data.userId;
    this.note = data.note;
  }
}
