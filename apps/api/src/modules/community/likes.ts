import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';

async function userId(request: FastifyRequest, reply: FastifyReply) {
  try {
    const payload = await request.jwtVerify<{ sub: string }>();
    const user = await prisma.user.findFirst({ where: { id: payload.sub, isActive: true, deletedAt: null }, select: { id: true } });
    if (!user) { await reply.code(401).send({ error: 'UNAUTHORIZED' }); return null; }
    return user.id;
  } catch { await reply.code(401).send({ error: 'UNAUTHORIZED' }); return null; }
}
export async function communityLikeRoutes(app: FastifyInstance) {
  app.get('/:id/likes', async (request, reply) => {
    const params=z.object({id:z.string().min(1)}).safeParse(request.params);
    if(!params.success)return reply.code(400).send({error:'INVALID_POST_ID'});
    const count=await prisma.communityPostLike.count({where:{postId:params.data.id}});
    return {likeCount:count};
  });
  app.get('/:id/like/me', async (request, reply) => {
    const uid=await userId(request,reply); if(!uid)return;
    const params=z.object({id:z.string().min(1)}).safeParse(request.params);
    if(!params.success)return reply.code(400).send({error:'INVALID_POST_ID'});
    const like=await prisma.communityPostLike.findUnique({where:{postId_userId:{postId:params.data.id,userId:uid}},select:{id:true}});
    return {isLiked:Boolean(like)};
  });
  app.post('/:id/like', async (request, reply) => {
    const uid=await userId(request,reply); if(!uid)return;
    const params=z.object({id:z.string().min(1)}).safeParse(request.params);
    if(!params.success)return reply.code(400).send({error:'INVALID_POST_ID'});
    const post=await prisma.communityPost.findFirst({where:{id:params.data.id,status:'PUBLISHED',deletedAt:null},select:{id:true,category:true}});
    if(!post)return reply.code(404).send({error:'POST_NOT_FOUND'});
    if(post.category==='ADVERTISEMENT')return reply.code(400).send({error:'LIKES_DISABLED_FOR_ADVERTISEMENTS'});
    await prisma.communityPostLike.upsert({where:{postId_userId:{postId:post.id,userId:uid}},create:{postId:post.id,userId:uid},update:{}});
    return {isLiked:true,likeCount:await prisma.communityPostLike.count({where:{postId:post.id}})};
  });
  app.delete('/:id/like', async (request, reply) => {
    const uid=await userId(request,reply); if(!uid)return;
    const params=z.object({id:z.string().min(1)}).safeParse(request.params);
    if(!params.success)return reply.code(400).send({error:'INVALID_POST_ID'});
    await prisma.communityPostLike.deleteMany({where:{postId:params.data.id,userId:uid}});
    return {isLiked:false,likeCount:await prisma.communityPostLike.count({where:{postId:params.data.id}})};
  });
}
