import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { type InterestStatus, useGetIncomingInterestsQuery, useGetOutgoingInterestsQuery, useRespondInterestMutation } from '@/services/interaction-api';
import type { MatrimonyProfile } from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

const C = { bg: '#FFF9F1', paper: '#FFFFFF', maroon: '#A30D1E', text: '#231C19', muted: '#756B66', line: '#E9DCCF', green: '#16865C', red: '#B42318', blue: '#2F62A3', amber: '#B76A12' };
const statusMeta: Record<InterestStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: C.amber, bg: '#FFF4DE' },
  ACCEPTED: { label: 'Accepted', color: C.green, bg: '#EAF8F0' },
  REJECTED: { label: 'Rejected', color: C.red, bg: '#FFF0EE' },
  WITHDRAWN: { label: 'Withdrawn', color: C.muted, bg: '#F2EFED' },
};
function nameOf(p: MatrimonyProfile) { return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' '); }

export default function MatrimonyInterestsScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const incoming = useGetIncomingInterestsQuery(undefined, { skip: !accessToken });
  const outgoing = useGetOutgoingInterestsQuery(undefined, { skip: !accessToken });
  const [respond, { isLoading: responding }] = useRespondInterestMutation();

  async function respondTo(id: string, action: 'ACCEPT' | 'REJECT') {
    try {
      await respond({ id, action }).unwrap();
      Alert.alert(action === 'ACCEPT' ? 'रुचि स्वीकार हुई' : 'रुचि अस्वीकार हुई');
    } catch {
      Alert.alert('अपडेट नहीं हुआ', 'कृपया दोबारा कोशिश करें।');
    }
  }

  if (!accessToken) return <SafeAreaView style={styles.safeArea}><View style={styles.center}><Text style={styles.title}>Interests देखने के लिए लॉगिन करें</Text><Pressable style={styles.primary} onPress={() => router.push('/profile')}><Text style={styles.primaryText}>लॉगिन पर जाएँ</Text></Pressable></View></SafeAreaView>;

  const loading = tab === 'incoming' ? incoming.isLoading : outgoing.isLoading;
  const error = tab === 'incoming' ? incoming.isError : outgoing.isError;
  const items = tab === 'incoming' ? incoming.data?.items ?? [] : outgoing.data?.items ?? [];
  const refetch = tab === 'incoming' ? incoming.refetch : outgoing.refetch;

  return <SafeAreaView style={styles.safeArea} edges={['top']}>
    <View style={styles.header}><Pressable style={styles.iconButton} onPress={() => router.back()}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} /></Pressable><View><Text style={styles.eyebrow}>MY MATRIMONY</Text><Text style={styles.title}>रुचि अनुरोध</Text></View></View>
    <View style={styles.tabs}><Pressable style={[styles.tab, tab === 'incoming' && styles.tabActive]} onPress={() => setTab('incoming')}><Text style={[styles.tabText, tab === 'incoming' && styles.tabTextActive]}>मिली हुई ({incoming.data?.items.length ?? 0})</Text></Pressable><Pressable style={[styles.tab, tab === 'outgoing' && styles.tabActive]} onPress={() => setTab('outgoing')}><Text style={[styles.tabText, tab === 'outgoing' && styles.tabTextActive]}>भेजी हुई ({outgoing.data?.items.length ?? 0})</Text></Pressable></View>
    {loading ? <View style={styles.center}><ActivityIndicator color={C.maroon} size="large" /></View> : error ? <View style={styles.center}><Text style={styles.title}>Interests लोड नहीं हुए</Text><Pressable style={styles.primary} onPress={refetch}><Text style={styles.primaryText}>फिर कोशिश करें</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {items.length === 0 ? <View style={styles.empty}><SymbolView name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} tintColor="#B99D8C" size={44} /><Text style={styles.title}>अभी कोई interest नहीं है</Text></View> : items.map((item) => {
        const p = tab === 'incoming' ? ('senderProfile' in item ? item.senderProfile : null) : ('receiverProfile' in item ? item.receiverProfile : null);
        if (!p) return null;
        const status = statusMeta[item.status];
        const photo = p.photos[0]?.url;
        return <View key={item.id} style={styles.card}>
          <Pressable style={styles.profileRow} onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: p.id } })}>{photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" /> : <View style={styles.photoPlaceholder}><SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} tintColor="#C9B0A2" size={48} /></View>}<View style={{ flex: 1 }}><Text style={styles.name}>{nameOf(p)}</Text><Text style={styles.meta}>{[p.currentCity, p.state].filter(Boolean).join(', ') || 'भारत'}</Text><Text style={styles.meta}>{p.occupation || p.education || 'प्रोफाइल देखें'}</Text></View><View style={[styles.status, { backgroundColor: status.bg }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View></Pressable>
          {item.message ? <Text style={styles.message}>“{item.message}”</Text> : null}
          {tab === 'incoming' && item.status === 'PENDING' ? <View style={styles.actions}><Pressable disabled={responding} style={[styles.responseButton, styles.reject]} onPress={() => void respondTo(item.id, 'REJECT')}><Text style={styles.rejectText}>अस्वीकार</Text></Pressable><Pressable disabled={responding} style={[styles.responseButton, styles.accept]} onPress={() => void respondTo(item.id, 'ACCEPT')}><Text style={styles.acceptText}>स्वीकार करें</Text></Pressable></View> : null}
        </View>;
      })}
    </ScrollView>}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  header: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: '#FFFDF9' },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: C.maroon, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: C.text, fontSize: 18, fontWeight: '900' },
  tabs: { flexDirection: 'row', padding: 10, gap: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11, backgroundColor: '#F4ECE6' },
  tabActive: { backgroundColor: C.maroon },
  tabText: { color: C.muted, fontSize: 10, fontWeight: '900' },
  tabTextActive: { color: '#FFFFFF' },
  content: { padding: 14, paddingTop: 4, gap: 10, paddingBottom: 100 },
  card: { padding: 11, borderRadius: 15, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photo: { width: 62, height: 72, borderRadius: 10, backgroundColor: '#EEE1D7' },
  photoPlaceholder: { width: 62, height: 72, borderRadius: 10, backgroundColor: '#F3E8DF', alignItems: 'center', justifyContent: 'center' },
  name: { color: C.text, fontSize: 13, fontWeight: '900' },
  meta: { color: C.muted, fontSize: 9.5, marginTop: 3 },
  status: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  statusText: { fontSize: 8, fontWeight: '900' },
  message: { color: C.text, fontSize: 10, lineHeight: 16, marginTop: 9, backgroundColor: '#FFF7EF', borderRadius: 9, padding: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  responseButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  reject: { backgroundColor: '#FFF0EE', borderWidth: 1, borderColor: '#F4C9C5' },
  accept: { backgroundColor: C.green },
  rejectText: { color: C.red, fontSize: 10, fontWeight: '900' },
  acceptText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  primary: { marginTop: 8, backgroundColor: C.maroon, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 11 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
