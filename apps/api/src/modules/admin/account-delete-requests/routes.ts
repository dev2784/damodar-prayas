import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../../lib/prisma.js';

const reviewSchema = z.object({ adminNote: z.string().trim().max(500).optional() });

async function adminUser(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true, deletedAt: null },
      select: { id: true },
    });
    if (!user) { await reply.code(403).send({ error: 'ADMIN_REQUIRED' }); return null; }
    return user;
  } catch {
    await reply.code(401).send({ error: 'UNAUTHORIZED' }); return null;
  }
}

export async function adminAccountDeleteRequestRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    if (!await adminUser(request, reply)) return;
    const items = await prisma.accountDeleteRequest.findMany({
      include: { requestedBy: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, isActive: true } } },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return reply.send({ items });
  });

  app.post('/:id/reject', async (request, reply) => {
    const admin = await adminUser(request, reply); if (!admin) return;
    const { id } = request.params as { id: string };
    const parsed = reviewSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR' });
    const existing = await prisma.accountDeleteRequest.findUnique({ where: { id } });
    if (!existing) return reply.code(404).send({ error: 'REQUEST_NOT_FOUND' });
    if (existing.status !== 'PENDING') return reply.code(409).send({ error: 'REQUEST_ALREADY_REVIEWED' });
    const item = await prisma.$transaction(async tx => {
      const updated = await tx.accountDeleteRequest.update({ where: { id }, data: { status: 'REJECTED', adminNote: parsed.data.adminNote || null, reviewedAt: new Date() } });
      await tx.auditLog.create({ data: { actorUserId: admin.id, action: 'ACCOUNT_DELETE_REQUEST_REJECTED', entityType: 'AccountDeleteRequest', entityId: id } });
      return updated;
    });
    return reply.send({ request: item });
  });

  app.post('/:id/approve', async (request, reply) => {
    const admin = await adminUser(request, reply); if (!admin) return;
    const { id } = request.params as { id: string };
    const parsed = reviewSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR' });
    const existing = await prisma.accountDeleteRequest.findUnique({ where: { id }, include: { requestedBy: { select: { id: true, role: true } } } });
    if (!existing) return reply.code(404).send({ error: 'REQUEST_NOT_FOUND' });
    if (existing.status !== 'PENDING') return reply.code(409).send({ error: 'REQUEST_ALREADY_REVIEWED' });
    if (existing.requestedBy.role !== 'MEMBER') return reply.code(403).send({ error: 'ADMIN_ACCOUNT_PROTECTED' });

    const now = new Date();
    const tombstonePhone = `deleted-${existing.requestedById}-${now.getTime()}`;
    await prisma.$transaction(async tx => {
      await tx.pushToken.updateMany({ where: { userId: existing.requestedById }, data: { isActive: false } });
      await tx.matrimonyProfile.updateMany({ where: { createdById: existing.requestedById, deletedAt: null }, data: { deletedAt: now, status: 'SUSPENDED' } });
      await tx.communityPost.updateMany({ where: { createdById: existing.requestedById }, data: { createdById: null } });
      await tx.committee.updateMany({ where: { createdById: existing.requestedById }, data: { createdById: null } });
      await tx.$executeRaw`DELETE FROM "UserCredential" WHERE "userId" = ${existing.requestedById}`;
      await tx.user.update({
        where: { id: existing.requestedById },
        data: { phone: tombstonePhone, email: null, firstName: null, lastName: null, isActive: false, deletedAt: now },
      });
      await tx.accountDeleteRequest.update({ where: { id }, data: { status: 'APPROVED', adminNote: parsed.data.adminNote || null, reviewedAt: now } });
      await tx.auditLog.create({ data: { actorUserId: admin.id, action: 'ACCOUNT_DELETION_APPROVED', entityType: 'User', entityId: existing.requestedById } });
    });
    return reply.send({ success: true });
  });
}
