export default () => ({
  gcp: {
    bucket: {
      userAsset: process.env.USER_ASSET_BUCKET || 'base101-dev01-user-asset',
    },
  },
});
