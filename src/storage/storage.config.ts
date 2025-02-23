import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => {
  return {
    bucket: {
      userAsset: process.env.USER_ASSET_BUCKET || 'base101-dev01-user-asset',
    },
  };
});
