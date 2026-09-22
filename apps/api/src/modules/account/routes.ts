import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const requestSchema = z.object({ reason: z.string().trim().max(500).optional() });

async function activeUserId(request: FastifyRequest, reply: FastifyReply) {
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

export async function accountRoutes(app: FastifyInstance) {
  app.get('/delete-request', async (request, reply) => {
    const userId = await activeUserId(request, reply);
    if (!userId) return;
    const item = await prisma.accountDeleteRequest.findFirst({
      where: { requestedById: userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, reason: true, status: true, adminNote: true, reviewedAt: true, createdAt: true },
    });
    return reply.send({ request: item });
  });

  app.post('/delete-request', async (request, reply) => {
    const userId = await activeUserId(request, reply);
    if (!userId) return;
    const parsed = requestSchema.safeParse(request.body ?? {});
    if (!parsed.success) return reply.code(400).send({ error: 'VALIDATION_ERROR' });

    const pending = await prisma.accountDeleteRequest.findFirst({
      where: { requestedById: userId, status: 'PENDING' },
      select: { id: true, status: true, createdAt: true },
    });
    if (pending) return reply.code(409).send({ error: 'ACCOUNT_DELETE_REQUEST_ALREADY_PENDING', request: pending });

    const item = await prisma.accountDeleteRequest.create({
      data: { requestedById: userId, reason: parsed.data.reason || null },
      select: { id: true, reason: true, status: true, createdAt: true },
    });
    return reply.code(201).send({ request: item });
  });
}
