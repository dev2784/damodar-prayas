import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  unreadOnly: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
});

async function getActiveUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();

    const user = await prisma.user.findFirst({
      where: {
        id: payload.sub,
        isActive: true,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!user) {
      await reply.code(401).send({ error: 'UNAUTHORIZED' });
      return null;
    }

    return user;
  } catch {
    await reply.code(401).send({ error: 'UNAUTHORIZED' });
    return null;
  }
}

export async function notificationRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const user = await getActiveUser(request, reply);
    if (!user) return;

    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { page, limit, unreadOnly } = parsed.data;
    const where = {
      userId: user.id,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.id, readAt: null },
      }),
    ]);

    return reply.send({
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  });

  app.get('/unread-count', async (request, reply) => {
    const user = await getActiveUser(request, reply);
    if (!user) return;

    const unreadCount = await prisma.notification.count({
      where: { userId: user.id, readAt: null },
    });

    return reply.send({ unreadCount });
  });

  app.patch('/:id/read', async (request, reply) => {
    const user = await getActiveUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.notification.findFirst({
      where: { id, userId: user.id },
      select: { id: true, readAt: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'NOTIFICATION_NOT_FOUND' });
    }

    if (existing.readAt) {
      const notification = await prisma.notification.findUnique({ where: { id } });
      return reply.send({ notification });
    }

    const notification = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    return reply.send({ notification });
  });

  app.patch('/read-all', async (request, reply) => {
    const user = await getActiveUser(request, reply);
    if (!user) return;

    const result = await prisma.notification.updateMany({
      where: {
        userId: user.id,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    return reply.send({ updatedCount: result.count });
  });
}
