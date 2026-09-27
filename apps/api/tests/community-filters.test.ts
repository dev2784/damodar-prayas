import assert from 'node:assert/strict';
import test from 'node:test';
import Fastify from 'fastify';
import { prisma } from '../src/lib/prisma.js';
import { communityRoutes } from '../src/modules/community/routes.js';
import { postDateForSubmission } from '../src/modules/community/filters.js';
import { communityPostListQuerySchema, submitCommunityPostSchema } from '../src/modules/community/schemas.js';
import { mpCities } from '../src/modules/community/mp-cities.js';

const base = { category: 'NEWS', translations: [{ language: 'HI', title: 'समाचार', details: 'विवरण' }] };
test('calendar dates reject impossible days and accept leap dates', () => {
  for (const date of ['2026-02-30', '2026-02-29', '2026-13-01', 'yesterday']) {
    assert.equal(communityPostListQuerySchema.safeParse({ date }).success, false);
    assert.equal(submitCommunityPostSchema.safeParse({ ...base, postDate: date }).success, false);
  }
  assert.equal(communityPostListQuerySchema.safeParse({ date: '2028-02-29' }).success, true);
});
test('city and state validation accepts directory IDs, rejects arbitrary locations', () => {
  assert.equal(mpCities.length, 420);
  assert.equal(new Set(mpCities.map((c) => c.id)).size, 420);
  assert.ok(mpCities.every((c) => c.name && c.district));
  assert.equal(submitCommunityPostSchema.safeParse({ ...base, cityId: '250901', state: 'Madhya Pradesh' }).success, true);
  assert.equal(submitCommunityPostSchema.safeParse({ ...base, cityId: 'fake' }).success, false);
  assert.equal(submitCommunityPostSchema.safeParse({ ...base, state: 'Gujarat' }).success, false);
  assert.equal(submitCommunityPostSchema.safeParse(base).success, true, 'old clients stay compatible');
});
test('selected day is preserved; old posts derive day in India with event/death semantics', () => {
  assert.equal(postDateForSubmission({ category: 'NEWS' }, new Date('2026-09-25T20:00Z')).toISOString(), '2026-09-26T00:00:00.000Z');
  assert.equal(postDateForSubmission({ category: 'EVENT', eventDate: new Date('2026-10-05T06:30Z') }).toISOString(), '2026-10-05T00:00:00.000Z');
  assert.equal(postDateForSubmission({ category: 'OBITUARY', deathDate: new Date('2026-09-20T06:30Z') }).toISOString(), '2026-09-20T00:00:00.000Z');
  assert.equal(postDateForSubmission({ category: 'NEWS', postDate: new Date('2026-01-01T00:00Z') }).toISOString(), '2026-01-01T00:00:00.000Z');
});
test('HTTP feed validates filters, retains visibility, counts matching rows, paginates and falls back to available translation', async () => {
  const app = Fastify();
  const queries: any[] = [];
  const counts: any[] = [];
  const findMany = prisma.communityPost.findMany;
  const count = prisma.communityPost.count;
  prisma.communityPost.findMany = (async (args: any) => { queries.push(args); return [{ id: 'one', translations: [{ language: 'HI', title: 'नमस्ते', details: 'विवरण' }] }]; }) as any;
  prisma.communityPost.count = (async (args: any) => { counts.push(args); return 61; }) as any;
  try {
    await app.register(communityRoutes, { prefix: '/posts' });
    const defaults = await app.inject('/posts?category=NEWS&language=EN');
    assert.equal(defaults.statusCode, 200);
    assert.equal(defaults.json().items[0].translations[0].title, 'नमस्ते');
    assert.equal(queries[0].where.cityId, undefined);
    assert.deepEqual(queries[0].orderBy, [{ createdAt: 'desc' }, { id: 'desc' }]);
    assert.equal(queries[0].where.status, 'PUBLISHED');
    assert.equal(queries[0].where.deletedAt, null);
    assert.equal(queries[0].where.AND[0].OR[0].expiresAt, null);
    for (const category of ['NEWS', 'EVENT', 'OBITUARY', 'ADVERTISEMENT']) {
      const response = await app.inject(`/posts?category=${category}&cityId=250901&date=2026-09-26&page=2&limit=30`);
      assert.equal(response.statusCode, 200);
      const query = queries.at(-1);
      assert.equal(query.where.category, category);
      assert.equal(query.where.cityId, '250901');
      assert.equal(query.where.AND[1].OR[0].postDate.toISOString(), '2026-09-26T00:00:00.000Z');
      assert.equal(query.where.AND[1].OR[1].createdAt.gte.toISOString(), '2026-09-25T18:30:00.000Z');
      assert.equal(query.where.AND[1].OR[1].createdAt.lt.toISOString(), '2026-09-26T18:30:00.000Z');
      assert.deepEqual(counts.at(-1).where, query.where);
      assert.equal(query.skip, 30);
      assert.deepEqual(response.json().pagination, { page: 2, limit: 30, total: 61, totalPages: 3 });
    }
    assert.equal((await app.inject('/posts?cityId=bad')).statusCode, 400);
    assert.equal((await app.inject('/posts?date=2026-02-30')).statusCode, 400);
    assert.equal((await app.inject('/posts/locations')).json().cities.length, 420);
  } finally {
    prisma.communityPost.findMany = findMany;
    prisma.communityPost.count = count;
    await app.close();
    await prisma.$disconnect();
  }
});
test('submission saves selected city/date and keeps moderation pending', async () => {
  const app = Fastify();
  app.decorateRequest('jwtVerify', async function(this: any) { this.user = { sub: 'test-user' }; });
  const findUser = prisma.user.findFirst;
  const createPost = prisma.communityPost.create;
  let saved: any;
  prisma.user.findFirst = (async () => ({ id: 'test-user' })) as any;
  prisma.communityPost.create = (async (args: any) => { saved = args.data; return { id: 'new-post', ...args.data }; }) as any;
  try {
    await app.register(communityRoutes, { prefix: '/posts' });
    const response = await app.inject({ method: 'POST', url: '/posts/submit', payload: { ...base, state: 'Madhya Pradesh', cityId: '250901', postDate: '2026-09-20' } });
    assert.equal(response.statusCode, 201);
    assert.equal(saved.cityId, '250901');
    assert.equal(saved.state, 'Madhya Pradesh');
    assert.equal(saved.postDate.toISOString(), '2026-09-20T00:00:00.000Z');
    assert.equal(saved.status, 'PENDING');
    assert.equal(saved.createdById, 'test-user');
    assert.equal((await app.inject({ method: 'POST', url: '/posts/submit', payload: { ...base, cityId: 'invalid' } })).statusCode, 400);
  } finally {
    prisma.user.findFirst = findUser;
    prisma.communityPost.create = createPost;
    await app.close();
    await prisma.$disconnect();
  }
});
