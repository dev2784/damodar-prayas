import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';

const listQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  type: z.enum(['photo', 'kundali']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const rejectSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();
    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true,
        deletedAt: null,
      },
      select: { id: true, role: true },
    });

    if (!user) {
      await reply.code(403).send({ error: 'ADMIN_REQUIRED' });
      return null;
    }

    return user;
  } catch {
    await reply.code(401).send({ error: 'UNAUTHORIZED' });
    return null;
  }
}

export async function adminMediaRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { status, type, page, limit } = parsed.data;
    const skip = (page - 1) * limit;

    if (type === 'photo') {
      const [items, total] = await Promise.all([
        prisma.profilePhoto.findMany({
          where: { status },
          include: {
            matrimonyProfile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                createdById: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        }),
        prisma.profilePhoto.count({ where: { status } }),
      ]);

      return reply.send({
        type: 'photo',
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    if (type === 'kundali') {
      const [items, total] = await Promise.all([
        prisma.kundali.findMany({
          where: { status },
          include: {
            matrimonyProfile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                createdById: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          skip,
          take: limit,
        }),
        prisma.kundali.count({ where: { status } }),
      ]);

      return reply.send({
        type: 'kundali',
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const [photos, kundalis] = await Promise.all([
      prisma.profilePhoto.findMany({
        where: { status },
        include: {
          matrimonyProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              createdById: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      }),
      prisma.kundali.findMany({
        where: { status },
        include: {
          matrimonyProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              createdById: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
      }),
    ]);

    return reply.send({ status, photos, kundalis });
  });

  app.post('/photos/:id/approve', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.profilePhoto.findUnique({
      where: { id },
      include: {
        matrimonyProfile: { select: { createdById: true } },
      },
    });

    if (!existing) return reply.code(404).send({ error: 'PROFILE_PHOTO_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'PROFILE_PHOTO_NOT_PENDING', status: existing.status });
    }

    const photo = await prisma.$transaction(async (tx) => {
      const updated = await tx.profilePhoto.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.notification.create({
        data: {
          userId: existing.matrimonyProfile.createdById,
          type: 'GENERAL',
          titleHi: 'आपकी प्रोफ़ाइल फ़ोटो स्वीकृत हो गई है',
          titleEn: 'Your profile photo has been approved',
          bodyHi: 'स्वीकृत फ़ोटो अब आपकी सार्वजनिक वैवाहिक प्रोफ़ाइल पर दिखाई दे सकती है।',
          bodyEn: 'The approved photo can now appear on your public matrimony profile.',
          data: { photoId: id, profileId: existing.matrimonyProfileId },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PROFILE_PHOTO_APPROVED',
          entityType: 'ProfilePhoto',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ photo });
  });

  app.post('/photos/:id/reject', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const parsed = rejectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.profilePhoto.findUnique({
      where: { id },
      include: {
        matrimonyProfile: { select: { createdById: true } },
      },
    });

    if (!existing) return reply.code(404).send({ error: 'PROFILE_PHOTO_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'PROFILE_PHOTO_NOT_PENDING', status: existing.status });
    }

    const reason = parsed.data.reason;
    const photo = await prisma.$transaction(async (tx) => {
      const updated = await tx.profilePhoto.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await tx.notification.create({
        data: {
          userId: existing.matrimonyProfile.createdById,
          type: 'GENERAL',
          titleHi: 'आपकी प्रोफ़ाइल फ़ोटो स्वीकृत नहीं हुई',
          titleEn: 'Your profile photo was not approved',
          bodyHi: reason,
          bodyEn: reason,
          data: { photoId: id, profileId: existing.matrimonyProfileId },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PROFILE_PHOTO_REJECTED',
          entityType: 'ProfilePhoto',
          entityId: id,
          metadata: { reason },
        },
      });

      return updated;
    });

    return reply.send({ photo });
  });

  app.post('/kundalis/:id/approve', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.kundali.findUnique({
      where: { id },
      include: {
        matrimonyProfile: { select: { createdById: true } },
      },
    });

    if (!existing) return reply.code(404).send({ error: 'KUNDALI_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'KUNDALI_NOT_PENDING', status: existing.status });
    }

    const kundali = await prisma.$transaction(async (tx) => {
      const updated = await tx.kundali.update({
        where: { id },
        data: { status: 'APPROVED' },
      });

      await tx.notification.create({
        data: {
          userId: existing.matrimonyProfile.createdById,
          type: 'GENERAL',
          titleHi: 'आपकी कुंडली स्वीकृत हो गई है',
          titleEn: 'Your kundali has been approved',
          bodyHi: 'आपकी अपलोड की गई कुंडली सत्यापन में स्वीकृत हो गई है।',
          bodyEn: 'Your uploaded kundali has been approved in moderation.',
          data: { kundaliId: id, profileId: existing.matrimonyProfileId },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'KUNDALI_APPROVED',
          entityType: 'Kundali',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ kundali });
  });

  app.post('/kundalis/:id/reject', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const parsed = rejectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const { id } = request.params as { id: string };
    const existing = await prisma.kundali.findUnique({
      where: { id },
      include: {
        matrimonyProfile: { select: { createdById: true } },
      },
    });

    if (!existing) return reply.code(404).send({ error: 'KUNDALI_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'KUNDALI_NOT_PENDING', status: existing.status });
    }

    const reason = parsed.data.reason;
    const kundali = await prisma.$transaction(async (tx) => {
      const updated = await tx.kundali.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await tx.notification.create({
        data: {
          userId: existing.matrimonyProfile.createdById,
          type: 'GENERAL',
          titleHi: 'आपकी कुंडली स्वीकृत नहीं हुई',
          titleEn: 'Your kundali was not approved',
          bodyHi: reason,
          bodyEn: reason,
          data: { kundaliId: id, profileId: existing.matrimonyProfileId },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'KUNDALI_REJECTED',
          entityType: 'Kundali',
          entityId: id,
          metadata: { reason },
        },
      });

      return updated;
    });

    return reply.send({ kundali });
  });
}
