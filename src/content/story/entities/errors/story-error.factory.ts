import { HttpStatus } from '@nestjs/common';
import { AppError } from 'src/common/errors/app.error';

export enum StoryErrorCode {
  CONTENT_EMPTY = 'STORY_CONTENT_EMPTY',
  CONTENT_TOO_LONG = 'STORY_CONTENT_TOO_LONG',
  STORY_NOT_FOUND = 'STORY_NOT_FOUND',
  PARENT_STORY_NOT_FOUND = 'PARENT_STORY_NOT_FOUND',
  ROOT_STORY_NOT_FOUND = 'ROOT_STORY_NOT_FOUND',
  CANNOT_FORK_ARCHIVED = 'CANNOT_FORK_ARCHIVED_STORY',
  CANNOT_CONTINUE_ARCHIVED = 'CANNOT_CONTINUE_ARCHIVED_STORY',
  NOT_AUTHORIZED = 'NOT_AUTHORIZED_FOR_STORY',
  CONCURRENT_UPDATE = 'CONCURRENT_UPDATE_DETECTED',
  NOT_CHAIN_ROOT = 'NOT_CHAIN_ROOT_STORY',
}

export class StoryErrorFactory {
  static contentEmpty(): AppError {
    return new AppError(StoryErrorCode.CONTENT_EMPTY, {
      message: 'Story content cannot be empty',
      status: HttpStatus.BAD_REQUEST,
    });
  }

  static contentTooLong(): AppError {
    return new AppError(StoryErrorCode.CONTENT_TOO_LONG, {
      message: 'Story content exceeds maximum length',
      status: HttpStatus.BAD_REQUEST,
    });
  }

  static storyNotFound(id: string): AppError {
    return new AppError(
      StoryErrorCode.STORY_NOT_FOUND,
      {
        message: 'Story with id {id} not found',
        status: HttpStatus.NOT_FOUND,
      },
      { params: { id } },
    );
  }

  static parentStoryNotFound(id: string): AppError {
    return new AppError(
      StoryErrorCode.PARENT_STORY_NOT_FOUND,
      {
        message: 'Parent story with id {id} not found',
        status: HttpStatus.NOT_FOUND,
      },
      { params: { id } },
    );
  }

  static rootStoryNotFound(id: string): AppError {
    return new AppError(
      StoryErrorCode.ROOT_STORY_NOT_FOUND,
      {
        message: 'Root story with id {id} not found',
        status: HttpStatus.NOT_FOUND,
      },
      { params: { id } },
    );
  }

  static cannotForkArchivedStory(): AppError {
    return new AppError(StoryErrorCode.CANNOT_FORK_ARCHIVED, {
      message: 'Cannot fork an archived story',
      status: HttpStatus.BAD_REQUEST,
    });
  }

  static cannotContinueArchivedStory(): AppError {
    return new AppError(StoryErrorCode.CANNOT_CONTINUE_ARCHIVED, {
      message: 'Cannot continue an archived story',
      status: HttpStatus.BAD_REQUEST,
    });
  }

  static notAuthorized(): AppError {
    return new AppError(StoryErrorCode.NOT_AUTHORIZED, {
      message: 'Not authorized to perform this action',
      status: HttpStatus.FORBIDDEN,
    });
  }

  static concurrentUpdate(): AppError {
    return new AppError(StoryErrorCode.CONCURRENT_UPDATE, {
      message: 'Concurrent update detected. Please try again.',
      status: HttpStatus.CONFLICT,
    });
  }

  static notChainRoot(storyId: string): AppError {
    return new AppError(
      StoryErrorCode.NOT_CHAIN_ROOT,
      {
        message: `Story with ID ${storyId} is not a root story of a chain`,
        status: HttpStatus.BAD_REQUEST,
      },
      { params: { storyId } },
    );
  }
}
