import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';

const listQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(['ALL', 'ACTIVE', 'BLOCKED']).default('ALL'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true, deletedAt: null },
      select: { id: true, role: true },
    });
    if (!user) { await reply.code(403).send({ error: 'ADMIN_REQUIRED' }); return null; }
    return user;
  } catch { await reply.code(401).send({ error: 'UNAUTHORIZED' }); return null; }
}

const selectUser = {
  id: true, phone: true, email: true, firstName: true, lastName: true, preferredLanguage: true,
  role: true, isPhoneVerified: true, isActive: true, lastLoginAt: true, createdAt: true, deletedAt: true,
  _count: { select: { matrimonyProfiles: true, communityPosts: true, committees: true, reports: true } },
} as const;

export async function adminUserRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return;
    const parsed = listQuerySchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    const { search, status, page, limit } = parsed.data;
    const where: any = { deletedAt: null };
    if (status === 'ACTIVE') where.isActive = true;
    if (status === 'BLOCKED') where.isActive = false;
    if (search) where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } }, { lastName: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } }, { email: { contains: search, mode: 'insensitive' } },
    ];
    const [items, total] = await Promise.all([
      prisma.user.findMany({ where, select: selectUser, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.user.count({ where }),
    ]);
    return reply.send({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  });

  app.get('/:id', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return;
    const { id } = request.params as { id: string };
    const user = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: selectUser });
    if (!user) return reply.code(404).send({ error: 'USER_NOT_FOUND' });
    return reply.send({ user });
  });

  app.post('/:id/block', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return;
    const { id } = request.params as { id: string };
    if (id === admin.id) return reply.code(409).send({ error: 'CANNOT_BLOCK_SELF' });
    const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true, role: true, isActive: true } });
    if (!target) return reply.code(404).send({ error: 'USER_NOT_FOUND' });
    if (target.role !== 'MEMBER') return reply.code(403).send({ error: 'ADMIN_ACCOUNT_PROTECTED' });
    const user = await prisma.$transaction(async tx => {
      const updated = await tx.user.update({ where: { id }, data: { isActive: false }, select: selectUser });
      await tx.auditLog.create({ data: { actorUserId: admin.id, action: 'USER_BLOCKED', entityType: 'User', entityId: id } });
      return updated;
    });
    return reply.send({ user });
  });

  app.post('/:id/unblock', async (request, reply) => {
    const admin = await requireAdmin(request, reply); if (!admin) return;
    const { id } = request.params as { id: string };
    const target = await prisma.user.findFirst({ where: { id, deletedAt: null }, select: { id: true, role: true } });
    if (!target) return reply.code(404).send({ error: 'USER_NOT_FOUND' });
    if (target.role !== 'MEMBER') return reply.code(403).send({ error: 'ADMIN_ACCOUNT_PROTECTED' });
    const user = await prisma.$transaction(async tx => {
      const updated = await tx.user.update({ where: { id }, data: { isActive: true }, select: selectUser });
      await tx.auditLog.create({ data: { actorUserId: admin.id, action: 'USER_UNBLOCKED', entityType: 'User', entityId: id } });
      return updated;
    });
    return reply.send({ user });
  });
}
