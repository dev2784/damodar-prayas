import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { ownerMatrimonyProfileSelect } from '../../matrimony/selectors.js';

const listQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'MARRIED']).default('PENDING'),
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

export async function adminMatrimonyRoutes(app: FastifyInstance) {
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

    const { status, page, limit } = parsed.data;
    const where = { status, deletedAt: null } as const;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.matrimonyProfile.findMany({
        where,
        select: ownerMatrimonyProfileSelect,
        orderBy: { updatedAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.matrimonyProfile.count({ where }),
    ]);

    return reply.send({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  });

  app.get('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const profile = await prisma.matrimonyProfile.findFirst({
      where: { id, deletedAt: null },
      select: ownerMatrimonyProfileSelect,
    });

    if (!profile) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    return reply.send({ profile });
  });

  app.post('/:id/approve', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.matrimonyProfile.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    if (existing.status !== 'PENDING') {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_NOT_PENDING',
        status: existing.status,
      });
    }

    const now = new Date();
    const profile = await prisma.$transaction(async (tx) => {
      const updated = await tx.matrimonyProfile.update({
        where: { id },
        data: {
          status: 'APPROVED',
          rejectionReason: null,
          approvedAt: now,
        },
        select: ownerMatrimonyProfileSelect,
      });

      await tx.notification.create({
        data: {
          userId: existing.createdById,
          type: 'PROFILE_APPROVED',
          titleHi: 'आपकी वैवाहिक प्रोफ़ाइल स्वीकृत हो गई है',
          titleEn: 'Your matrimony profile has been approved',
          bodyHi: 'आपकी प्रोफ़ाइल अब वैवाहिक खोज में दिखाई देगी।',
          bodyEn: 'Your profile is now visible in matrimony search.',
          data: { profileId: id },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'MATRIMONY_PROFILE_APPROVED',
          entityType: 'MatrimonyProfile',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ profile });
  });

  app.post('/:id/reject', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const parsed = rejectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.matrimonyProfile.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    if (existing.status !== 'PENDING') {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_NOT_PENDING',
        status: existing.status,
      });
    }

    const reason = parsed.data.reason;
    const profile = await prisma.$transaction(async (tx) => {
      const updated = await tx.matrimonyProfile.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          approvedAt: null,
        },
        select: ownerMatrimonyProfileSelect,
      });

      await tx.notification.create({
        data: {
          userId: existing.createdById,
          type: 'PROFILE_REJECTED',
          titleHi: 'आपकी वैवाहिक प्रोफ़ाइल में बदलाव आवश्यक हैं',
          titleEn: 'Your matrimony profile needs changes',
          bodyHi: reason,
          bodyEn: reason,
          data: { profileId: id },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'MATRIMONY_PROFILE_REJECTED',
          entityType: 'MatrimonyProfile',
          entityId: id,
          metadata: { reason },
        },
      });

      return updated;
    });

    return reply.send({ profile });
  });
}
