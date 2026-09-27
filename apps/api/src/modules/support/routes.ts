import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const categorySchema = z.enum(['FEEDBACK', 'COMPLAINT', 'CONTACT']);
const statusSchema = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED']);
export const supportSubmissionSchema = z.object({
  category: categorySchema,
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(4000),
}).strict();
const listSchema = z.object({
  category: categorySchema.optional(), status: statusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

async function activeUser(request: FastifyRequest, reply: FastifyReply, admin = false) {
  let id: string;
  try { const payload = await request.jwtVerify<{ sub: string }>(); id = payload.sub; }
  catch { await reply.code(401).send({ error: 'UNAUTHORIZED' }); return null; }
  const user = await prisma.user.findFirst({
    where: { id, isActive: true, deletedAt: null }, select: { id: true, role: true },
  });
  if (!user) { await reply.code(401).send({ error: 'UNAUTHORIZED' }); return null; }
  if (admin && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    await reply.code(403).send({ error: 'ADMIN_REQUIRED' }); return null;
  }
  return user;
}

export async function supportRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const user = await activeUser(request, reply);
    if (!user) return;
    const parsed = supportSubmissionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors });
    const ticket = await prisma.supportTicket.create({
      data: { ...parsed.data, userId: user.id }, select: { id: true, status: true, createdAt: true },
    });
    return reply.code(201).send({ ticket });
  });
}

export async function adminSupportRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    if (!await activeUser(request, reply, true)) return;
    const parsed = listSchema.safeParse(request.query);
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR' });
    const { category, status, page, limit } = parsed.data;
    const where = { ...(category ? { category } : {}), ...(status ? { status } : {}) };
    const [items, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * limit, take: limit,
        include: { user: { select: { id: true, firstName: true, lastName: true, phone: true, email: true, deletedAt: true } } },
      }),
      prisma.supportTicket.count({ where }),
    ]);
    return { items: items.map((item) => ({ ...item, user: item.user?.deletedAt ? null : item.user })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });

  app.patch('/:id', async (request, reply) => {
    const admin = await activeUser(request, reply, true);
    if (!admin) return;
    const params = z.object({ id: z.string().min(1).max(100) }).safeParse(request.params);
    const body = z.object({ status: statusSchema, adminNote: z.string().trim().max(4000).default('') }).strict().safeParse(request.body);
    if (!params.success || !body.success) return reply.code(400).send({ error: 'VALIDATION_ERROR' });
    const existing = await prisma.supportTicket.findUnique({ where: { id: params.data.id }, select: { id: true } });
    if (!existing) return reply.code(404).send({ error: 'TICKET_NOT_FOUND' });
    const ticket = await prisma.$transaction(async (tx) => {
      const updated = await tx.supportTicket.update({ where: { id: existing.id }, data: body.data });
      await tx.auditLog.create({ data: { actorUserId: admin.id, action: 'SUPPORT_TICKET_UPDATED', entityType: 'SupportTicket', entityId: existing.id, metadata: { status: body.data.status } } });
      return updated;
    });
    return { ticket };
  });
}
