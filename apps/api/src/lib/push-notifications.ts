import { prisma } from './prisma.js';
type PushData = Record<string, string>;
export async function sendPushToUsers(userIds: string[], title: string, body: string, data: PushData = {}) {
  if (!userIds.length) return;
  const rows = await prisma.pushToken.findMany({ where: { userId: { in: [...new Set(userIds)] }, isActive: true }, select: { token: true } });
  if (!rows.length) return;
  const messages = rows.map(({ token }) => ({ to: token, sound: 'default', title, body, data }));
  try {
    for (let i=0;i<messages.length;i+=100) {
      await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(messages.slice(i,i+100))});
    }
  } catch (error) { console.error('Push notification send failed', error); }
}
