import cors from '@fastify/cors';
import Fastify, { type FastifyError } from 'fastify';
import { corsOrigins } from './config/env.js';
import { adminCommunityRoutes } from './modules/admin/community/routes.js';
import { adminCommitteeRoutes } from './modules/admin/committees/routes.js';
import { adminMatrimonyRoutes } from './modules/admin/matrimony/routes.js';
import { authRoutes } from './modules/auth/routes.js';
import { committeeRoutes } from './modules/committees/routes.js';
import { communityRoutes } from './modules/community/routes.js';
import { healthRoutes } from './modules/health/routes.js';
import { interactionRoutes } from './modules/interactions/routes.js';
import { matrimonyRoutes } from './modules/matrimony/routes.js';
import { notificationRoutes } from './modules/notifications/routes.js';
import { authPlugin } from './plugins/auth.js';

export async function buildApp() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, {
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true,
  });

  await app.register(authPlugin);
  await app.register(healthRoutes, { prefix: '/api/v1' });
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(matrimonyRoutes, { prefix: '/api/v1/matrimony' });
  await app.register(interactionRoutes, { prefix: '/api/v1' });
  await app.register(communityRoutes, { prefix: '/api/v1/posts' });
  await app.register(committeeRoutes, { prefix: '/api/v1/committees' });
  await app.register(notificationRoutes, { prefix: '/api/v1/notifications' });
  await app.register(adminMatrimonyRoutes, { prefix: '/api/v1/admin/matrimony' });
  await app.register(adminCommunityRoutes, { prefix: '/api/v1/admin/posts' });
  await app.register(adminCommitteeRoutes, { prefix: '/api/v1/admin/committees' });

  app.get('/', async () => ({
    name: 'Damodar Prayas API',
    version: 'v1',
    primaryLanguage: 'hi',
    supportedLanguages: ['hi', 'en'],
  }));

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    return reply.code(statusCode).send({
      error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : error.name,
      message: statusCode === 500 ? 'Something went wrong.' : error.message,
    });
  });

  return app;
}
