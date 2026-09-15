import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Prisma } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import {
  createMatrimonyProfileSchema,
  matrimonyListQuerySchema,
  updateMatrimonyProfileSchema,
} from './schemas.js';
import {
  ownerMatrimonyProfileSelect,
  publicMatrimonyProfileSelect,
} from './selectors.js';

async function getActiveUserId(request: FastifyRequest, reply: FastifyReply) {
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

    return user.id;
  } catch {
    await reply.code(401).send({ error: 'UNAUTHORIZED' });
    return null;
  }
}

function yearsAgo(years: number) {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  date.setFullYear(date.getFullYear() - years);
  return date;
}

export async function matrimonyRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const parsed = matrimonyListQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      category,
      gender,
      maritalStatus,
      state,
      city,
      minAge,
      maxAge,
      featured,
      page,
      limit,
    } = parsed.data;

    const where: Prisma.MatrimonyProfileWhereInput = {
      status: 'APPROVED',
      deletedAt: null,
      ...(category ? { category } : {}),
      ...(gender ? { gender } : {}),
      ...(maritalStatus ? { maritalStatus } : {}),
      ...(featured !== undefined ? { isFeatured: featured } : {}),
      ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}),
      ...(city ? { currentCity: { equals: city, mode: 'insensitive' } } : {}),
    };

    if (minAge !== undefined || maxAge !== undefined) {
      where.dateOfBirth = {
        ...(maxAge !== undefined ? { gte: yearsAgo(maxAge + 1) } : {}),
        ...(minAge !== undefined ? { lte: yearsAgo(minAge) } : {}),
      };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.matrimonyProfile.findMany({
        where,
        select: publicMatrimonyProfileSelect,
        orderBy: [{ isFeatured: 'desc' }, { approvedAt: 'desc' }, { createdAt: 'desc' }],
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

  app.get('/mine', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const items = await prisma.matrimonyProfile.findMany({
      where: {
        createdById: userId,
        deletedAt: null,
      },
      select: ownerMatrimonyProfileSelect,
      orderBy: { createdAt: 'desc' },
    });

    return reply.send({ items });
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const profile = await prisma.matrimonyProfile.findFirst({
      where: {
        id,
        status: 'APPROVED',
        deletedAt: null,
      },
      select: publicMatrimonyProfileSelect,
    });

    if (!profile) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    return reply.send({ profile });
  });

  app.post('/', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const parsed = createMatrimonyProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existingEditable = await prisma.matrimonyProfile.findFirst({
      where: {
        createdById: userId,
        deletedAt: null,
        status: { in: ['DRAFT', 'REJECTED'] },
        profileFor: parsed.data.profileFor,
        firstName: { equals: parsed.data.firstName, mode: 'insensitive' },
        lastName: { equals: parsed.data.lastName, mode: 'insensitive' },
        dateOfBirth: parsed.data.dateOfBirth,
      },
      select: ownerMatrimonyProfileSelect,
      orderBy: { createdAt: 'desc' },
    });

    if (existingEditable) {
      return reply.send({ profile: existingEditable, reused: true });
    }

    const profile = await prisma.matrimonyProfile.create({
      data: {
        createdById: userId,
        ...parsed.data,
        status: 'DRAFT',
      },
      select: ownerMatrimonyProfileSelect,
    });

    return reply.code(201).send({ profile });
  });

  app.patch('/:id', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { id } = request.params as { id: string };
    const parsed = updateMatrimonyProfileSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const existing = await prisma.matrimonyProfile.findFirst({
      where: {
        id,
        createdById: userId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_NOT_EDITABLE',
        status: existing.status,
      });
    }

    const profile = await prisma.matrimonyProfile.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(existing.status === 'REJECTED'
          ? { status: 'DRAFT' as const, rejectionReason: null }
          : {}),
      },
      select: ownerMatrimonyProfileSelect,
    });

    return reply.send({ profile });
  });

  app.delete('/:id', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.matrimonyProfile.findFirst({
      where: { id, createdById: userId, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!existing) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return reply.code(409).send({ error: 'MATRIMONY_PROFILE_NOT_DELETABLE', status: existing.status });
    }

    await prisma.matrimonyProfile.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return reply.code(204).send();
  });

  app.post('/:id/submit', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { id } = request.params as { id: string };
    const existing = await prisma.matrimonyProfile.findFirst({
      where: {
        id,
        createdById: userId,
        deletedAt: null,
      },
      select: { id: true, status: true },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_CANNOT_BE_SUBMITTED',
        status: existing.status,
      });
    }

    const photoCount = await prisma.profilePhoto.count({
      where: { matrimonyProfileId: id },
    });

    if (photoCount < 1) {
      return reply.code(409).send({
        error: 'PROFILE_PHOTO_REQUIRED',
        message: 'Add at least one profile photo before submitting for review.',
      });
    }

    const profile = await prisma.matrimonyProfile.update({
      where: { id },
      data: {
        status: 'PENDING',
        rejectionReason: null,
      },
      select: ownerMatrimonyProfileSelect,
    });

    return reply.send({ profile });
  });
}
