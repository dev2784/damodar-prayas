import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGetShortlistsQuery, useRemoveShortlistMutation } from '@/services/interaction-api';
import type { MatrimonyProfile } from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

const C = { bg: '#FFF9F1', paper: '#FFFFFF', maroon: '#A30D1E', text: '#231C19', muted: '#756B66', line: '#E9DCCF', red: '#B42318' };

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function nameOf(profile: MatrimonyProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}

export default function MatrimonyShortlistScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data, isLoading, isError, refetch } = useGetShortlistsQuery(undefined, { skip: !accessToken });
  const [removeShortlist, { isLoading: removing }] = useRemoveShortlistMutation();

  async function remove(profileId: string) {
    try {
      await removeShortlist(profileId).unwrap();
    } catch {
      Alert.alert('Shortlist अपडेट नहीं हुई', 'कृपया दोबारा कोशिश करें।');
    }
  }

  if (!accessToken) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.center}><Text style={styles.title}>Shortlist देखने के लिए लॉगिन करें</Text><Pressable style={styles.primary} onPress={() => router.push('/profile')}><Text style={styles.primaryText}>लॉगिन पर जाएँ</Text></Pressable></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} /></Pressable>
        <View style={{ flex: 1 }}><Text style={styles.eyebrow}>MY MATRIMONY</Text><Text style={styles.title}>मेरी Shortlist</Text></View>
      </View>
      {isLoading ? <View style={styles.center}><ActivityIndicator color={C.maroon} size="large" /><Text style={styles.muted}>Shortlist लोड हो रही है...</Text></View> : isError ? <View style={styles.center}><Text style={styles.title}>Shortlist लोड नहीं हुई</Text><Pressable style={styles.primary} onPress={refetch}><Text style={styles.primaryText}>फिर कोशिश करें</Text></Pressable></View> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {(data?.items.length ?? 0) === 0 ? <View style={styles.empty}><SymbolView name={{ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }} tintColor="#B99D8C" size={44} /><Text style={styles.title}>अभी कोई profile shortlist नहीं है</Text><Text style={styles.muted}>पसंद आने वाली प्रोफाइल को Shortlist करें, वह यहाँ दिखाई देगी।</Text></View> : data?.items.map((item) => {
            const p = item.matrimonyProfile;
            const photo = p.photos[0]?.url;
            return <Pressable key={item.id} style={styles.card} onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: p.id } })}>
              {photo ? <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" /> : <View style={styles.photoPlaceholder}><SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} tintColor="#C9B0A2" size={54} /></View>}
              <View style={styles.cardBody}><Text style={styles.name}>{nameOf(p)}, {calculateAge(p.dateOfBirth)}</Text><Text style={styles.meta}>{[p.currentCity, p.state].filter(Boolean).join(', ') || 'भारत'}</Text><Text style={styles.meta}>{p.occupation || p.education || 'विवरण देखें'}</Text></View>
              <Pressable disabled={removing} style={styles.removeButton} onPress={(event) => { event.stopPropagation(); void remove(p.id); }}><SymbolView name={{ ios: 'bookmark.slash.fill', android: 'bookmark_remove', web: 'bookmark_remove' }} tintColor={C.red} size={20} /></Pressable>
            </Pressable>;
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  header: { minHeight: 68, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: C.line, backgroundColor: '#FFFDF9' },
  iconButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: C.maroon, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: C.text, fontSize: 18, fontWeight: '900' },
  content: { padding: 14, paddingBottom: 100, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 15, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  photo: { width: 72, height: 84, borderRadius: 11, backgroundColor: '#EEE1D7' },
  photoPlaceholder: { width: 72, height: 84, borderRadius: 11, backgroundColor: '#F3E8DF', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  name: { color: C.text, fontSize: 14, fontWeight: '900' },
  meta: { color: C.muted, fontSize: 10, marginTop: 4 },
  removeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF1F0', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  muted: { color: C.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  primary: { marginTop: 8, backgroundColor: C.maroon, borderRadius: 11, paddingHorizontal: 16, paddingVertical: 11 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
