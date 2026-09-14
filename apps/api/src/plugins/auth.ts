import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import { env } from '../config/env.js';

export async function authPlugin(app: FastifyInstance) {
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });
}
