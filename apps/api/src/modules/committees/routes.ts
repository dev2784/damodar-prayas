import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { committeeListQuerySchema, submitCommitteeSchema } from './schemas.js';

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

export async function committeeRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const parsed = committeeListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { state, district, city, language, page, limit } = parsed.data;
    const where = {
      status: 'PUBLISHED' as const,
      isActive: true,
      deletedAt: null,
      ...(state ? { state: { equals: state, mode: 'insensitive' as const } } : {}),
      ...(district ? { district: { equals: district, mode: 'insensitive' as const } } : {}),
      ...(city ? { city: { equals: city, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.committee.findMany({
        where,
        select: {
          id: true,
          bannerUrl: true,
          logoUrl: true,
          city: true,
          district: true,
          state: true,
          address: true,
          phone: true,
          email: true,
          sortOrder: true,
          publishedAt: true,
          translations: {
            where: { language },
            select: { language: true, name: true, details: true },
          },
          members: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              designationHi: true,
              designationEn: true,
              phone: true,
              email: true,
              photoUrl: true,
              sortOrder: true,
            },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.committee.count({ where }),
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

  app.post('/submit', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const parsed = submitCommitteeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { translations, members, ...data } = parsed.data;
    const committee = await prisma.committee.create({
      data: {
        ...data,
        createdById: userId,
        status: 'PENDING',
        publishedAt: null,
        rejectionReason: null,
        isActive: true,
        sortOrder: 0,
        translations: { create: translations },
        members: { create: members },
      },
      include: {
        translations: true,
        members: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    return reply.code(201).send({
      committee,
      message: 'SUBMITTED_FOR_APPROVAL',
    });
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const committee = await prisma.committee.findFirst({
      where: { id, status: 'PUBLISHED', isActive: true, deletedAt: null },
      include: {
        translations: true,
        members: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });

    if (!committee) {
      return reply.code(404).send({ error: 'COMMITTEE_NOT_FOUND' });
    }

    return reply.send({ committee });
  });
}
