import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';
import { createCommitteeSchema, updateCommitteeSchema } from '../../committees/schemas.js';

const listQuerySchema = z.object({
  status: z.enum(['PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).default('PENDING'),
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

export async function adminCommitteeRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const items = await prisma.committee.findMany({
      where: { status: parsed.data.status, deletedAt: null },
      include: {
        translations: true,
        members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
      orderBy: [{ updatedAt: 'asc' }, { createdAt: 'asc' }],
    });

    return reply.send({ items });
  });

  app.get('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const committee = await prisma.committee.findFirst({
      where: { id, deletedAt: null },
      include: {
        translations: true,
        members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!committee) return reply.code(404).send({ error: 'COMMITTEE_NOT_FOUND' });
    return reply.send({ committee });
  });

  app.post('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const parsed = createCommitteeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { translations, members, ...data } = parsed.data;
    const committee = await prisma.$transaction(async (tx) => {
      const created = await tx.committee.create({
        data: {
          ...data,
          createdById: admin.id,
          status: 'PENDING',
          publishedAt: null,
          rejectionReason: null,
          translations: { create: translations },
          members: { create: members },
        },
        include: {
          translations: true,
          members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMITTEE_CREATED_PENDING',
          entityType: 'Committee',
          entityId: created.id,
        },
      });

      return created;
    });

    return reply.code(201).send({ committee });
  });

  app.post('/:id/approve', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.committee.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) return reply.code(404).send({ error: 'COMMITTEE_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'COMMITTEE_NOT_PENDING', status: existing.status });
    }

    const committee = await prisma.$transaction(async (tx) => {
      const updated = await tx.committee.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          rejectionReason: null,
          isActive: true,
        },
        include: {
          translations: true,
          members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });

      if (existing.createdById) {
        await tx.notification.create({
          data: {
            userId: existing.createdById,
            type: 'GENERAL',
            titleHi: 'आपकी समिति स्वीकृत हो गई है',
            titleEn: 'Your committee has been approved',
            bodyHi: 'समिति अब ऐप में दिखाई देगी।',
            bodyEn: 'The committee is now visible in the app.',
            data: { committeeId: id },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMITTEE_APPROVED',
          entityType: 'Committee',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ committee });
  });

  app.post('/:id/reject', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const parsed = rejectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const existing = await prisma.committee.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) return reply.code(404).send({ error: 'COMMITTEE_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'COMMITTEE_NOT_PENDING', status: existing.status });
    }

    const reason = parsed.data.reason;
    const committee = await prisma.$transaction(async (tx) => {
      const updated = await tx.committee.update({
        where: { id },
        data: {
          status: 'REJECTED',
          rejectionReason: reason,
          publishedAt: null,
        },
        include: {
          translations: true,
          members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });

      if (existing.createdById) {
        await tx.notification.create({
          data: {
            userId: existing.createdById,
            type: 'GENERAL',
            titleHi: 'समिति में बदलाव आवश्यक हैं',
            titleEn: 'Your committee needs changes',
            bodyHi: reason,
            bodyEn: reason,
            data: { committeeId: id },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMITTEE_REJECTED',
          entityType: 'Committee',
          entityId: id,
          metadata: { reason },
        },
      });

      return updated;
    });

    return reply.send({ committee });
  });

  app.patch('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const parsed = updateCommitteeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.committee.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) return reply.code(404).send({ error: 'COMMITTEE_NOT_FOUND' });

    const { translations, members, ...data } = parsed.data;
    const committee = await prisma.$transaction(async (tx) => {
      if (translations) {
        await tx.committeeTranslation.deleteMany({ where: { committeeId: id } });
      }
      if (members) {
        await tx.committeeMember.deleteMany({ where: { committeeId: id } });
      }

      const updated = await tx.committee.update({
        where: { id },
        data: {
          ...data,
          ...(translations ? { translations: { create: translations } } : {}),
          ...(members ? { members: { create: members } } : {}),
        },
        include: {
          translations: true,
          members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMITTEE_UPDATED',
          entityType: 'Committee',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ committee });
  });

  app.delete('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.committee.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
    if (!existing) return reply.code(404).send({ error: 'COMMITTEE_NOT_FOUND' });

    await prisma.$transaction(async (tx) => {
      await tx.committee.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false, status: 'ARCHIVED' },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMITTEE_DELETED',
          entityType: 'Committee',
          entityId: id,
        },
      });
    });

    return reply.code(204).send();
  });
}
