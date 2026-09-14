import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export type MediaKind = 'profile-photo' | 'kundali';

type UploadInput = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  folder: string;
  kind: MediaKind;
};

type UploadResult = {
  url: string;
  storageKey: string;
  mimeType: string;
  fileName: string;
};

if (env.MEDIA_PROVIDER === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function ensureMediaProvider() {
  if (env.MEDIA_PROVIDER !== 'cloudinary') {
    const error = new Error('Media provider is not configured.');
    Object.assign(error, { statusCode: 503, code: 'MEDIA_PROVIDER_NOT_CONFIGURED' });
    throw error;
  }
}

export async function uploadMedia(input: UploadInput): Promise<UploadResult> {
  ensureMediaProvider();

  const dataUri = `data:${input.mimeType};base64,${input.buffer.toString('base64')}`;
  const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    folder: input.folder,
    public_id: publicId,
    resource_type: input.kind === 'kundali' ? 'auto' : 'image',
    overwrite: false,
    use_filename: false,
    unique_filename: true,
  });

  return {
    url: result.secure_url,
    storageKey: result.public_id,
    mimeType: input.mimeType,
    fileName: input.fileName,
  };
}

export async function deleteMedia(storageKey: string, kind: MediaKind) {
  ensureMediaProvider();

  await cloudinary.uploader.destroy(storageKey, {
    resource_type: kind === 'kundali' ? 'image' : 'image',
    invalidate: true,
  });
}
