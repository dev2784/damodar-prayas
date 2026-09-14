import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';

const listQuerySchema = z.object({
  status: z.enum(['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED']).default('OPEN'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const adminNoteSchema = z.object({
  adminNote: z.string().trim().max(2000).optional(),
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

export async function adminReportRoutes(app: FastifyInstance) {
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
    const where = { status } as const;

    const [items, total] = await Promise.all([
      prisma.profileReport.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
          matrimonyProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              status: true,
              createdById: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
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

  app.get('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const report = await prisma.profileReport.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            phone: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        matrimonyProfile: true,
      },
    });

    if (!report) {
      return reply.code(404).send({ error: 'PROFILE_REPORT_NOT_FOUND' });
    }

    return reply.send({ report });
  });

  app.post('/:id/review', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.profileReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'PROFILE_REPORT_NOT_FOUND' });
    }

    if (existing.status !== 'OPEN') {
      return reply.code(409).send({
        error: 'PROFILE_REPORT_NOT_OPEN',
        status: existing.status,
      });
    }

    const report = await prisma.$transaction(async (tx) => {
      const updated = await tx.profileReport.update({
        where: { id },
        data: { status: 'REVIEWING' },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PROFILE_REPORT_REVIEW_STARTED',
          entityType: 'ProfileReport',
          entityId: id,
        },
      });

      return updated;
    });

    return reply.send({ report });
  });

  app.post('/:id/resolve', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const parsed = adminNoteSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.profileReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'PROFILE_REPORT_NOT_FOUND' });
    }

    if (!['OPEN', 'REVIEWING'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'PROFILE_REPORT_NOT_ACTIONABLE',
        status: existing.status,
      });
    }

    const now = new Date();
    const report = await prisma.$transaction(async (tx) => {
      const updated = await tx.profileReport.update({
        where: { id },
        data: {
          status: 'RESOLVED',
          adminNote: parsed.data.adminNote,
          resolvedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PROFILE_REPORT_RESOLVED',
          entityType: 'ProfileReport',
          entityId: id,
          metadata: parsed.data.adminNote ? { adminNote: parsed.data.adminNote } : undefined,
        },
      });

      return updated;
    });

    return reply.send({ report });
  });

  app.post('/:id/dismiss', async (request, reply) => {
    const admin = await requireAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };
    const parsed = adminNoteSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.profileReport.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'PROFILE_REPORT_NOT_FOUND' });
    }

    if (!['OPEN', 'REVIEWING'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'PROFILE_REPORT_NOT_ACTIONABLE',
        status: existing.status,
      });
    }

    const now = new Date();
    const report = await prisma.$transaction(async (tx) => {
      const updated = await tx.profileReport.update({
        where: { id },
        data: {
          status: 'DISMISSED',
          adminNote: parsed.data.adminNote,
          resolvedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: admin.id,
          action: 'PROFILE_REPORT_DISMISSED',
          entityType: 'ProfileReport',
          entityId: id,
          metadata: parsed.data.adminNote ? { adminNote: parsed.data.adminNote } : undefined,
        },
      });

      return updated;
    });

    return reply.send({ report });
  });
}
