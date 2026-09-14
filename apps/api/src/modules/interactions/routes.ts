import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { publicMatrimonyProfileSelect } from '../matrimony/selectors.js';

const sendInterestSchema = z.object({
  senderProfileId: z.string().min(1),
  receiverProfileId: z.string().min(1),
  message: z.string().trim().max(500).optional().nullable(),
});

const respondSchema = z.object({
  action: z.enum(['ACCEPT', 'REJECT']),
});

const sendContactRequestSchema = z.object({
  senderProfileId: z.string().min(1),
  receiverProfileId: z.string().min(1),
});

const accessQuerySchema = z.object({
  ownerProfileId: z.string().min(1),
});

async function getActiveUserId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();
    const user = await prisma.user.findFirst({
      where: { id: payload.sub, isActive: true, deletedAt: null },
      select: { id: true },
    });

    if (!user) {
      await reply.code(401).send({ error: 'UNAUTHORIZED' });
      return null;
    }

    return user.id;
  } catch {
    await reply.code(401).send({ error: 'UNAUTHORIZED' });
    return null;
  }
}

async function getOwnedApprovedProfile(userId: string, profileId: string) {
  return prisma.matrimonyProfile.findFirst({
    where: {
      id: profileId,
      createdById: userId,
      status: 'APPROVED',
      deletedAt: null,
    },
    select: { id: true, createdById: true },
  });
}

async function getApprovedProfile(profileId: string) {
  return prisma.matrimonyProfile.findFirst({
    where: { id: profileId, status: 'APPROVED', deletedAt: null },
    select: { id: true, createdById: true },
  });
}

