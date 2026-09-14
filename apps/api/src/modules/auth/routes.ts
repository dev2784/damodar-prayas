import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Use a valid phone number with country code'),
});

const verifySchema = phoneSchema.extend({
  otp: z.string().regex(/^\d{4,6}$/, 'OTP must contain 4 to 6 digits'),
});

const devLoginSchema = phoneSchema.extend({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER'),
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

  app.post('/dev-login', async (request, reply) => {
    if (env.NODE_ENV === 'production') {
      return reply.code(404).send({ error: 'NOT_FOUND' });
    }

    const parsed = devLoginSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_DEV_LOGIN',
        message: parsed.error.issues[0]?.message ?? 'Invalid development login request',
      });
    }

    const { phone, firstName, lastName, role } = parsed.data;

    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        ...(firstName !== undefined ? { firstName } : {}),
        ...(lastName !== undefined ? { lastName } : {}),
        role,
        isPhoneVerified: true,
        isActive: true,
        deletedAt: null,
        lastLoginAt: new Date(),
      },
      create: {
        phone,
        firstName,
        lastName,
        role,
        isPhoneVerified: true,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        preferredLanguage: true,
        role: true,
        isPhoneVerified: true,
      },
    });

    const accessToken = await reply.jwtSign(
      {
        sub: user.id,
        role: user.role,
      },
      { expiresIn: '7d' },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: '7d',
      user,
    };
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
