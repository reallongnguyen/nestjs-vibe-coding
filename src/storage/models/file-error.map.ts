import { commonErrorMap, ErrorMap } from 'src/common/models/error.map';

export const fileErrorMap: ErrorMap = {
  ...commonErrorMap,
  file: {
    getUploadAvatarUrl: {},
  },
};