export async function interactionRoutes(app: FastifyInstance) {
  app.post('/interests', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const parsed = sendInterestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'INVALID_INTEREST_REQUEST',
        message: parsed.error.issues[0]?.message ?? 'Invalid interest request',
      });
    }

    const { senderProfileId, receiverProfileId, message } = parsed.data;
    if (senderProfileId === receiverProfileId) {
      return reply.code(400).send({ error: 'SELF_INTEREST_NOT_ALLOWED' });
    }

    const [senderProfile, receiverProfile] = await Promise.all([
      getOwnedApprovedProfile(userId, senderProfileId),
      getApprovedProfile(receiverProfileId),
    ]);

    if (!senderProfile) {
      return reply.code(403).send({ error: 'SENDER_PROFILE_NOT_ALLOWED' });
    }
    if (!receiverProfile) {
      return reply.code(404).send({ error: 'RECEIVER_PROFILE_NOT_FOUND' });
    }
    if (receiverProfile.createdById === userId) {
      return reply.code(400).send({ error: 'SELF_INTEREST_NOT_ALLOWED' });
    }

    const existing = await prisma.interest.findUnique({
      where: {
        senderProfileId_receiverProfileId: { senderProfileId, receiverProfileId },
      },
    });

    if (existing) {
      return reply.code(409).send({ error: 'INTEREST_ALREADY_EXISTS', interest: existing });
    }

    const interest = await prisma.$transaction(async (tx) => {
      const created = await tx.interest.create({
        data: { senderProfileId, receiverProfileId, message },
      });

      await tx.notification.create({
        data: {
          userId: receiverProfile.createdById,
          type: 'INTEREST_RECEIVED',
          titleHi: 'नया रिश्ता अनुरोध',
          titleEn: 'New interest received',
          bodyHi: 'आपकी वैवाहिक प्रोफ़ाइल पर नया इंटरेस्ट आया है।',
          bodyEn: 'You received a new interest on your matrimony profile.',
          data: { interestId: created.id, senderProfileId },
        },
      });

      return created;
    });

    return reply.code(201).send({ interest });
  });

  app.get('/interests/incoming', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const items = await prisma.interest.findMany({
      where: {
        receiverProfile: { createdById: userId, deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        senderProfile: { select: publicMatrimonyProfileSelect },
      },
    });

    return { items };
  });

  app.get('/interests/outgoing', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const items = await prisma.interest.findMany({
      where: {
        senderProfile: { createdById: userId, deletedAt: null },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        receiverProfile: { select: publicMatrimonyProfileSelect },
      },
    });

    return { items };
  });

  app.post('/interests/:id/respond', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);
    const parsed = respondSchema.safeParse(request.body);
    if (!params.success || !parsed.success) {
      return reply.code(400).send({ error: 'INVALID_INTEREST_RESPONSE' });
    }

    const interest = await prisma.interest.findFirst({
      where: {
        id: params.data.id,
        receiverProfile: { createdById: userId, deletedAt: null },
      },
      include: {
        senderProfile: { select: { createdById: true } },
      },
    });

    if (!interest) {
      return reply.code(404).send({ error: 'INTEREST_NOT_FOUND' });
    }
    if (interest.status !== 'PENDING') {
      return reply.code(409).send({ error: 'INTEREST_ALREADY_RESPONDED', status: interest.status });
    }

    const status = parsed.data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.interest.update({
        where: { id: interest.id },
        data: { status, respondedAt: new Date() },
      });

      await tx.notification.create({
        data: {
          userId: interest.senderProfile.createdById,
          type: status === 'ACCEPTED' ? 'INTEREST_ACCEPTED' : 'INTEREST_REJECTED',
          titleHi: status === 'ACCEPTED' ? 'इंटरेस्ट स्वीकार हुआ' : 'इंटरेस्ट अस्वीकार हुआ',
          titleEn: status === 'ACCEPTED' ? 'Interest accepted' : 'Interest rejected',
          data: { interestId: interest.id },
        },
      });

      return result;
    });

    return { interest: updated };
  });

  app.post('/contact-requests', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const parsed = sendContactRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'INVALID_CONTACT_REQUEST' });
    }

    const { senderProfileId, receiverProfileId } = parsed.data;
    if (senderProfileId === receiverProfileId) {
      return reply.code(400).send({ error: 'SELF_CONTACT_REQUEST_NOT_ALLOWED' });
    }

    const [senderProfile, receiverProfile] = await Promise.all([
      getOwnedApprovedProfile(userId, senderProfileId),
      getApprovedProfile(receiverProfileId),
    ]);

    if (!senderProfile) {
      return reply.code(403).send({ error: 'SENDER_PROFILE_NOT_ALLOWED' });
    }
    if (!receiverProfile) {
      return reply.code(404).send({ error: 'RECEIVER_PROFILE_NOT_FOUND' });
    }
    if (receiverProfile.createdById === userId) {
      return reply.code(400).send({ error: 'SELF_CONTACT_REQUEST_NOT_ALLOWED' });
    }

    const acceptedInterest = await prisma.interest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderProfileId, receiverProfileId },
          { senderProfileId: receiverProfileId, receiverProfileId: senderProfileId },
        ],
      },
      select: { id: true },
    });

    if (!acceptedInterest) {
      return reply.code(403).send({ error: 'ACCEPTED_INTEREST_REQUIRED' });
    }

    const existing = await prisma.contactRequest.findUnique({
      where: {
        senderProfileId_receiverProfileId: { senderProfileId, receiverProfileId },
      },
    });
    if (existing) {
      return reply.code(409).send({ error: 'CONTACT_REQUEST_ALREADY_EXISTS', contactRequest: existing });
    }

    const contactRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.contactRequest.create({
        data: { senderProfileId, receiverProfileId },
      });

      await tx.notification.create({
        data: {
          userId: receiverProfile.createdById,
          type: 'CONTACT_REQUEST',
          titleHi: 'संपर्क विवरण का अनुरोध',
          titleEn: 'Contact details requested',
          bodyHi: 'किसी प्रोफ़ाइल ने आपके संपर्क विवरण के लिए अनुरोध भेजा है।',
          bodyEn: 'A profile requested access to your contact details.',
          data: { contactRequestId: created.id, senderProfileId },
        },
      });

      return created;
    });

    return reply.code(201).send({ contactRequest });
  });

  app.get('/contact-requests/incoming', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const items = await prisma.contactRequest.findMany({
      where: { receiverProfile: { createdById: userId, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: { senderProfile: { select: publicMatrimonyProfileSelect } },
    });

    return { items };
  });

  app.get('/contact-requests/outgoing', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const items = await prisma.contactRequest.findMany({
      where: { senderProfile: { createdById: userId, deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: { receiverProfile: { select: publicMatrimonyProfileSelect } },
    });

    return { items };
  });

  app.post('/contact-requests/:id/respond', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const params = z.object({ id: z.string().min(1) }).safeParse(request.params);
    const parsed = respondSchema.safeParse(request.body);
    if (!params.success || !parsed.success) {
      return reply.code(400).send({ error: 'INVALID_CONTACT_RESPONSE' });
    }

    const contactRequest = await prisma.contactRequest.findFirst({
      where: {
        id: params.data.id,
        receiverProfile: { createdById: userId, deletedAt: null },
      },
      include: { senderProfile: { select: { createdById: true } } },
    });

    if (!contactRequest) {
      return reply.code(404).send({ error: 'CONTACT_REQUEST_NOT_FOUND' });
    }
    if (contactRequest.status !== 'PENDING') {
      return reply.code(409).send({ error: 'CONTACT_REQUEST_ALREADY_RESPONDED', status: contactRequest.status });
    }

    const status = parsed.data.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.contactRequest.update({
        where: { id: contactRequest.id },
        data: { status, respondedAt: new Date() },
      });

      if (status === 'ACCEPTED') {
        await tx.notification.create({
          data: {
            userId: contactRequest.senderProfile.createdById,
            type: 'CONTACT_ACCEPTED',
            titleHi: 'संपर्क अनुरोध स्वीकार हुआ',
            titleEn: 'Contact request accepted',
            data: { contactRequestId: contactRequest.id },
          },
        });
      }

      return result;
    });

    return { contactRequest: updated };
  });

  app.get('/contacts/:profileId', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const params = z.object({ profileId: z.string().min(1) }).safeParse(request.params);
    const query = accessQuerySchema.safeParse(request.query);
    if (!params.success || !query.success) {
      return reply.code(400).send({ error: 'INVALID_CONTACT_ACCESS_REQUEST' });
    }

    const ownerProfile = await getOwnedApprovedProfile(userId, query.data.ownerProfileId);
    if (!ownerProfile) {
      return reply.code(403).send({ error: 'OWNER_PROFILE_NOT_ALLOWED' });
    }

    const targetProfile = await prisma.matrimonyProfile.findFirst({
      where: { id: params.data.profileId, status: 'APPROVED', deletedAt: null },
      select: {
        id: true,
        contactPhone: true,
        contactEmail: true,
      },
    });

    if (!targetProfile) {
      return reply.code(404).send({ error: 'PROFILE_NOT_FOUND' });
    }

    const acceptedContact = await prisma.contactRequest.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { senderProfileId: ownerProfile.id, receiverProfileId: targetProfile.id },
          { senderProfileId: targetProfile.id, receiverProfileId: ownerProfile.id },
        ],
      },
      select: { id: true },
    });

    if (!acceptedContact) {
      return reply.code(403).send({ error: 'CONTACT_ACCESS_NOT_GRANTED' });
    }

    return {
      profileId: targetProfile.id,
      contactPhone: targetProfile.contactPhone,
      contactEmail: targetProfile.contactEmail,
    };
  });

  app.get('/shortlists', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const items = await prisma.shortlist.findMany({
      where: { userId, matrimonyProfile: { status: 'APPROVED', deletedAt: null } },
      orderBy: { createdAt: 'desc' },
      include: { matrimonyProfile: { select: publicMatrimonyProfileSelect } },
    });

    return { items };
  });

  app.post('/shortlists/:profileId', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const params = z.object({ profileId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'INVALID_PROFILE_ID' });
    }

    const profile = await getApprovedProfile(params.data.profileId);
    if (!profile) {
      return reply.code(404).send({ error: 'PROFILE_NOT_FOUND' });
    }
    if (profile.createdById === userId) {
      return reply.code(400).send({ error: 'CANNOT_SHORTLIST_OWN_PROFILE' });
    }

    const shortlist = await prisma.shortlist.upsert({
      where: {
        userId_matrimonyProfileId: { userId, matrimonyProfileId: profile.id },
      },
      update: {},
      create: { userId, matrimonyProfileId: profile.id },
    });

    return reply.code(201).send({ shortlist });
  });

  app.delete('/shortlists/:profileId', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const params = z.object({ profileId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.code(400).send({ error: 'INVALID_PROFILE_ID' });
    }

    await prisma.shortlist.deleteMany({
      where: { userId, matrimonyProfileId: params.data.profileId },
    });

    return reply.code(204).send();
  });
}
