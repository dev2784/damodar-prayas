import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { communityPostListQuerySchema, submitCommunityPostSchema } from './schemas.js';

async function getActiveUserId(request: Parameters<FastifyInstance['get']>[1] extends never ? never : any) {
  await request.jwtVerify();
  const userId = request.user.sub;
  const user = await prisma.user.findFirst({
    where: { id: userId, isActive: true, deletedAt: null },
    select: { id: true },
  });
  return user?.id ?? null;
}

export async function communityRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const parsed = communityPostListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const { category, language, page, limit } = parsed.data;
    const now = new Date();
    const where = {
      status: 'PUBLISHED' as const,
      deletedAt: null,
      ...(category ? { category } : {}),
      OR: [{ expiresAt: null }, { expiresAt: { gte: now } }],
    };

    const [posts, total] = await Promise.all([
      prisma.communityPost.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          translations: {
            where: { language },
            select: { language: true, title: true, details: true },
          },
        },
      }),
      prisma.communityPost.count({ where }),
    ]);

    return {
      items: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  });

  app.get('/:id', async (request, reply) => {
    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);
    if (!params.success) return reply.code(400).send({ error: 'INVALID_POST_ID' });

    const post = await prisma.communityPost.findFirst({
      where: {
        id: params.data.id,
        status: 'PUBLISHED',
        deletedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: { translations: true },
    });

    if (!post) return reply.code(404).send({ error: 'POST_NOT_FOUND' });
    return { post };
  });

  app.post('/submit', async (request, reply) => {
    let userId: string | null;
    try {
      userId = await getActiveUserId(request);
    } catch {
      return reply.code(401).send({ error: 'UNAUTHORIZED' });
    }
    if (!userId) return reply.code(401).send({ error: 'UNAUTHORIZED' });

    const parsed = submitCommunityPostSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    }

    const { translations, ...data } = parsed.data;
    const post = await prisma.communityPost.create({
      data: {
        ...data,
        createdById: userId,
        status: 'PENDING',
        translations: { create: translations },
      },
      include: { translations: true },
    });

    return reply.code(201).send({ post });
  });
}
