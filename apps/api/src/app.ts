import cors from '@fastify/cors';
import Fastify from 'fastify';
import { corsOrigins } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { healthRoutes } from './modules/health/routes.js';
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

  app.get('/', async () => ({
    name: 'Damodar Prayas API',
    version: 'v1',
    primaryLanguage: 'hi',
    supportedLanguages: ['hi', 'en'],
  }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;

    return reply.code(statusCode).send({
      error: statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : error.name,
      message: statusCode === 500 ? 'Something went wrong.' : error.message,
    });
  });

  return app;
}
