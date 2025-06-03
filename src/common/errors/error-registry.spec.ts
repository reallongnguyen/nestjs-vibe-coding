import { ALL_APP_ERRORS } from './error-registry';
import { COMMON_ERRORS } from './common.errors';
import { CommonErrorCode } from './common.error-codes';
import { FEED_ERRORS } from '../../feed/errors/feed.errors';
import { FeedErrorCode } from '../../feed/errors/feed.error-codes';
import { IDENTITY_ERRORS } from '../../identity/entities/errors/identity.errors';
import { IdentityErrorCode } from '../../identity/entities/errors/identity.error-codes';
import { NOTIFICATION_ERRORS } from '../../notification/entities/errors/notification.errors';
import { NotificationErrorCode } from '../../notification/entities/errors/notification.error-codes';
import { SOCIAL_ERRORS } from '../../social/entities/errors/social.errors';
import { SocialErrorCode } from '../../social/entities/errors/social.error-codes';
import { STORAGE_ERRORS } from '../../storage/errors/storage.errors';
import { StorageErrorCode } from '../../storage/errors/storage.error-codes';
import { ErrorDefinition } from './app.error';

describe('ALL_APP_ERRORS Registry', () => {
  const allModuleErrors: Record<string, Record<string, ErrorDefinition>> = {
    COMMON_ERRORS,
    FEED_ERRORS,
    IDENTITY_ERRORS,
    NOTIFICATION_ERRORS,
    SOCIAL_ERRORS,
    STORAGE_ERRORS,
  };

  it('should be defined and not empty', () => {
    expect(ALL_APP_ERRORS).toBeDefined();
    expect(Object.keys(ALL_APP_ERRORS).length).toBeGreaterThan(0);
  });

  describe('Inclusion of Module Errors', () => {
    for (const [moduleName, moduleErrors] of Object.entries(allModuleErrors)) {
      it(`should include all errors from ${moduleName}`, () => {
        for (const [errorCode, errorDefinition] of Object.entries(moduleErrors)) {
          expect(ALL_APP_ERRORS[errorCode]).toBeDefined();
          expect(ALL_APP_ERRORS[errorCode]).toEqual(errorDefinition);
        }
      });
    }
  });

  describe('Sanity Checks for Specific Error Codes', () => {
    it('should contain CommonErrorCode.SERVER_ERROR', () => {
      expect(ALL_APP_ERRORS[CommonErrorCode.SERVER_ERROR]).toBeDefined();
      expect(ALL_APP_ERRORS[CommonErrorCode.SERVER_ERROR]).toEqual(
        COMMON_ERRORS[CommonErrorCode.SERVER_ERROR],
      );
    });

    it('should contain FeedErrorCode.FEED_GENERATION_FAILED', () => {
      expect(ALL_APP_ERRORS[FeedErrorCode.FEED_GENERATION_FAILED]).toBeDefined();
      expect(ALL_APP_ERRORS[FeedErrorCode.FEED_GENERATION_FAILED]).toEqual(
        FEED_ERRORS[FeedErrorCode.FEED_GENERATION_FAILED],
      );
    });

    it('should contain IdentityErrorCode.USER_NOT_FOUND', () => {
      expect(ALL_APP_ERRORS[IdentityErrorCode.USER_NOT_FOUND]).toBeDefined();
      expect(ALL_APP_ERRORS[IdentityErrorCode.USER_NOT_FOUND]).toEqual(
        IDENTITY_ERRORS[IdentityErrorCode.USER_NOT_FOUND],
      );
    });

    it('should contain NotificationErrorCode.TEMPLATE_NOT_FOUND', () => {
      expect(ALL_APP_ERRORS[NotificationErrorCode.TEMPLATE_NOT_FOUND]).toBeDefined();
      expect(ALL_APP_ERRORS[NotificationErrorCode.TEMPLATE_NOT_FOUND]).toEqual(
        NOTIFICATION_ERRORS[NotificationErrorCode.TEMPLATE_NOT_FOUND],
      );
    });

    it('should contain SocialErrorCode.COMMENT_NOT_FOUND', () => {
      expect(ALL_APP_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND]).toBeDefined();
      expect(ALL_APP_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND]).toEqual(
        SOCIAL_ERRORS[SocialErrorCode.COMMENT_NOT_FOUND],
      );
    });

    it('should contain StorageErrorCode.FILE_NOT_FOUND', () => {
      expect(ALL_APP_ERRORS[StorageErrorCode.FILE_NOT_FOUND]).toBeDefined();
      expect(ALL_APP_ERRORS[StorageErrorCode.FILE_NOT_FOUND]).toEqual(
        STORAGE_ERRORS[StorageErrorCode.FILE_NOT_FOUND],
      );
    });
  });

  it('should have the correct number of unique error codes', () => {
    const uniqueErrorCodes = new Set<string>();
    for (const moduleErrors of Object.values(allModuleErrors)) {
      for (const errorCode of Object.keys(moduleErrors)) {
        uniqueErrorCodes.add(errorCode);
      }
    }
    expect(Object.keys(ALL_APP_ERRORS).length).toEqual(uniqueErrorCodes.size);
  });

  it('should ensure all error codes in ALL_APP_ERRORS come from a known module error object', () => {
    const allKnownModuleErrorCodes = new Set<string>();
    for (const moduleErrors of Object.values(allModuleErrors)) {
      Object.keys(moduleErrors).forEach(code => allKnownModuleErrorCodes.add(code));
    }

    for (const errorCodeInAllAppErrors of Object.keys(ALL_APP_ERRORS)) {
      expect(allKnownModuleErrorCodes.has(errorCodeInAllAppErrors)).toBe(true);
    }
  });
});
