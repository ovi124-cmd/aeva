/**
 * Base64URL encoder & decoder with full UTF-8 Unicode support for emojis & accented characters.
 */

export function encodeProposal(data) {
  try {
    const jsonStr = JSON.stringify(data);
    // Convert utf-8 string to percent-encoded string, then to binary string
    const utf8Bytes = encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    const base64 = btoa(utf8Bytes);
    // URL-safe base64: replace + with -, / with _, strip padding =
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (err) {
    console.error('Failed to encode proposal data:', err);
    return '';
  }
}

export function decodeProposal(str) {
  try {
    if (!str || typeof str !== 'string') return null;
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const jsonStr = decodeURIComponent(
      Array.prototype.map
        .call(binary, (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error('Failed to decode proposal data:', err);
    return null;
  }
}
