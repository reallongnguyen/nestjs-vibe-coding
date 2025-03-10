import {
  ContentType,
  SocialEventSchemas,
  BaseEvent,
} from 'src/common/event-manager';

export class ContentViewedEvent extends BaseEvent<
  typeof SocialEventSchemas.CONTENT_VIEWED.schema
> {
  constructor(
    private readonly contentId: string,
    private readonly contentType: ContentType,
    private readonly viewerHash: string,
    private readonly viewerId?: string,
    private readonly timestamp?: Date,
    metadata?: Record<string, unknown>,
  ) {
    super(SocialEventSchemas.CONTENT_VIEWED, metadata);
  }

  toJSON() {
    return {
      contentId: this.contentId,
      contentType: this.contentType,
      viewerHash: this.viewerHash,
      viewerId: this.viewerId,
      timestamp: this.timestamp,
    };
  }
}
