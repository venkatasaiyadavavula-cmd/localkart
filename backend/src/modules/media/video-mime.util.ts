const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
]);

const EXT_TO_MIME: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  avi: 'video/x-msvideo',
};

export function normalizeVideoMime(mimetype: string, filename: string): string | null {
  if (ALLOWED_VIDEO_MIMES.has(mimetype)) {
    return mimetype;
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXT_TO_MIME[ext] ?? null;
}
