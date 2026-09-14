import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Use a valid phone number with country code'),
});

const verifySchema = phoneSchema.extend({
  otp: z.string().regex(/^\d{4,6}$/, 'OTP must contain 4 to 6 digits'),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/request-otp', async (request, reply) => {
    const parsed = phoneSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_PHONE',
        message: parsed.error.issues[0]?.message ?? 'Invalid phone number',
      });
    }

    return reply.code(501).send({
      error: 'OTP_PROVIDER_NOT_CONFIGURED',
      message: 'OTP provider will be connected before authentication is enabled.',
    });
  });

  app.post('/verify-otp', async (request, reply) => {
    const parsed = verifySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_OTP_REQUEST',
        message: parsed.error.issues[0]?.message ?? 'Invalid OTP request',
      });
    }

    return reply.code(501).send({
      error: 'OTP_PROVIDER_NOT_CONFIGURED',
      message: 'OTP verification is not enabled yet.',
    });
  });

  app.get('/me', async (request, reply) => {
    try {
      const payload = await request.jwtVerify<{ sub: string }>();
      const user = await prisma.user.findFirst({
        where: {
          id: payload.sub,
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          preferredLanguage: true,
          role: true,
          isPhoneVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.code(404).send({ error: 'USER_NOT_FOUND' });
      }

      return { user };
    } catch {
      return reply.code(401).send({
        error: 'UNAUTHORIZED',
        message: 'A valid access token is required.',
      });
    }
  });
}
