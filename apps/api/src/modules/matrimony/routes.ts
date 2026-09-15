import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { Prisma } from '../../../generated/prisma/index.js';
import { prisma } from '../../lib/prisma.js';
import {
  createMatrimonyProfileSchema,
  matrimonyDeleteRequestSchema,
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

async function findDuplicatePersonProfile({
  userId,
  firstName,
  lastName,
  dateOfBirth,
  gender,
  excludeId,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  excludeId?: string;
}) {
  return prisma.matrimonyProfile.findFirst({
    where: {
      createdById: userId,
      deletedAt: null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
      firstName: { equals: firstName, mode: 'insensitive' },
      lastName: { equals: lastName, mode: 'insensitive' },
      dateOfBirth,
      gender,
    },
    select: {
      id: true,
      status: true,
      profileFor: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      gender: true,
    },
    orderBy: { createdAt: 'desc' },
  });
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

    const duplicate = await findDuplicatePersonProfile({
      userId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      dateOfBirth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
    });

    if (duplicate) {
      if (['DRAFT', 'REJECTED'].includes(duplicate.status)) {
        const existingEditable = await prisma.matrimonyProfile.findUnique({
          where: { id: duplicate.id },
          select: ownerMatrimonyProfileSelect,
        });

        if (existingEditable) {
          return reply.send({ profile: existingEditable, reused: true });
        }
      }

      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_ALREADY_EXISTS',
        message: 'A matrimony profile for this person already exists in your account.',
        profileId: duplicate.id,
        status: duplicate.status,
      });
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
      select: {
        id: true,
        status: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        gender: true,
      },
    });

    if (!existing) {
      return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    }

    if (!['DRAFT', 'REJECTED', 'APPROVED'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_NOT_EDITABLE',
        status: existing.status,
      });
    }

    const nextIdentity = {
      firstName: parsed.data.firstName ?? existing.firstName,
      lastName: parsed.data.lastName ?? existing.lastName,
      dateOfBirth: parsed.data.dateOfBirth ?? existing.dateOfBirth,
      gender: parsed.data.gender ?? existing.gender,
    };

    const duplicate = await findDuplicatePersonProfile({
      userId,
      ...nextIdentity,
      excludeId: id,
    });

    if (duplicate) {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_ALREADY_EXISTS',
        message: 'Another matrimony profile for this person already exists in your account.',
        profileId: duplicate.id,
        status: duplicate.status,
      });
    }

    const profile = await prisma.matrimonyProfile.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(existing.status === 'REJECTED'
          ? { status: 'DRAFT' as const, rejectionReason: null }
          : {}),
        ...(existing.status === 'APPROVED'
          ? { status: 'PENDING' as const, rejectionReason: null, approvedAt: null }
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

  app.post('/:id/delete-request', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { id } = request.params as { id: string };
    const parsed = matrimonyDeleteRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const profile = await prisma.matrimonyProfile.findFirst({
      where: { id, createdById: userId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    if (!['PENDING', 'APPROVED'].includes(profile.status)) {
      return reply.code(409).send({ error: 'DELETE_REQUEST_NOT_ALLOWED', status: profile.status });
    }

    const existingRequest = await prisma.matrimonyDeleteRequest.findFirst({
      where: { matrimonyProfileId: id, requestedById: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (existingRequest) {
      return reply.code(409).send({ error: 'DELETE_REQUEST_ALREADY_PENDING', request: existingRequest });
    }

    const deleteRequest = await prisma.matrimonyDeleteRequest.create({
      data: { matrimonyProfileId: id, requestedById: userId, reason: parsed.data.reason },
      select: { id: true, reason: true, status: true, createdAt: true },
    });

    return reply.code(201).send({ request: deleteRequest });
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
