import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const notificationErrorMap: ErrorMap = {
  ...commonErrorMap,
  notification: {
    list: {},
    markAsRead: {},
  },
};
