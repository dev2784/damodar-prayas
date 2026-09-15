import { File, UploadType } from 'expo-file-system';

import { API_BASE_URL } from '@/services/api';

export type ContentUploadableFile = {
  uri: string;
  name: string;
  type: string;
};

export type UploadedContentMedia = {
  url: string;
  storageKey: string;
  mimeType: string;
  fileName: string;
};

export async function uploadContentBanner({
  file,
  accessToken,
}: {
  file: ContentUploadableFile;
  accessToken: string;
}) {
  const selectedFile = new File(file.uri);

  let result: Awaited<ReturnType<File['upload']>>;
  try {
    result = await selectedFile.upload(`${API_BASE_URL}/media/content/banner`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      fieldName: 'file',
      mimeType: file.type,
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: 'application/json',
      },
    });
  } catch (error) {
    throw {
      status: 'FETCH_ERROR',
      data: {
        error: 'UPLOAD_NETWORK_ERROR',
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  const raw = result.body ?? '';
  let data: unknown = {};
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }

  if (result.status < 200 || result.status >= 300) {
    throw { status: result.status, data };
  }

  return data as { media: UploadedContentMedia };
}
