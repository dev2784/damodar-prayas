import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type AppNotification, useGetNotificationsQuery, useMarkAllNotificationsReadMutation, useMarkNotificationReadMutation } from '@/services/notification-api';
import { useAppSelector } from '@/store/hooks';

const C = { bg: '#FFF9F1', paper: '#FFFFFF', maroon: '#A30D1E', text: '#231C19', muted: '#756B66', line: '#E9DCCF', green: '#16865C' };

export default function NotificationsScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(undefined, { skip: !accessToken });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllNotificationsReadMutation();

  async function openItem(item: AppNotification) {
    if (!item.readAt) { try { await markRead(item.id).unwrap(); } catch {} }
    const receiverProfileId = typeof item.data?.receiverProfileId === 'string' ? item.data.receiverProfileId : '';
    if (item.type === 'INTEREST_RECEIVED') { router.push('/matrimony-interests'); return; }
    if (item.type === 'INTEREST_ACCEPTED' && receiverProfileId) { router.push({ pathname: '/matrimony-profile', params: { id: receiverProfileId } }); return; }
    if (item.type === 'INTEREST_ACCEPTED' || item.type === 'INTEREST_REJECTED') { router.push('/matrimony-interests'); }
  }

  if (!accessToken) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Notifications देखने के लिए लॉगिन करें</Text></View></SafeAreaView>;

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <View style={styles.header}><Pressable style={styles.back} onPress={() => router.back()}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} /></Pressable><View style={{ flex: 1 }}><Text style={styles.eyebrow}>NOTIFICATIONS</Text><Text style={styles.title}>सूचनाएँ</Text></View>{(data?.unreadCount ?? 0) > 0 ? <Pressable onPress={() => void markAll()}><Text style={styles.readAll}>सभी पढ़ें</Text></Pressable> : null}</View>
    {isLoading ? <View style={styles.center}><ActivityIndicator color={C.maroon} size="large" /></View> : isError ? <View style={styles.center}><Text style={styles.title}>सूचनाएँ लोड नहीं हुईं</Text><Pressable style={styles.retry} onPress={refetch}><Text style={styles.retryText}>फिर कोशिश करें</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {(data?.items.length ?? 0) === 0 ? <View style={styles.center}><SymbolView name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }} tintColor="#B99D8C" size={44} /><Text style={styles.empty}>अभी कोई notification नहीं है</Text></View> : data?.items.map((item) => <Pressable key={item.id} style={[styles.card, !item.readAt && styles.unreadCard]} onPress={() => void openItem(item)}><View style={[styles.dot, item.readAt && styles.dotRead]} /><View style={{ flex: 1 }}><Text style={styles.itemTitle}>{item.titleHi}</Text>{item.bodyHi ? <Text style={styles.itemBody}>{item.bodyHi}</Text> : null}<Text style={styles.time}>{new Date(item.createdAt).toLocaleString('hi-IN')}</Text></View><SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="#B59D91" size={16} /></Pressable>)}
    </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg }, header: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFDF9', borderBottomWidth: 1, borderBottomColor: C.line }, back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' }, eyebrow: { color: C.maroon, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, title: { color: C.text, fontSize: 18, fontWeight: '900' }, readAll: { color: C.maroon, fontSize: 10.5, fontWeight: '900' }, content: { padding: 14, gap: 9, paddingBottom: 100 }, card: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 14, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line }, unreadCard: { backgroundColor: '#FFF5F2', borderColor: '#EBC9C2' }, dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.maroon }, dotRead: { backgroundColor: '#D2C7C0' }, itemTitle: { color: C.text, fontSize: 12, fontWeight: '900' }, itemBody: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 }, time: { color: '#9A8D86', fontSize: 8.5, marginTop: 6 }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }, empty: { color: C.muted, fontSize: 12, fontWeight: '700' }, retry: { backgroundColor: C.maroon, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 }, retryText: { color: '#FFFFFF', fontWeight: '900', fontSize: 10 },
});
