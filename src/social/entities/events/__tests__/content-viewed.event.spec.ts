import { ContentType } from '../../../../common/event-manager/entities/events/schemas/social.events';
import { ContentViewedEvent } from '../content-viewed.event';

describe('ContentViewedEvent', () => {
  const mockData = {
    contentId: '123e4567-e89b-12d3-a456-426614174000',
    contentType: ContentType.POST,
    viewerHash: 'abc123',
    viewerId: '987fcdeb-51a2-43b7-91e8-789123456789',
    timestamp: new Date('2024-03-15T12:00:00Z'),
  };

  it('should create event with required parameters only', () => {
    const event = new ContentViewedEvent(
      mockData.contentId,
      mockData.contentType,
      mockData.viewerHash,
      undefined,
      mockData.timestamp,
    );

    const json = event.toJSON();
    expect(json).toEqual({
      contentId: mockData.contentId,
      contentType: mockData.contentType,
      viewerHash: mockData.viewerHash,
      timestamp: mockData.timestamp,
      viewerId: undefined,
    });
  });

  it('should create event with all parameters', () => {
    const viewerId = '987fcdeb-51a2-43b7-91e8-789123456789';
    const metadata = { source: 'test' };
    const event = new ContentViewedEvent(
      mockData.contentId,
      mockData.contentType,
      mockData.viewerHash,
      viewerId,
      mockData.timestamp,
      metadata,
    );

    const json = event.toJSON();
    expect(json).toEqual({
      contentId: mockData.contentId,
      contentType: mockData.contentType,
      viewerHash: mockData.viewerHash,
      timestamp: mockData.timestamp,
      viewerId,
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
