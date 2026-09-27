import assert from 'node:assert/strict';
import test from 'node:test';
import { svgImage } from '../src/lib/svg-image.ts';

test('SVG image payload is Base64 UTF-8 for Android, including all padding lengths', () => {
  for (const body of ['', ' ', '  ', '<path d="M1 1h20" stroke="#790D21"/>', '<title>समाचार</title>']) {
    const { uri } = svgImage(body, '0 0 64 64');
    assert.ok(uri.startsWith('data:image/svg+xml;base64,'));
    const payload = uri.split(',')[1];
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">${body}</svg>`;
    assert.equal(payload, Buffer.from(expected, 'utf8').toString('base64'));
    assert.equal(Buffer.from(payload, 'base64').toString('utf8'), expected);
  }
});
