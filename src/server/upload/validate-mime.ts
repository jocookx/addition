/**
 * Validate file type via magic bytes (file signature), not the client-supplied
 * Content-Type header, which can be trivially spoofed.
 *
 * Returns the canonical MIME type if the bytes match a known signature,
 * or null if the file does not match any allowed type.
 */

const SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  // JPEG — FF D8 FF
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  // PNG — 89 50 4E 47 0D 0A 1A 0A
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP — RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  // PDF — %PDF
  { mime: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46] },
];

function matchesSignature(buf: Buffer, sig: { bytes: number[]; offset?: number }): boolean {
  const start = sig.offset ?? 0;
  if (buf.length < start + sig.bytes.length) return false;
  return sig.bytes.every((b, i) => buf[start + i] === b);
}

function isWebP(buf: Buffer): boolean {
  // RIFF at 0, WEBP at 8
  if (buf.length < 12) return false;
  const riff = matchesSignature(buf, { bytes: [0x52, 0x49, 0x46, 0x46] });
  const webp =
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  return riff && webp;
}

export function detectMimeType(buf: Buffer): string | null {
  // WebP needs special handling (two separate offsets)
  if (isWebP(buf)) return "image/webp";

  for (const sig of SIGNATURES) {
    if (sig.mime === "image/webp") continue; // handled above
    if (matchesSignature(buf, sig)) return sig.mime;
  }
  return null;
}

/**
 * Validate that the file's actual bytes match an allowed MIME type.
 * Returns an error string if invalid, or null if OK.
 */
export function validateUploadMime(
  buf: Buffer,
  allowedTypes: Set<string>,
): { ok: true; mime: string } | { ok: false; error: string } {
  const detected = detectMimeType(buf);
  if (!detected) {
    return { ok: false, error: "File type not recognised. Upload a JPG, PNG, WebP, or PDF." };
  }
  if (!allowedTypes.has(detected)) {
    return { ok: false, error: "File type not allowed. Upload a JPG, PNG, WebP, or PDF." };
  }
  return { ok: true, mime: detected };
}
