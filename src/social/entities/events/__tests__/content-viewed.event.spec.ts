import { ContentType } from '../../../../common/event-manager/entities/events/schemas/social.events';
import { ContentViewedEvent } from '../content-viewed.event';

describe('ContentViewedEvent', () => {
  const mockData = {
    contentId: '123e4567-e89b-12d3-a456-426614174000',
    contentType: ContentType.POST,
    viewerHash: 'abc123',
    viewerId: '123e4567-e89b-12d3-a456-426614174001',
    timestamp: new Date('2024-03-21T12:00:00Z'),
    correlationId: 'corr-123',
    metadata: { source: 'test' },
  };

  it('should create event with all parameters', () => {
    const event = new ContentViewedEvent(
      mockData.contentId,
      mockData.contentType,
      mockData.viewerHash,
      mockData.viewerId,
      mockData.timestamp,
      mockData.metadata,
    );

    const json = event.toJSON();
    expect(json).toEqual({
      contentId: mockData.contentId,
      contentType: mockData.contentType,
      viewerHash: mockData.viewerHash,
      viewerId: mockData.viewerId,
      timestamp: mockData.timestamp,
    });
  });

  it('should create event with required parameters only', () => {
    const event = new ContentViewedEvent(
      mockData.contentId,
      mockData.contentType,
      mockData.viewerHash,
    );

    const json = event.toJSON();
    expect(json).toEqual({
      contentId: mockData.contentId,
      contentType: mockData.contentType,
      viewerHash: mockData.viewerHash,
      viewerId: undefined,
      timestamp: expect.any(Date),
    });
  });

  it('should return consistent payload in toJSON', () => {
    const event = new ContentViewedEvent(
      mockData.contentId,
      mockData.contentType,
      mockData.viewerHash,
      mockData.viewerId,
      mockData.timestamp,
    );

    const json1 = event.toJSON();
    const json2 = event.toJSON();
    expect(json1).toEqual(json2);
  });
});
