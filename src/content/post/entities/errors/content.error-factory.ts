import {
  ContentGetError,
  DraftCreateError,
  DraftDeleteError,
  DraftNotFoundError,
  DraftNotLinkedToPublishedError,
  DraftPublishError,
  DraftUpdateError,
  NotDraftOwnerError,
  NotPublishedPostOwnerError,
  PostUpdateError,
  PublishedPostDeleteError,
  PublishedPostNotFoundError,
  SlugExistsError,
  TopicNotFoundError,
} from './content.error-classes';

/**
 * Factory for creating Content module errors
 */
export class ContentErrorFactory {
  /**
   * Creates an error for when draft creation fails
   * @param cause - The original error
   * @returns DraftCreateError
   */
  static draftCreateFailed(cause?: Error): DraftCreateError {
    return new DraftCreateError(cause);
  }

  /**
   * Creates an error for when draft update fails
   * @param cause - The original error
   * @returns DraftUpdateError
   */
  static draftUpdateFailed(cause?: Error): DraftUpdateError {
    return new DraftUpdateError(cause);
  }

  /**
   * Creates an error for when a draft is not found
   * @param draftId - ID of the draft
   * @returns DraftNotFoundError
   */
  static draftNotFound(draftId: string): DraftNotFoundError {
    return new DraftNotFoundError(draftId);
  }

  /**
   * Creates an error for when a user is not the owner of a draft
   * @param userId - ID of the user
   * @param draftId - ID of the draft
   * @returns NotDraftOwnerError
   */
  static notDraftOwner(userId: string, draftId: string): NotDraftOwnerError {
    return new NotDraftOwnerError(userId, draftId);
  }

  /**
   * Creates an error for when draft deletion fails
   * @param cause - The original error
   * @returns DraftDeleteError
   */
  static draftDeleteFailed(cause?: Error): DraftDeleteError {
    return new DraftDeleteError(cause);
  }

  /**
   * Creates an error for when draft publishing fails
   * @param cause - The original error
   * @returns DraftPublishError
   */
  static draftPublishFailed(cause?: Error): DraftPublishError {
    return new DraftPublishError(cause);
  }

  /**
   * Creates an error for when a draft is not linked to a published post
   * @param draftId - ID of the draft
   * @returns DraftNotLinkedToPublishedError
   */
  static draftNotLinkedToPublished(
    draftId: string,
  ): DraftNotLinkedToPublishedError {
    return new DraftNotLinkedToPublishedError(draftId);
  }

  /**
   * Creates an error for when a published post is not found
   * @param postId - ID of the published post
   * @returns PublishedPostNotFoundError
   */
  static publishedPostNotFound(postId: string): PublishedPostNotFoundError {
    return new PublishedPostNotFoundError(postId);
  }

  /**
   * Creates an error for when a user is not the owner of a published post
   * @param userId - ID of the user
   * @param postId - ID of the published post
   * @returns NotPublishedPostOwnerError
   */
  static notPublishedPostOwner(
    userId: string,
    postId: string,
  ): NotPublishedPostOwnerError {
    return new NotPublishedPostOwnerError(userId, postId);
  }

  /**
   * Creates an error for when published post deletion fails
   * @param cause - The original error
   * @returns PublishedPostDeleteError
   */
  static publishedPostDeleteFailed(cause?: Error): PublishedPostDeleteError {
    return new PublishedPostDeleteError(cause);
  }

  /**
   * Creates an error for when post update fails
   * @param cause - The original error
   * @returns PostUpdateError
   */
  static postUpdateFailed(cause?: unknown): PostUpdateError {
    return new PostUpdateError(cause);
  }

  /**
   * Creates an error for when topics are not found
   * @param missingTopicIds - IDs of the missing topics
   * @returns TopicNotFoundError
   */
  static topicNotFound(missingTopicIds: string[]): TopicNotFoundError {
    return new TopicNotFoundError(missingTopicIds);
  }

  /**
   * Creates an error for when a slug already exists
   * @param slug - The slug that already exists
   * @returns SlugExistsError
   */
  static slugExists(slug: string): SlugExistsError {
    return new SlugExistsError(slug);
  }

  /**
   * Creates an error for when content retrieval fails
   * @param cause - The original error
   * @returns ContentGetError
   */
  static contentGetFailed(cause?: Error): ContentGetError {
    return new ContentGetError(cause);
  }
}
