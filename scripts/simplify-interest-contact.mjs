import fs from 'node:fs';

function replaceOrFail(path, from, to, label) {
  let s = fs.readFileSync(path, 'utf8');
  if (!s.includes(from)) throw new Error(`${label} marker not found in ${path}`);
  s = s.replace(from, to);
  fs.writeFileSync(path, s);
}

// Backend: accepted interest itself grants contact access and notification points to target profile.
{
  const path = 'apps/api/src/modules/interactions/routes.ts';
  let s = fs.readFileSync(path, 'utf8');

  const notificationOld = `      await tx.notification.create({\n        data: {\n          userId: interest.senderProfile.createdById,\n          type: status === 'ACCEPTED' ? 'INTEREST_ACCEPTED' : 'INTEREST_REJECTED',\n          titleHi: status === 'ACCEPTED' ? 'इंटरेस्ट स्वीकार हुआ' : 'इंटरेस्ट अस्वीकार हुआ',\n          titleEn: status === 'ACCEPTED' ? 'Interest accepted' : 'Interest rejected',\n          data: { interestId: interest.id },\n        },\n      });`;
  const notificationNew = `      await tx.notification.create({\n        data: {\n          userId: interest.senderProfile.createdById,\n          type: status === 'ACCEPTED' ? 'INTEREST_ACCEPTED' : 'INTEREST_REJECTED',\n          titleHi: status === 'ACCEPTED' ? 'रुचि स्वीकार हुई' : 'रुचि अस्वीकार हुई',\n          titleEn: status === 'ACCEPTED' ? 'Interest accepted' : 'Interest rejected',\n          bodyHi: status === 'ACCEPTED' ? 'आपकी रुचि स्वीकार हो गई है। अब प्रोफाइल पर संपर्क विवरण उपलब्ध है।' : 'आपकी रुचि स्वीकार नहीं हुई।',\n          bodyEn: status === 'ACCEPTED' ? 'Your interest was accepted. Contact details are now available on the profile.' : 'Your interest was not accepted.',\n          data: { interestId: interest.id, senderProfileId: interest.senderProfileId, receiverProfileId: interest.receiverProfileId },\n        },\n      });`;
  if (!s.includes(notificationOld)) throw new Error('interest response notification marker not found');
  s = s.replace(notificationOld, notificationNew);

  const accessOld = `    const acceptedContact = await prisma.contactRequest.findFirst({\n      where: {\n        status: 'ACCEPTED',\n        OR: [\n          { senderProfileId: ownerProfile.id, receiverProfileId: targetProfile.id },\n          { senderProfileId: targetProfile.id, receiverProfileId: ownerProfile.id },\n        ],\n      },\n      select: { id: true },\n    });\n\n    if (!acceptedContact) {\n      return reply.code(403).send({ error: 'CONTACT_ACCESS_NOT_GRANTED' });\n    }`;
  const accessNew = `    const acceptedInterest = await prisma.interest.findFirst({\n      where: {\n        status: 'ACCEPTED',\n        OR: [\n          { senderProfileId: ownerProfile.id, receiverProfileId: targetProfile.id },\n          { senderProfileId: targetProfile.id, receiverProfileId: ownerProfile.id },\n        ],\n      },\n      select: { id: true },\n    });\n\n    if (!acceptedInterest) {\n      return reply.code(403).send({ error: 'ACCEPTED_INTEREST_REQUIRED' });\n    }`;
  if (!s.includes(accessOld)) throw new Error('contact access marker not found');
  s = s.replace(accessOld, accessNew);
  fs.writeFileSync(path, s);
}

