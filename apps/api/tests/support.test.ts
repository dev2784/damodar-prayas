import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import { prisma } from '../src/lib/prisma.js';
import { adminSupportRoutes, supportRoutes, supportSubmissionSchema } from '../src/modules/support/routes.js';

const valid = { category: 'COMPLAINT', subject: 'Account problem', message: 'Please help resolve my account issue.' };
test('support validation trims messages and rejects blank/oversized fields and forged identity', () => {
  assert.equal(supportSubmissionSchema.parse({ ...valid, subject: '  Topic  ' }).subject, 'Topic');
  for (const data of [{ ...valid, subject: ' ' }, { ...valid, message: 'short' }, { ...valid, message: 'x'.repeat(4001) }, { ...valid, category: 'BAD' }, { ...valid, userId: 'other-user' }, { ...valid, status: 'RESOLVED' }]) {
    assert.equal(supportSubmissionSchema.safeParse(data).success, false);
  }
});

test('support endpoints enforce login/roles, save server-owned identity, filter inbox and audit changes', async () => {
  const app = Fastify();
  app.decorateRequest('jwtVerify', async function(this: any) {
    const sub = this.headers.authorization;
    if (!sub) throw new Error('missing token');
    return { sub };
  });
  const original = {
    user: prisma.user.findFirst, create: prisma.supportTicket.create,
    list: prisma.supportTicket.findMany, count: prisma.supportTicket.count,
    find: prisma.supportTicket.findUnique, transaction: prisma.$transaction,
  };
  let created: any; let listed: any; let counted: any; let updated: any; let audited: any;
  prisma.user.findFirst = (async ({ where }: any) => {
    assert.equal(where.isActive, true); assert.equal(where.deletedAt, null);
    if (where.id === 'disabled') return null;
    return { id: where.id, role: where.id === 'admin' ? 'ADMIN' : 'MEMBER' };
  }) as any;
  prisma.supportTicket.create = (async ({ data }: any) => { created = data; return { id: 'ticket-1', status: 'OPEN', createdAt: new Date() }; }) as any;
  prisma.supportTicket.findMany = (async (args: any) => { listed = args; return [{ id: 'one', user: { id: 'member', phone: '1234567890', email: 'member@example.com', deletedAt: null } }, { id: 'two', user: { deletedAt: new Date(), phone: 'deleted' } }]; }) as any;
  prisma.supportTicket.count = (async (args: any) => { counted = args; return 21; }) as any;
  prisma.supportTicket.findUnique = (async ({ where }: any) => where.id === 'missing' ? null : { id: where.id }) as any;
  prisma.$transaction = (async (operation: any) => Array.isArray(operation) ? Promise.all(operation) : operation({
    supportTicket: { update: async (args: any) => { updated = args; return { id: args.where.id, ...args.data }; } },
    auditLog: { create: async (args: any) => { audited = args; return {}; } },
  })) as any;
  try {
    await app.register(supportRoutes, { prefix: '/support' });
    await app.register(adminSupportRoutes, { prefix: '/admin/support' });
    assert.equal((await app.inject({ method: 'POST', url: '/support', payload: valid })).statusCode, 401);
    assert.equal((await app.inject({ method: 'POST', url: '/support', headers: { authorization: 'disabled' }, payload: valid })).statusCode, 401);
    const submit = await app.inject({ method: 'POST', url: '/support', headers: { authorization: 'member' }, payload: valid });
    assert.equal(submit.statusCode, 201); assert.equal(created.userId, 'member'); assert.equal(submit.json().ticket.status, 'OPEN');
    assert.equal((await app.inject({ method: 'POST', url: '/support', headers: { authorization: 'member' }, payload: { ...valid, userId: 'forged' } })).statusCode, 400);
    assert.equal((await app.inject('/admin/support')).statusCode, 401);
    assert.equal((await app.inject({ url: '/admin/support', headers: { authorization: 'member' } })).statusCode, 403);
    assert.equal((await app.inject({ method: 'PATCH', url: '/admin/support/one', headers: { authorization: 'member' }, payload: { status: 'RESOLVED' } })).statusCode, 403);
    const inbox = await app.inject({ url: '/admin/support?status=OPEN&category=COMPLAINT&page=2&limit=20', headers: { authorization: 'admin' } });
    assert.equal(inbox.statusCode, 200); assert.equal(inbox.json().items[0].user.email, 'member@example.com'); assert.equal(inbox.json().items[1].user, null);
    assert.deepEqual(listed.where, { status: 'OPEN', category: 'COMPLAINT' }); assert.deepEqual(counted.where, listed.where);
    assert.equal(listed.skip, 20); assert.deepEqual(listed.orderBy, [{ createdAt: 'desc' }, { id: 'desc' }]); assert.equal(inbox.json().pagination.totalPages, 2);
    assert.equal((await app.inject({ url: '/admin/support?limit=1000', headers: { authorization: 'admin' } })).statusCode, 400);
    const change = await app.inject({ method: 'PATCH', url: '/admin/support/one', headers: { authorization: 'admin' }, payload: { status: 'RESOLVED', adminNote: 'Followed up' } });
    assert.equal(change.statusCode, 200); assert.equal(updated.data.status, 'RESOLVED'); assert.equal(audited.data.actorUserId, 'admin');
    assert.equal((await app.inject({ method: 'PATCH', url: '/admin/support/missing', headers: { authorization: 'admin' }, payload: { status: 'OPEN' } })).statusCode, 404);
  } finally {
    prisma.user.findFirst = original.user; prisma.supportTicket.create = original.create;
    prisma.supportTicket.findMany = original.list; prisma.supportTicket.count = original.count;
    prisma.supportTicket.findUnique = original.find; prisma.$transaction = original.transaction;
    await app.close(); await prisma.$disconnect();
  }
});
