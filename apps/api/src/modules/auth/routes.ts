import { promisify } from 'node:util';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';

const scryptAsync = promisify(scrypt);

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Use a valid phone number with country code'),
});

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long').refine((value) => /[A-Za-z]/.test(value) && /\d/.test(value), { message: 'Password must contain at least one letter and one number' });
const registerSchema = phoneSchema.extend({ firstName: z.string().trim().min(1).max(80), lastName: z.string().trim().min(1).max(80), email: z.string().trim().email().max(320).optional().nullable(), password: passwordSchema });
const loginSchema = phoneSchema.extend({ password: z.string().min(1).max(128) });
const verifySchema = phoneSchema.extend({ otp: z.string().regex(/^\d{4,6}$/, 'OTP must contain 4 to 6 digits') });
const devLoginSchema = phoneSchema.extend({ firstName: z.string().trim().min(1).max(80).optional(), lastName: z.string().trim().min(1).max(80).optional(), role: z.enum(['MEMBER', 'ADMIN']).default('MEMBER') });
const adminSetupSchema = phoneSchema.extend({ setupSecret: z.string().min(1), password: passwordSchema });

type CredentialRow = { passwordHash: string };
function normalizePhone(phone: string) { return phone.trim(); }
async function hashPassword(password: string) { const salt = randomBytes(16).toString('hex'); const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer; return `scrypt$${salt}$${derivedKey.toString('hex')}`; }
async function verifyPassword(password: string, stored: string) { const [algorithm, salt, hashHex] = stored.split('$'); if (algorithm !== 'scrypt' || !salt || !hashHex) return false; const storedBuffer = Buffer.from(hashHex, 'hex'); if (!storedBuffer.length) return false; const derivedKey = (await scryptAsync(password, salt, storedBuffer.length)) as Buffer; if (derivedKey.length !== storedBuffer.length) return false; return timingSafeEqual(derivedKey, storedBuffer); }
async function getCredential(userId: string) { const rows = await prisma.$queryRaw<CredentialRow[]>`SELECT "passwordHash" FROM "UserCredential" WHERE "userId" = ${userId} LIMIT 1`; return rows[0] ?? null; }
function userSelect() { return { id: true, phone: true, email: true, firstName: true, lastName: true, preferredLanguage: true, role: true, isPhoneVerified: true } as const; }

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_REGISTRATION', message: parsed.error.issues[0]?.message ?? 'Invalid registration details', fields: parsed.error.flatten().fieldErrors });
    const phone = normalizePhone(parsed.data.phone); const passwordHash = await hashPassword(parsed.data.password);
    const existing = await prisma.user.findUnique({ where: { phone }, select: { id: true, deletedAt: true } });
    if (existing) { const credential = await getCredential(existing.id); if (credential) return reply.code(409).send({ error: 'ACCOUNT_EXISTS', message: 'An account already exists for this mobile number.' }); if (existing.deletedAt) return reply.code(409).send({ error: 'ACCOUNT_UNAVAILABLE', message: 'This account is not available for registration.' }); }
    const user = await prisma.$transaction(async (tx) => {
      const account = existing ? await tx.user.update({ where: { id: existing.id }, data: { firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email ?? null, isActive: true, lastLoginAt: new Date() }, select: userSelect() }) : await tx.user.create({ data: { phone, firstName: parsed.data.firstName, lastName: parsed.data.lastName, email: parsed.data.email ?? null, role: 'MEMBER', isPhoneVerified: false, isActive: true, lastLoginAt: new Date() }, select: userSelect() });
      await tx.$executeRaw`INSERT INTO "UserCredential" ("userId", "passwordHash", "updatedAt") VALUES (${account.id}, ${passwordHash}, CURRENT_TIMESTAMP)`; return account;
    });
    const accessToken = await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '7d' }); return reply.code(201).send({ accessToken, tokenType: 'Bearer', expiresIn: '7d', user });
  });

  app.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: 'INVALID_LOGIN', message: parsed.error.issues[0]?.message ?? 'Invalid login request' });
    const phone = normalizePhone(parsed.data.phone); const user = await prisma.user.findFirst({ where: { phone, isActive: true, deletedAt: null }, select: userSelect() });
    if (!user) return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Mobile number or password is incorrect.' });
    const credential = await getCredential(user.id); const valid = credential ? await verifyPassword(parsed.data.password, credential.passwordHash) : false;
    if (!valid) return reply.code(401).send({ error: 'INVALID_CREDENTIALS', message: 'Mobile number or password is incorrect.' });
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }); const accessToken = await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '7d' }); return { accessToken, tokenType: 'Bearer', expiresIn: '7d', user };
  });

  app.post('/admin/setup-password', async (request, reply) => {
    const parsed = adminSetupSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: 'INVALID_ADMIN_SETUP', message: parsed.error.issues[0]?.message ?? 'Invalid setup request' });
    if (!env.ADMIN_SETUP_SECRET || parsed.data.setupSecret !== env.ADMIN_SETUP_SECRET) return reply.code(403).send({ error: 'ADMIN_SETUP_FORBIDDEN', message: 'The setup code is invalid or admin setup is disabled.' });
    const user = await prisma.user.findFirst({ where: { phone: normalizePhone(parsed.data.phone), role: 'ADMIN', isActive: true, deletedAt: null }, select: userSelect() });
    if (!user) return reply.code(404).send({ error: 'ADMIN_NOT_FOUND', message: 'No active admin account was found for this mobile number.' });
    if (await getCredential(user.id)) return reply.code(409).send({ error: 'PASSWORD_ALREADY_SET', message: 'This admin already has a password. Sign in normally.' });
    const passwordHash = await hashPassword(parsed.data.password);
    await prisma.$executeRaw`INSERT INTO "UserCredential" ("userId", "passwordHash", "updatedAt") VALUES (${user.id}, ${passwordHash}, CURRENT_TIMESTAMP)`;
    return { success: true, message: 'Admin password created. Remove ADMIN_SETUP_SECRET from the server environment now.' };
  });

  app.post('/request-otp', async (request, reply) => { const parsed = phoneSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: 'INVALID_PHONE', message: parsed.error.issues[0]?.message ?? 'Invalid phone number' }); return reply.code(501).send({ error: 'OTP_PROVIDER_NOT_CONFIGURED', message: 'OTP provider will be connected later as an additional sign-in method.' }); });
  app.post('/verify-otp', async (request, reply) => { const parsed = verifySchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: 'INVALID_OTP_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid OTP request' }); return reply.code(501).send({ error: 'OTP_PROVIDER_NOT_CONFIGURED', message: 'OTP verification is not enabled yet.' }); });
  app.post('/dev-login', async (request, reply) => { if (env.NODE_ENV === 'production') return reply.code(404).send({ error: 'NOT_FOUND' }); const parsed = devLoginSchema.safeParse(request.body); if (!parsed.success) return reply.code(400).send({ error: 'INVALID_DEV_LOGIN', message: parsed.error.issues[0]?.message ?? 'Invalid development login request' }); const { phone, firstName, lastName, role } = parsed.data; const user = await prisma.user.upsert({ where: { phone }, update: { ...(firstName !== undefined ? { firstName } : {}), ...(lastName !== undefined ? { lastName } : {}), role, isPhoneVerified: true, isActive: true, deletedAt: null, lastLoginAt: new Date() }, create: { phone, firstName, lastName, role, isPhoneVerified: true, lastLoginAt: new Date() }, select: userSelect() }); const accessToken = await reply.jwtSign({ sub: user.id, role: user.role }, { expiresIn: '7d' }); return { accessToken, tokenType: 'Bearer', expiresIn: '7d', user }; });
  app.get('/me', async (request, reply) => { try { const payload = await request.jwtVerify<{ sub: string }>(); const user = await prisma.user.findFirst({ where: { id: payload.sub, isActive: true, deletedAt: null }, select: { ...userSelect(), createdAt: true } }); if (!user) return reply.code(404).send({ error: 'USER_NOT_FOUND' }); return { user }; } catch { return reply.code(401).send({ error: 'UNAUTHORIZED', message: 'A valid access token is required.' }); } });
}
