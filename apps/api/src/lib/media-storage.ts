import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join } from 'node:path';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

export type MediaKind = 'profile-photo' | 'kundali';

type UploadInput = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  folder: string;
  kind: MediaKind;
  publicBaseUrl?: string;
};

type UploadResult = {
  url: string;
  storageKey: string;
  mimeType: string;
  fileName: string;
};

const LOCAL_MEDIA_DIR = join(tmpdir(), 'damodar-prayas-media');
const LOCAL_PREFIX = 'local__';
const MIME_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};
const EXTENSION_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

if (env.MEDIA_PROVIDER === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

function ensureCloudinary() {
  if (env.MEDIA_PROVIDER !== 'cloudinary') {
    const error = new Error('Media provider is not configured.');
    Object.assign(error, { statusCode: 503, code: 'MEDIA_PROVIDER_NOT_CONFIGURED' });
    throw error;
  }
}

function isLocalStorageKey(storageKey: string) {
  return storageKey.startsWith(LOCAL_PREFIX) && /^local__[a-z0-9_-]+\.(jpg|jpeg|png|webp|pdf)$/i.test(storageKey);
}

function localPath(storageKey: string) {
  if (!isLocalStorageKey(storageKey)) throw new Error('Invalid local media key.');
  return join(LOCAL_MEDIA_DIR, storageKey);
}

async function uploadLocal(input: UploadInput): Promise<UploadResult> {
  if (!input.publicBaseUrl) {
    const error = new Error('Public API URL could not be determined for local media.');
    Object.assign(error, { statusCode: 500, code: 'MEDIA_PUBLIC_URL_UNAVAILABLE' });
    throw error;
  }

  const extension = MIME_EXTENSION[input.mimeType];
  if (!extension) throw new Error(`Unsupported local media type: ${input.mimeType}`);

  await mkdir(LOCAL_MEDIA_DIR, { recursive: true });
  const token = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const kind = input.kind === 'profile-photo' ? 'photo' : 'kundali';
  const storageKey = `${LOCAL_PREFIX}${kind}-${token}${extension}`;
  await writeFile(localPath(storageKey), input.buffer);

  return {
    url: `${input.publicBaseUrl.replace(/\/$/, '')}/api/v1/media/files/${encodeURIComponent(storageKey)}`,
    storageKey,
    mimeType: input.mimeType,
    fileName: input.fileName,
  };
}

export async function readLocalMedia(storageKey: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  if (!isLocalStorageKey(storageKey)) return null;
  try {
    const buffer = await readFile(localPath(storageKey));
    const mimeType = EXTENSION_MIME[extname(storageKey).toLowerCase()] ?? 'application/octet-stream';
    return { buffer, mimeType };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function uploadMedia(input: UploadInput): Promise<UploadResult> {
  if (env.MEDIA_PROVIDER === 'local') return uploadLocal(input);
  ensureCloudinary();

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
  if (isLocalStorageKey(storageKey)) {
    try {
      await unlink(localPath(storageKey));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    return;
  }

  ensureCloudinary();
  await cloudinary.uploader.destroy(storageKey, {
    resource_type: kind === 'kundali' ? 'image' : 'image',
    invalidate: true,
  });
}
