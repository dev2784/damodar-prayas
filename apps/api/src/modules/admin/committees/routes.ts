import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../../lib/prisma.js';
import { createCommitteeSchema, updateCommitteeSchema } from '../../committees/schemas.js';

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

    const items = await prisma.committee.findMany({
      where: { deletedAt: null },
      include: {
        translations: true,
        members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
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
          action: 'COMMITTEE_CREATED',
          entityType: 'Committee',
          entityId: created.id,
        },
      });

      return created;
    });

    return reply.code(201).send({ committee });
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
        data: { deletedAt: new Date(), isActive: false },
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
