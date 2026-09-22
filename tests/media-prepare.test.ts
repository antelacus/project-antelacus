import test from 'node:test';
import assert from 'node:assert/strict';

import sharp from 'sharp';

import { prepareImage, PHOTO_LONG_EDGE } from '../src/lib/server/media';

// REQ §5.3 rule 5 — what lands in the bucket is what browsers get: photos become bounded JPEGs.

test('a large JPEG comes back as a JPEG no wider than the long edge', async () => {
  const big = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#888' } }).jpeg().toBuffer();
  const out = await prepareImage(big, 'image/jpeg', 'jpg');
  assert.equal(out.contentType, 'image/jpeg');
  const meta = await sharp(out.bytes).metadata();
  assert.equal(meta.width, PHOTO_LONG_EDGE);
  assert.equal(meta.height, 1800);
});

test('a small JPEG is not enlarged; a PNG passes through untouched', async () => {
  const small = await sharp({ create: { width: 640, height: 480, channels: 3, background: '#888' } }).jpeg().toBuffer();
  assert.equal((await sharp((await prepareImage(small, 'image/jpeg', 'jpg')).bytes).metadata()).width, 640);
  const png = await sharp({ create: { width: 3000, height: 100, channels: 4, background: '#0000' } }).png().toBuffer();
  const out = await prepareImage(png, 'image/png', 'png');
  assert.equal(out.bytes, png);
  assert.equal(out.extension, 'png');
});
