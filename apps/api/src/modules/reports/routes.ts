import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../lib/prisma.js';
import { createProfileReportSchema, myReportsQuerySchema } from './schemas.js';

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

export async function reportRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const user = await getActiveUser(request, reply);
    if (!user) return;

    const parsed = createProfileReportSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { profileId, reason, details } = parsed.data;
    const profile = await prisma.matrimonyProfile.findFirst({
      where: {
        id: profileId,
        status: 'APPROVED',
        deletedAt: null,
      },
      select: { id: true, createdById: true },
    });

    if (!profile) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    if (profile.createdById === user.id) {
      return reply.code(400).send({ error: 'CANNOT_REPORT_OWN_PROFILE' });
    }

    const existing = await prisma.profileReport.findFirst({
      where: {
        reporterId: user.id,
        matrimonyProfileId: profileId,
        status: { in: ['OPEN', 'REVIEWING'] },
      },
      select: { id: true, status: true },
    });

    if (existing) {
      return reply.code(409).send({
        error: 'ACTIVE_REPORT_ALREADY_EXISTS',
        reportId: existing.id,
        status: existing.status,
      });
    }

    const report = await prisma.profileReport.create({
      data: {
        reporterId: user.id,
        matrimonyProfileId: profileId,
        reason,
        details,
        status: 'OPEN',
      },
    });

    return reply.code(201).send({ report });
  });

  app.get('/mine', async (request, reply) => {
    const user = await getActiveUser(request, reply);
    if (!user) return;

    const parsed = myReportsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { page, limit } = parsed.data;
    const where = { reporterId: user.id } as const;

    const [items, total] = await Promise.all([
      prisma.profileReport.findMany({
        where,
        include: {
          matrimonyProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.profileReport.count({ where }),
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
}
