import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    ok: true,
    service: 'damodar-prayas-api',
    timestamp: new Date().toISOString(),
  }));

  app.get('/ready', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        ok: true,
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      app.log.error(error, 'Database readiness check failed');
      return reply.code(503).send({
        ok: false,
        database: 'unavailable',
      });
    }
  });
}
