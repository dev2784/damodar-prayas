// Expo Image's Android data-URL loader decodes every data: payload as Base64.
// Encode UTF-8 bytes explicitly; percent-encoded SVG works on web but fails there.
export function svgImage(body: string, viewBox = '0 0 100 100') {
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none">${body}</svg>`;
  const bytes = Array.from(encodeURIComponent(xml).matchAll(/%([0-9A-F]{2})|([^%])/g), (match) =>
    match[1] ? parseInt(match[1], 16) : match[2].charCodeAt(0),
  );
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let encoded = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    encoded +=
      alphabet[a >> 2] +
      alphabet[((a & 3) << 4) | (b >> 4)] +
      (i + 1 < bytes.length ? alphabet[((b & 15) << 2) | (c >> 6)] : '=') +
      (i + 2 < bytes.length ? alphabet[c & 63] : '=');
  }
  return { uri: `data:image/svg+xml;base64,${encoded}` };
}
