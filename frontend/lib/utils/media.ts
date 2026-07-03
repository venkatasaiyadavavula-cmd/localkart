import { apiClient } from '@/lib/api/client';
import { unwrapApiData } from '@/lib/utils/api';

interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  fileType: string;
}

/** Upload a file to S3 via signed URL; returns the public URL. */
export async function uploadMediaFile(file: File, type?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await apiClient.post<unknown>('/media/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: type ? { type } : undefined,
  });

  const result = unwrapApiData<UploadResponse>(data);
  if (!result?.uploadUrl || !result?.publicUrl) {
    throw new Error('Invalid upload response');
  }

  const putRes = await fetch(result.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || result.fileType },
  });

  if (!putRes.ok) {
    throw new Error('Failed to upload file to storage');
  }

  return result.publicUrl;
}

/** Upload multiple files in parallel. */
export async function uploadMediaFiles(files: File[], type?: string): Promise<string[]> {
  return Promise.all(files.map((file) => uploadMediaFile(file, type)));
}
