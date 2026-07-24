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

/** Multer fileFilter payload (memory storage — no `stream` field). */
export type MulterFileFilterPayload = {
  mimetype: string;
  originalname: string;
};

export function normalizeVideoMime(mimetype: string, filename: string): string | null {
  if (ALLOWED_VIDEO_MIMES.has(mimetype)) {
    return mimetype;
  }

  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return null;
  return EXT_TO_MIME[ext] ?? null;
}

export function acceptVideoUpload(
  file: MulterFileFilterPayload,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  const normalized = normalizeVideoMime(file.mimetype, file.originalname);
  if (!normalized) {
    cb(new Error('Only video files allowed (mp4, mov, avi, webm)'), false);
    return;
  }
  file.mimetype = normalized;
  cb(null, true);
}
