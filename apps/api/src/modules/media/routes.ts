import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { deleteMedia, uploadMedia } from '../../lib/media-storage.js';

const PHOTO_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const KUNDALI_MIME_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const MAX_PROFILE_PHOTOS = 6;

async function getActiveUserId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      await reply.code(401).send({ error: 'UNAUTHORIZED' });
      return null;
    }

    return user.id;
  } catch {
    await reply.code(401).send({ error: 'UNAUTHORIZED' });
    return null;
  }
}

async function getOwnedProfile(profileId: string, userId: string) {
  return prisma.matrimonyProfile.findFirst({
    where: {
      id: profileId,
      createdById: userId,
      deletedAt: null,
    },
    select: { id: true, status: true },
  });
}

export async function mediaRoutes(app: FastifyInstance) {
  app.post('/matrimony/:profileId/photos', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { profileId } = request.params as { profileId: string };
    const profile = await getOwnedProfile(profileId, userId);
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });

    if (profile.status === 'SUSPENDED' || profile.status === 'MARRIED') {
      return reply.code(409).send({ error: 'PROFILE_MEDIA_UPDATE_NOT_ALLOWED' });
    }

    const photoCount = await prisma.profilePhoto.count({ where: { matrimonyProfileId: profileId } });
    if (photoCount >= MAX_PROFILE_PHOTOS) {
      return reply.code(409).send({ error: 'PROFILE_PHOTO_LIMIT_REACHED', limit: MAX_PROFILE_PHOTOS });
    }

    const file = await request.file({ limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
    if (!file) return reply.code(400).send({ error: 'FILE_REQUIRED' });
    if (!PHOTO_MIME_TYPES.has(file.mimetype)) {
      return reply.code(400).send({ error: 'UNSUPPORTED_PHOTO_TYPE' });
    }

    const buffer = await file.toBuffer();
    const uploaded = await uploadMedia({
      buffer,
      mimeType: file.mimetype,
      fileName: file.filename,
      folder: `damodar-prayas/matrimony/${profileId}/photos`,
      kind: 'profile-photo',
    });

    const existingPrimary = await prisma.profilePhoto.findFirst({
      where: { matrimonyProfileId: profileId, isPrimary: true },
      select: { id: true },
    });

    const photo = await prisma.profilePhoto.create({
      data: {
        matrimonyProfileId: profileId,
        url: uploaded.url,
        storageKey: uploaded.storageKey,
        status: 'PENDING',
        isPrimary: !existingPrimary,
        sortOrder: photoCount,
      },
    });

    return reply.code(201).send({ photo });
  });

  app.delete('/matrimony/:profileId/photos/:photoId', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { profileId, photoId } = request.params as { profileId: string; photoId: string };
    const profile = await getOwnedProfile(profileId, userId);
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });

    const photo = await prisma.profilePhoto.findFirst({
      where: { id: photoId, matrimonyProfileId: profileId },
    });
    if (!photo) return reply.code(404).send({ error: 'PROFILE_PHOTO_NOT_FOUND' });

    if (photo.storageKey) await deleteMedia(photo.storageKey, 'profile-photo');

    await prisma.$transaction(async (tx) => {
      await tx.profilePhoto.delete({ where: { id: photo.id } });

      if (photo.isPrimary) {
        const next = await tx.profilePhoto.findFirst({
          where: { matrimonyProfileId: profileId },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          select: { id: true },
        });
        if (next) await tx.profilePhoto.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    });

    return reply.code(204).send();
  });

  app.post('/matrimony/:profileId/photos/:photoId/primary', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { profileId, photoId } = request.params as { profileId: string; photoId: string };
    const profile = await getOwnedProfile(profileId, userId);
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });

    const photo = await prisma.profilePhoto.findFirst({
      where: { id: photoId, matrimonyProfileId: profileId },
      select: { id: true },
    });
    if (!photo) return reply.code(404).send({ error: 'PROFILE_PHOTO_NOT_FOUND' });

    await prisma.$transaction([
      prisma.profilePhoto.updateMany({
        where: { matrimonyProfileId: profileId, isPrimary: true },
        data: { isPrimary: false },
      }),
      prisma.profilePhoto.update({ where: { id: photoId }, data: { isPrimary: true } }),
    ]);

    const updated = await prisma.profilePhoto.findUnique({ where: { id: photoId } });
    return reply.send({ photo: updated });
  });

  app.post('/matrimony/:profileId/kundali', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { profileId } = request.params as { profileId: string };
    const profile = await getOwnedProfile(profileId, userId);
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });

    if (profile.status === 'SUSPENDED' || profile.status === 'MARRIED') {
      return reply.code(409).send({ error: 'PROFILE_MEDIA_UPDATE_NOT_ALLOWED' });
    }

    const existing = await prisma.kundali.findFirst({
      where: { matrimonyProfileId: profileId },
      select: { id: true },
    });
    if (existing) return reply.code(409).send({ error: 'KUNDALI_ALREADY_UPLOADED' });

    const file = await request.file({ limits: { fileSize: 10 * 1024 * 1024, files: 1 } });
    if (!file) return reply.code(400).send({ error: 'FILE_REQUIRED' });
    if (!KUNDALI_MIME_TYPES.has(file.mimetype)) {
      return reply.code(400).send({ error: 'UNSUPPORTED_KUNDALI_TYPE' });
    }

    const buffer = await file.toBuffer();
    const uploaded = await uploadMedia({
      buffer,
      mimeType: file.mimetype,
      fileName: file.filename,
      folder: `damodar-prayas/matrimony/${profileId}/kundali`,
      kind: 'kundali',
    });

    const kundali = await prisma.kundali.create({
      data: {
        matrimonyProfileId: profileId,
        fileUrl: uploaded.url,
        storageKey: uploaded.storageKey,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        status: 'PENDING',
      },
    });

    return reply.code(201).send({ kundali });
  });

  app.delete('/matrimony/:profileId/kundali/:kundaliId', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { profileId, kundaliId } = request.params as { profileId: string; kundaliId: string };
    const profile = await getOwnedProfile(profileId, userId);
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });

    const kundali = await prisma.kundali.findFirst({
      where: { id: kundaliId, matrimonyProfileId: profileId },
    });
    if (!kundali) return reply.code(404).send({ error: 'KUNDALI_NOT_FOUND' });

    if (kundali.storageKey) await deleteMedia(kundali.storageKey, 'kundali');
    await prisma.kundali.delete({ where: { id: kundali.id } });

    return reply.code(204).send();
  });
}
