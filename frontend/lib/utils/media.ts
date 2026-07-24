import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils/api';

interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  fileType: string;
  chargeMessage?: string;
}

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|avi|mkv|m4v)$/i;

export function isVideoFile(file: File): boolean {
  if (file.type.startsWith('video/')) return true;
  return VIDEO_EXTENSIONS.test(file.name);
}

async function putFileToSignedUrl(file: File, uploadUrl: string, contentType: string) {
  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': contentType || file.type || 'application/octet-stream' },
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload file to storage');
  }
}

/** Seller video pipeline — `/media/upload-video` (200MB, shop folder, transcoding job). */
export async function uploadVideoFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<unknown>('/media/upload-video', formData);

  const result = unwrapApiData<UploadResponse>(data);
  if (!result?.uploadUrl || !result?.publicUrl) {
    throw new Error('Invalid video upload response');
  }

  await putFileToSignedUrl(file, result.uploadUrl, result.fileType || file.type);

  return result.publicUrl;
}

/** Upload a file to S3 via signed URL; returns the public URL. */
export async function uploadMediaFile(file: File, type?: string): Promise<string> {
  if (isVideoFile(file)) {
    return uploadVideoFile(file);
  }

  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<unknown>('/media/upload', formData, {
    params: type ? { type } : undefined,
  });

  const result = unwrapApiData<UploadResponse>(data);
  if (!result?.uploadUrl || !result?.publicUrl) {
    throw new Error('Invalid upload response');
  }

  await putFileToSignedUrl(file, result.uploadUrl, result.fileType || file.type);

  return result.publicUrl;
}

/** Upload multiple files in parallel. */
export async function uploadMediaFiles(files: File[], type?: string): Promise<string[]> {
  return Promise.all(files.map((file) => uploadMediaFile(file, type)));
}
