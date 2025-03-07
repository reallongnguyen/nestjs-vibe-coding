/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const generateSignature = (processingOptions, sourceUrl, format) => {
  const key = process.env.IMGPROXY_KEY;
  const salt = process.env.IMGPROXY_SALT;

  const path = `/${processingOptions}/plain/${sourceUrl}@${format}`;

  // Generate signature
  const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
  hmac.update(Buffer.from(salt, 'hex'));
  hmac.update(Buffer.from(path));
  const signature = hmac
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return signature;
};

/**
 * @typedef {Object} ImageTransformOptions
 * @property {number} [width]
 * @property {number} [height]
 * @property {number} [quality]
 * @property {('jpeg'|'png'|'webp'|'avif'|'auto')} [format]
 * @property {('fill'|'fit'|'crop')} [fit]
 */

/**
 * @param {string} originalUrl
 * @param {ImageTransformOptions} options
 * @returns {string}
 */
const getOptimizedImageUrl = (originalUrl, options) => {
  const defaultBucket = 'dev01-isling-me-asset';
  const baseUrl = `http://${process.env.IMGPROXY_HOST}`;

  const {
    width = 0,
    height = 0,
    quality = 80,
    format = 'auto',
    fit = 'fill',
  } = options;

  // Convert gs:// URL to the format imgproxy expects
  const sourceUrl = originalUrl.startsWith('gs://')
    ? originalUrl
    : `gs://${defaultBucket}/${originalUrl}`;

  // Generate processing options
  const processingOptions = `resize:${fit}:${width}:${height}:1/quality:${quality}`;

  // Generate signature (implementation depends on your security requirements)
  const signature = generateSignature(processingOptions, sourceUrl, format);

  return `${baseUrl}/${signature}/${processingOptions}/plain/${sourceUrl}@${format}`;
};

const main = () => {
  const imageUrl = process.argv[2];

  const url = getOptimizedImageUrl(imageUrl, {
    width: 64,
    height: 64,
    format: 'webp',
  });

  console.log(url);
};

main();
