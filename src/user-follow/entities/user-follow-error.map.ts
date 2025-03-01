import { HttpStatus } from '@nestjs/common';
import { commonErrorMap, ErrorMap } from 'src/common';

export const userFollowErrorMap: ErrorMap = {
  ...commonErrorMap,
  'user-follow': {
    followUser: {
      selfFollow: {
        status: HttpStatus.BAD_REQUEST,
        message: 'Users cannot follow themselves',
      },
      alreadyFollowing: {
        status: HttpStatus.BAD_REQUEST,
        message: 'User is already following this user',
      },
      userNotFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'User not found',
      },
    },
    unfollowUser: {
      userFollowNotFound: {
        status: HttpStatus.NOT_FOUND,
        message: 'User follow relationship not found',
      },
    },
    userFollowError: {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An error occurred with the user follow operation',
    },
  },
};