// Mobile interaction API: fetch contacts after an accepted interest.
{
  const path = 'apps/mobile/src/services/interaction-api.ts';
  let s = fs.readFileSync(path, 'utf8');
  const typeAnchor = `export type OutgoingInterest = Interest & { receiverProfile: MatrimonyProfile };\n`;
  const typeAdd = `${typeAnchor}\nexport type ProfileContact = {\n  profileId: string;\n  contactPhone: string | null;\n  contactEmail: string | null;\n};\n`;
  if (!s.includes('export type ProfileContact')) {
    if (!s.includes(typeAnchor)) throw new Error('interaction api type anchor missing');
    s = s.replace(typeAnchor, typeAdd);
  }

  const endpointAnchor = `    getOutgoingInterests: builder.query<{ items: OutgoingInterest[] }, void>({\n      query: () => '/interests/outgoing',\n      providesTags: [{ type: 'Interests', id: 'OUTGOING' }],\n    }),\n`;
  const endpointAdd = `${endpointAnchor}    getProfileContact: builder.query<ProfileContact, { profileId: string; ownerProfileId: string }>({\n      query: ({ profileId, ownerProfileId }) => \\`/contacts/\\${profileId}?ownerProfileId=\\${encodeURIComponent(ownerProfileId)}\\`,\n    }),\n`;
  if (!s.includes('getProfileContact:')) {
    if (!s.includes(endpointAnchor)) throw new Error('interaction api endpoint anchor missing');
    s = s.replace(endpointAnchor, endpointAdd);
  }
  const exportAnchor = `  useGetOutgoingInterestsQuery,\n`;
  if (!s.includes('useGetProfileContactQuery')) {
    if (!s.includes(exportAnchor)) throw new Error('interaction api export anchor missing');
    s = s.replace(exportAnchor, `${exportAnchor}  useGetProfileContactQuery,\n`);
  }
  fs.writeFileSync(path, s);
}

// Notification API for the existing bell.
fs.writeFileSync('apps/mobile/src/services/notification-api.ts', `import { api } from '@/services/api';\n\nexport type AppNotification = {\n  id: string;\n  type: 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED' | 'INTEREST_REJECTED' | 'CONTACT_REQUEST' | 'CONTACT_ACCEPTED' | 'PROFILE_APPROVED' | 'PROFILE_REJECTED' | 'COMMUNITY_POST' | 'GENERAL';\n  titleHi: string;\n  titleEn: string | null;\n  bodyHi: string | null;\n  bodyEn: string | null;\n  data: Record<string, unknown> | null;\n  readAt: string | null;\n  createdAt: string;\n};\n\ntype NotificationList = {\n  items: AppNotification[];\n  pagination: { page: number; limit: number; total: number; pages: number };\n  unreadCount: number;\n};\n\nexport const notificationApi = api.injectEndpoints({\n  endpoints: (builder) => ({\n    getNotifications: builder.query<NotificationList, void>({\n      query: () => '/notifications?limit=30',\n      providesTags: [{ type: 'Notifications', id: 'LIST' }],\n    }),\n    getUnreadNotificationCount: builder.query<{ unreadCount: number }, void>({\n      query: () => '/notifications/unread-count',\n      providesTags: [{ type: 'Notifications', id: 'COUNT' }],\n    }),\n    markNotificationRead: builder.mutation<{ notification: AppNotification }, string>({\n      query: (id) => ({ url: \\`/notifications/\\${id}/read\\`, method: 'PATCH' }),\n      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, { type: 'Notifications', id: 'COUNT' }],\n    }),\n    markAllNotificationsRead: builder.mutation<{ updatedCount: number }, void>({\n      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),\n      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, { type: 'Notifications', id: 'COUNT' }],\n    }),\n  }),\n  overrideExisting: false,\n});\n\nexport const {\n  useGetNotificationsQuery,\n  useGetUnreadNotificationCountQuery,\n  useMarkNotificationReadMutation,\n  useMarkAllNotificationsReadMutation,\n} = notificationApi;\n`);

