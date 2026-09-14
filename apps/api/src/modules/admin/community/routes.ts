import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';

const listQuerySchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED']).default('PENDING'),
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

export async function adminCommunityRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const { status, page, limit } = parsed.data;
    const where = { status, deletedAt: null } as const;
    const [items, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        include: { translations: true },
        orderBy: { updatedAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communityPost.count({ where }),
    ]);

    return reply.send({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  });

  app.get('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const post = await prisma.communityPost.findFirst({
      where: { id, deletedAt: null },
      include: { translations: true },
    });

    if (!post) return reply.code(404).send({ error: 'COMMUNITY_POST_NOT_FOUND' });
    return reply.send({ post });
  });

  app.post('/:id/approve', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.communityPost.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) return reply.code(404).send({ error: 'COMMUNITY_POST_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'COMMUNITY_POST_NOT_PENDING', status: existing.status });
    }

    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.communityPost.update({
        where: { id },
        data: { status: 'PUBLISHED', publishedAt: new Date(), rejectionReason: null },
        include: { translations: true },
      });

      if (existing.createdById) {
        await tx.notification.create({
          data: {
            userId: existing.createdById,
            type: 'COMMUNITY_POST',
            titleHi: 'आपकी सामुदायिक पोस्ट स्वीकृत हो गई है',
            titleEn: 'Your community post has been approved',
            bodyHi: 'आपकी पोस्ट अब समुदाय में दिखाई देगी।',
            bodyEn: 'Your post is now visible in the community feed.',
            data: { postId: id },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMUNITY_POST_APPROVED',
          entityType: 'CommunityPost',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ post });
  });

  app.post('/:id/reject', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const parsed = rejectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const existing = await prisma.communityPost.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, createdById: true },
    });

    if (!existing) return reply.code(404).send({ error: 'COMMUNITY_POST_NOT_FOUND' });
    if (existing.status !== 'PENDING') {
      return reply.code(409).send({ error: 'COMMUNITY_POST_NOT_PENDING', status: existing.status });
    }

    const reason = parsed.data.reason;
    const post = await prisma.$transaction(async (tx) => {
      const updated = await tx.communityPost.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: reason, publishedAt: null },
        include: { translations: true },
      });

      if (existing.createdById) {
        await tx.notification.create({
          data: {
            userId: existing.createdById,
            type: 'COMMUNITY_POST',
            titleHi: 'आपकी सामुदायिक पोस्ट में बदलाव आवश्यक हैं',
            titleEn: 'Your community post needs changes',
            bodyHi: reason,
            bodyEn: reason,
            data: { postId: id },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'COMMUNITY_POST_REJECTED',
          entityType: 'CommunityPost',
          entityId: id,
          metadata: { reason },
        },
      });

      return updated;
    });

    return reply.send({ post });
  });
}
