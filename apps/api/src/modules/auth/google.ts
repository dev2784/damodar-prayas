import { createPublicKey, verify } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { verifyMsg91Phone } from './msg91.js';

const tokenSchema = z.object({ idToken: z.string().min(100).max(10000) });
const registrationSchema = tokenSchema.extend({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  otpAccessToken: z.string().min(20).max(10000).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});
type GoogleClaims = { iss?: string; aud?: string; sub?: string; exp?: number; email?: string; email_verified?: boolean; given_name?: string; family_name?: string };
type GoogleKey = { kid?: string; kty?: string; alg?: string; use?: string; n?: string; e?: string };
let cachedKeys: { keys: GoogleKey[]; expires: number } | null = null;
async function verifyGoogleToken(token: string): Promise<GoogleClaims | null> {
  if (!env.GOOGLE_WEB_CLIENT_ID) return null;
  const segments = token.split('.');
  if (segments.length !== 3) return null;
  let header: { kid?: string; alg?: string };
  let claims: GoogleClaims;
  try {
    header = JSON.parse(Buffer.from(segments[0], 'base64url').toString());
    claims = JSON.parse(Buffer.from(segments[1], 'base64url').toString());
  } catch { return null; }
  if (header.alg !== 'RS256' || !header.kid || !claims.sub ||
      !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss ?? '') ||
      claims.aud !== env.GOOGLE_WEB_CLIENT_ID ||
      typeof claims.exp !== 'number' || claims.exp <= Math.floor(Date.now() / 1000)) return null;
  try {
    if (!cachedKeys || cachedKeys.expires <= Date.now()) {
      const response = await fetch('https://www.googleapis.com/oauth2/v3/certs', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return null;
      const payload = await response.json() as { keys: GoogleKey[] };
      const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\\d+)/)?.[1] ?? 300);
      cachedKeys = { keys: payload.keys, expires: Date.now() + Math.min(maxAge, 3600) * 1000 };
    }
    const key = cachedKeys.keys.find((item) => item.kid === header.kid && item.kty === 'RSA' && item.use === 'sig');
    if (!key) return null;
    const publicKey = createPublicKey({ key: key as import('node:crypto').JsonWebKey, format: 'jwk' });
    const valid = verify('RSA-SHA256', Buffer.from(segments[0] + '.' + segments[1]), publicKey, Buffer.from(segments[2], 'base64url'));
    return valid ? claims : null;
  } catch { return null; }
}
const publicUser = { id: true, phone: true, email: true, firstName: true, lastName: true, preferredLanguage: true, role: true, isPhoneVerified: true } as const;
export async function googleAuthRoutes(app: FastifyInstance) {
  app.post('/google', async (request, reply) => {
    const input = tokenSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: 'INVALID_REQUEST' });
    if (!env.GOOGLE_WEB_CLIENT_ID) return reply.code(503).send({ error: 'GOOGLE_LOGIN_NOT_CONFIGURED' });
    const claims = await verifyGoogleToken(input.data.idToken);
    if (!claims?.sub) return reply.code(401).send({ error: 'INVALID_GOOGLE_TOKEN' });
    const user = await prisma.user.findFirst({ where: { googleSub: claims.sub, isActive: true, deletedAt: null }, select: publicUser });
    if (!user) return reply.code(409).send({ error: 'GOOGLE_REGISTRATION_REQUIRED', message: 'Complete registration with a mobile number to use Google sign-in.', profile: { firstName: claims.given_name ?? '', lastName: claims.family_name ?? '' } });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return { accessToken: await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '7d' }), tokenType: 'Bearer', expiresIn: '7d', user };
  });
  app.post('/google/register', async (request, reply) => {
    const input = registrationSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: 'INVALID_REQUEST', fields: input.error.flatten().fieldErrors });
    const claims = await verifyGoogleToken(input.data.idToken);
    if (!claims?.sub) return reply.code(401).send({ error: 'INVALID_GOOGLE_TOKEN' });
    const phone = input.data.phone;
    if (env.OTP_PROVIDER === 'msg91' && (!input.data.otpAccessToken || !await verifyMsg91Phone(input.data.otpAccessToken, phone))) return reply.code(401).send({ error: 'PHONE_VERIFICATION_REQUIRED', message: 'Verify the mobile OTP before registration.' });
    try {
      const user = await prisma.user.create({ data: { phone, firstName: input.data.firstName, lastName: input.data.lastName, googleSub: claims.sub, email: claims.email_verified && claims.email ? claims.email : null, role: 'MEMBER', isPhoneVerified: env.OTP_PROVIDER === 'msg91', lastLoginAt: new Date() }, select: publicUser });
      return reply.code(201).send({ accessToken: await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '7d' }), tokenType: 'Bearer', expiresIn: '7d', user });
    } catch (error) {
      request.log.info({ error }, 'Google registration conflict');
      return reply.code(409).send({ error: 'ACCOUNT_CONFLICT', message: 'An account already exists for this phone, Google identity or email. Sign in to your existing account and link Google securely.' });
    }
  });
  app.post('/google/link', async (request, reply) => {
    const input = tokenSchema.safeParse(request.body);
    if (!input.success) return reply.code(400).send({ error: 'INVALID_REQUEST' });
    let subject: string;
    try { subject = (await request.jwtVerify<{ sub: string }>()).sub; } catch { return reply.code(401).send({ error: 'UNAUTHORIZED' }); }
    const claims = await verifyGoogleToken(input.data.idToken);
    if (!claims?.sub) return reply.code(401).send({ error: 'INVALID_GOOGLE_TOKEN' });
    const user = await prisma.user.findFirst({ where: { id: subject, isActive: true, deletedAt: null }, select: { id: true, googleSub: true, email: true } });
    if (!user) return reply.code(401).send({ error: 'UNAUTHORIZED' });
    if (user.googleSub && user.googleSub !== claims.sub) return reply.code(409).send({ error: 'GOOGLE_ALREADY_LINKED' });
    try {
      await prisma.user.update({ where: { id: subject }, data: { googleSub: claims.sub } });
      return { success: true };
    } catch { return reply.code(409).send({ error: 'GOOGLE_ACCOUNT_ALREADY_IN_USE' }); }
  });
}