// Home bell uses all unread notifications, including accepted interests.
{
  const path = 'apps/mobile/src/app/index.tsx';
  let s = fs.readFileSync(path, 'utf8');
  s = s.replace(`import { useGetIncomingInterestsQuery } from '@/services/interaction-api';`, `import { useGetUnreadNotificationCountQuery } from '@/services/notification-api';`);
  const oldState = `  const { data: incomingInterests } = useGetIncomingInterestsQuery(undefined, { skip: !accessToken });\n  const pendingInterestCount = incomingInterests?.items.filter((item) => item.status === 'PENDING').length ?? 0;`;
  const newState = `  const { data: notificationCount } = useGetUnreadNotificationCountQuery(undefined, { skip: !accessToken });\n  const unreadNotificationCount = notificationCount?.unreadCount ?? 0;`;
  if (!s.includes(oldState)) throw new Error('home notification state marker missing');
  s = s.replace(oldState, newState);
  s = s.replace(`onPress={() => router.push('/matrimony-interests')}`, `onPress={() => router.push('/notifications')}`);
  s = s.replace(/pendingInterestCount/g, 'unreadNotificationCount');
  fs.writeFileSync(path, s);
}

// Profile: accepted interest unlocks contacts for either side.
{
  const path = 'apps/mobile/src/app/matrimony-profile.tsx';
  let s = fs.readFileSync(path, 'utf8');
  const importOld = `import { useAddShortlistMutation, useGetOutgoingInterestsQuery, useGetShortlistsQuery, useRemoveShortlistMutation, useSendInterestMutation } from '@/services/interaction-api';`;
  const importNew = `import { useAddShortlistMutation, useGetIncomingInterestsQuery, useGetOutgoingInterestsQuery, useGetProfileContactQuery, useGetShortlistsQuery, useRemoveShortlistMutation, useSendInterestMutation } from '@/services/interaction-api';`;
  if (!s.includes(importOld)) throw new Error('profile interaction import marker missing');
  s = s.replace(importOld, importNew);

  const queryOld = `  const { data: outgoingData } = useGetOutgoingInterestsQuery(undefined, { skip: !accessToken });`;
  const queryNew = `${queryOld}\n  const { data: incomingData } = useGetIncomingInterestsQuery(undefined, { skip: !accessToken });`;
  s = s.replace(queryOld, queryNew);

  const relationOld = `  const outgoingInterest = outgoingData?.items.find((item) => item.receiverProfileId === profile.id);`;
  const relationNew = `  const outgoingInterest = outgoingData?.items.find((item) => item.receiverProfileId === profile.id);\n  const incomingInterest = incomingData?.items.find((item) => item.senderProfileId === profile.id);\n  const relationshipInterest = outgoingInterest ?? incomingInterest;\n  const acceptedInterest = relationshipInterest?.status === 'ACCEPTED' ? relationshipInterest : undefined;\n  const contactOwnerProfileId = acceptedInterest\n    ? acceptedInterest.senderProfileId === profile.id\n      ? acceptedInterest.receiverProfileId\n      : acceptedInterest.senderProfileId\n    : '';\n  const { data: contactData, isFetching: contactLoading } = useGetProfileContactQuery(\n    { profileId: profile.id, ownerProfileId: contactOwnerProfileId },\n    { skip: !accessToken || !acceptedInterest || !contactOwnerProfileId },\n  );`;
  if (!s.includes(relationOld)) throw new Error('profile relation marker missing');
  s = s.replace(relationOld, relationNew);

  s = s.replace(`    if (outgoingInterest) {\n      Alert.alert('Interest status', outgoingInterest.status === 'PENDING' ? 'आपका interest अभी pending है।' : outgoingInterest.status === 'ACCEPTED' ? 'आपका interest स्वीकार हो चुका है।' : 'यह interest पहले ही respond हो चुका है।');`, `    if (relationshipInterest) {\n      Alert.alert('Interest status', relationshipInterest.status === 'PENDING' ? 'यह interest अभी pending है।' : relationshipInterest.status === 'ACCEPTED' ? 'रुचि स्वीकार हो चुकी है। संपर्क विवरण नीचे उपलब्ध है।' : 'यह interest पहले ही respond हो चुका है।');`);
  s = s.replace(`{outgoingInterest ? (outgoingInterest.status === 'PENDING' ? 'रुचि Pending' : outgoingInterest.status === 'ACCEPTED' ? 'रुचि Accepted' : 'रुचि भेजी गई') : 'रुचि भेजें'}`, `{relationshipInterest ? (relationshipInterest.status === 'PENDING' ? 'रुचि Pending' : relationshipInterest.status === 'ACCEPTED' ? 'रुचि Accepted' : 'रुचि भेजी गई') : 'रुचि भेजें'}`);

  const contactAnchor = `      )}\n\n      <Modal visible={senderModalOpen}`;
  const contactBlock = `      )}\n\n      {acceptedInterest ? (\n        <View style={styles.contactCard}>\n          <View style={styles.contactHeader}>\n            <SymbolView name={{ ios: 'phone.circle.fill', android: 'contact_phone', web: 'contact_phone' }} tintColor={C.green} size={22} />\n            <View style={{ flex: 1 }}>\n              <Text style={styles.contactTitle}>संपर्क विवरण उपलब्ध</Text>\n              <Text style={styles.contactHint}>रुचि स्वीकार होने के बाद यह जानकारी दोनों पक्षों को दिखाई देती है।</Text>\n            </View>\n          </View>\n          {contactLoading ? <ActivityIndicator color={C.green} size=\"small\" /> : (\n            <View style={styles.contactDetails}>\n              {contactData?.contactPhone ? <Text style={styles.contactValue}>📞 {contactData.contactPhone}</Text> : null}\n              {contactData?.contactEmail ? <Text style={styles.contactValue}>✉️ {contactData.contactEmail}</Text> : null}\n              {!contactData?.contactPhone && !contactData?.contactEmail ? <Text style={styles.contactEmpty}>इस प्रोफाइल ने अभी संपर्क जानकारी नहीं जोड़ी है।</Text> : null}\n            </View>\n          )}\n        </View>\n      ) : null}\n\n      <Modal visible={senderModalOpen}`;
  if (!s.includes(contactAnchor)) throw new Error('profile contact insertion anchor missing');
  s = s.replace(contactAnchor, contactBlock);

  const styleAnchor = `  actionsCard:`;
  if (!s.includes(styleAnchor)) throw new Error('profile style anchor missing');
  const styleInsert = `  contactCard: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: '#F1FAF5', borderWidth: 1, borderColor: '#CDE9D9', gap: 10 },\n  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },\n  contactTitle: { color: '#155C43', fontSize: 13, fontWeight: '900' },\n  contactHint: { color: '#4D7464', fontSize: 9.5, lineHeight: 14, marginTop: 2 },\n  contactDetails: { gap: 7, paddingTop: 2 },\n  contactValue: { color: C.text, fontSize: 12, fontWeight: '800' },\n  contactEmpty: { color: C.muted, fontSize: 10.5 },\n`;
  s = s.replace(styleAnchor, styleInsert + styleAnchor);
  fs.writeFileSync(path, s);
}

