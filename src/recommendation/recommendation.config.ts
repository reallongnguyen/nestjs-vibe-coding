import { registerAs } from '@nestjs/config';

export default registerAs('recommendation', () => {
  return {
    gorse: {
      url: process.env.GORSE_URL || 'http://gorse.docker.localhost',
      apiKey: process.env.GORSE_API_KEY || 'gorse',
    },
  };
});
