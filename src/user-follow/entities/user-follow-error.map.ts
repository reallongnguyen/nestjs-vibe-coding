import { HttpStatus } from '@nestjs/common';
import { ErrorMap } from 'src/common';

export const userFollowErrorMap: ErrorMap = {
  'user-follow': {
    userFollowError: {
      status: HttpStatus.BAD_REQUEST,
      message: 'An error occurred with the user follow operation',
    },
    userFollowNotFound: {
      status: HttpStatus.NOT_FOUND,
      message: 'User follow relationship not found',
    },
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
};