// Interest acceptance messaging in request screen.
replaceOrFail(
  'apps/mobile/src/app/matrimony-interests.tsx',
  `      Alert.alert(action === 'ACCEPT' ? 'रुचि स्वीकार हुई' : 'रुचि अस्वीकार हुई');`,
  `      Alert.alert(action === 'ACCEPT' ? 'रुचि स्वीकार हुई' : 'रुचि अस्वीकार हुई', action === 'ACCEPT' ? 'अब दोनों प्रोफाइल पर संपर्क विवरण उपलब्ध है।' : undefined);`,
  'interest alert',
);

// Simple notification center.
fs.writeFileSync('apps/mobile/src/app/notifications.tsx', `import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';\nimport { router } from 'expo-router';\nimport { SymbolView } from 'expo-symbols';\nimport { SafeAreaView } from 'react-native-safe-area-context';\n\nimport { type AppNotification, useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '@/services/notification-api';\nimport { useAppSelector } from '@/store/hooks';\n\nconst C = { bg: '#FFF9F1', paper: '#FFFFFF', maroon: '#A30D1E', text: '#231C19', muted: '#756B66', line: '#E9DCCF', green: '#16865C' };\n\nexport default function NotificationsScreen() {\n  const accessToken = useAppSelector((state) => state.auth.accessToken);\n  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(undefined, { skip: !accessToken });\n  const [markRead] = useMarkNotificationReadMutation();\n  const [markAll] = useMarkAllNotificationsReadMutation();\n\n  async function openItem(item: AppNotification) {\n    if (!item.readAt) { try { await markRead(item.id).unwrap(); } catch {} }\n    const receiverProfileId = typeof item.data?.receiverProfileId === 'string' ? item.data.receiverProfileId : '';\n    if (item.type === 'INTEREST_RECEIVED') { router.push('/matrimony-interests'); return; }\n    if (item.type === 'INTEREST_ACCEPTED' && receiverProfileId) { router.push({ pathname: '/matrimony-profile', params: { id: receiverProfileId } }); return; }\n    if (item.type === 'INTEREST_ACCEPTED' || item.type === 'INTEREST_REJECTED') { router.push('/matrimony-interests'); }\n  }\n\n  if (!accessToken) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Notifications देखने के लिए लॉगिन करें</Text></View></SafeAreaView>;\n\n  return <SafeAreaView style={styles.safe} edges={['top']}>\n    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} /></Pressable><View style={{ flex: 1 }}><Text style={styles.eyebrow}>NOTIFICATIONS</Text><Text style={styles.title}>सूचनाएँ</Text></View>{(data?.unreadCount ?? 0) > 0 ? <Pressable onPress={() => void markAll()}><Text style={styles.readAll}>सभी पढ़ें</Text></Pressable> : null}</View>\n    {isLoading ? <View style={styles.center}><ActivityIndicator color={C.maroon} size=\"large\" /></View> : isError ? <View style={styles.center}><Text style={styles.title}>सूचनाएँ लोड नहीं हुईं</Text><Pressable style={styles.retry} onPress={refetch}><Text style={styles.retryText}>फिर कोशिश करें</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>\n      {(data?.items.length ?? 0) === 0 ? <View style={styles.center}><SymbolView name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} tintColor=\"#B99D8C\" size={44} /><Text style={styles.empty}>अभी कोई notification नहीं है</Text></View> : data?.items.map((item) => <Pressable key={item.id} style={[styles.card, !item.readAt && styles.unreadCard]} onPress={() => void openItem(item)}><View style={[styles.dot, item.readAt && styles.dotRead]} /><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.titleHi}</Text>{item.bodyHi ? <Text style={styles.itemBody}>{item.bodyHi}</Text> : null}<Text style={styles.time}>{new Date(item.createdAt).toLocaleString('hi-IN')}</Text></View><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor=\"#B59D91\" size={16} /></Pressable>)}\n    </ScrollView>}\n  </SafeAreaView>;\n}\n\nconst styles = StyleSheet.create({\n  safe: { flex: 1, backgroundColor: C.bg }, header: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFDF9', borderBottomWidth: 1, borderBottomColor: C.line }, back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' }, eyebrow: { color: C.maroon, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, title: { color: C.text, fontSize: 18, fontWeight: '900' }, readAll: { color: C.maroon, fontSize: 10.5, fontWeight: '900' }, content: { padding: 14, gap: 9, paddingBottom: 100 }, card: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 14, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line }, unreadCard: { backgroundColor: '#FFF5F2', borderColor: '#EBC9C2' }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.maroon }, dotRead: { backgroundColor: '#D2C7C0' }, itemTitle: { color: C.text, fontSize: 12, fontWeight: '900' }, itemBody: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }, time: { color: '#9A8D86', fontSize: 8.5, marginTop: 6 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }, empty: { color: C.muted, fontSize: 12, fontWeight: '700' }, retry: { backgroundColor: C.maroon, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }, retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 10 },\n});\n`);

// Hide notification route from the bottom tab bar.
{
  const path = 'apps/mobile/src/components/app-tabs.tsx';
  let s = fs.readFileSync(path, 'utf8');
  const anchor = `      <Tabs.Screen name="matrimony-interests" options={{ href: null }} />\n`;
  if (!s.includes('name="notifications"')) {
    if (!s.includes(anchor)) throw new Error('app tabs notification anchor missing');
    s = s.replace(anchor, `${anchor}      <Tabs.Screen name="notifications" options={{ href: null }} />\n`);
  }
  fs.writeFileSync(path, s);
}
