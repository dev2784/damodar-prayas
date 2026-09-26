import type { Prisma } from '../../../generated/prisma/index.js';

export const newestFirst: Prisma.CommunityPostOrderByWithRelationInput[] = [
  { createdAt: 'desc' }, { id: 'desc' },
];

export function postDateForSubmission(data: {
  postDate?: Date | null; category: string; eventDate?: Date | null; deathDate?: Date | null;
}, now = new Date()) {
  if (data.postDate) return data.postDate;
  const date = data.category === 'EVENT' ? data.eventDate : data.category === 'OBITUARY' ? data.eventDate ?? data.deathDate : null;
  const indiaDay = new Date((date ?? now).getTime() + 330 * 60000).toISOString().slice(0, 10);
  return new Date(`${indiaDay}T00:00:00.000Z`);
}

export function communityWhere(query: { category?: Prisma.CommunityPostWhereInput['category']; cityId?: string; date?: string }, now = new Date()): Prisma.CommunityPostWhereInput {
  const day = query.date ? new Date(`${query.date}T00:00:00.000Z`) : undefined;
  // Older admin clients can still create rows without postDate after the migration.
  const start = day ? new Date(day.getTime() - 330 * 60000) : undefined;
  return {
    status: 'PUBLISHED', deletedAt: null,
    ...(query.category ? { category: query.category } : {}),
    ...(query.cityId ? { cityId: query.cityId } : {}),
    AND: [
      { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ...(day && start ? [{ OR: [
        { postDate: day },
        { postDate: null, createdAt: { gte: start, lt: new Date(start.getTime() + 86400000) } },
      ] }] : []),
    ],
  };
}
