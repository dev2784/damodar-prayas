import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: true,
  credentials: true,
});

app.get('/health', async () => ({
  ok: true,
  service: 'damodar-prayas-api',
  timestamp: new Date().toISOString(),
}));

const port = Number(process.env.PORT ?? 4000);
const host = '0.0.0.0';

try {
  await app.listen({ port, host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
