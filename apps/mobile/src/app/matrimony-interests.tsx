import { C, styles } from '@/styles/matrimony-interests.styles';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  type InterestStatus,
  useGetIncomingInterestsQuery,
  useGetOutgoingInterestsQuery,
  useRespondInterestMutation,
} from '@/services/interaction-api';
import type { MatrimonyProfile } from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

const statusMeta: Record<InterestStatus, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: C.amber, bg: '#FFF4DE' },
  ACCEPTED: { label: 'Accepted', color: C.green, bg: '#EAF8F0' },
  REJECTED: { label: 'Rejected', color: C.red, bg: '#FFF0EE' },
  WITHDRAWN: { label: 'Withdrawn', color: C.muted, bg: '#F2EFED' },
};
function nameOf(p: MatrimonyProfile) {
  return [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ');
}

export default function MatrimonyInterestsScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const incoming = useGetIncomingInterestsQuery(undefined, { skip: !accessToken });
  const outgoing = useGetOutgoingInterestsQuery(undefined, { skip: !accessToken });
  const [respond, { isLoading: responding }] = useRespondInterestMutation();

  async function respondTo(id: string, action: 'ACCEPT' | 'REJECT') {
    try {
      await respond({ id, action }).unwrap();
      Alert.alert(
        action === 'ACCEPT' ? 'रुचि स्वीकार हुई' : 'रुचि अस्वीकार हुई',
        action === 'ACCEPT' ? 'अब दोनों प्रोफाइल पर संपर्क विवरण उपलब्ध है।' : undefined,
      );
    } catch {
      Alert.alert('अपडेट नहीं हुआ', 'कृपया दोबारा कोशिश करें।');
    }
  }

  if (!accessToken)
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Interests देखने के लिए लॉगिन करें</Text>
          <Pressable style={styles.primary} onPress={() => router.push('/profile')}>
            <Text style={styles.primaryText}>लॉगिन पर जाएँ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  const loading = tab === 'incoming' ? incoming.isLoading : outgoing.isLoading;
  const error = tab === 'incoming' ? incoming.isError : outgoing.isError;
  const items = tab === 'incoming' ? (incoming.data?.items ?? []) : (outgoing.data?.items ?? []);
  const refetch = tab === 'incoming' ? incoming.refetch : outgoing.refetch;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={C.maroon}
            size={22}
          />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>MY MATRIMONY</Text>
          <Text style={styles.title}>रुचि अनुरोध</Text>
        </View>
      </View>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'incoming' && styles.tabActive]}
          onPress={() => setTab('incoming')}
        >
          <Text style={[styles.tabText, tab === 'incoming' && styles.tabTextActive]}>
            मिली हुई ({incoming.data?.items.length ?? 0})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'outgoing' && styles.tabActive]}
          onPress={() => setTab('outgoing')}
        >
          <Text style={[styles.tabText, tab === 'outgoing' && styles.tabTextActive]}>
            भेजी हुई ({outgoing.data?.items.length ?? 0})
          </Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.maroon} size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.title}>Interests लोड नहीं हुए</Text>
          <Pressable style={styles.primary} onPress={refetch}>
            <Text style={styles.primaryText}>फिर कोशिश करें</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {items.length === 0 ? (
            <View style={styles.empty}>
              <SymbolView
                name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
                tintColor="#B99D8C"
                size={44}
              />
              <Text style={styles.title}>अभी कोई interest नहीं है</Text>
            </View>
          ) : (
            items.map((item) => {
              const p =
                tab === 'incoming'
                  ? 'senderProfile' in item
                    ? item.senderProfile
                    : null
                  : 'receiverProfile' in item
                    ? item.receiverProfile
                    : null;
              if (!p) return null;
              const status = statusMeta[item.status];
              const photo = p.photos[0]?.url;
              return (
                <View key={item.id} style={styles.card}>
                  <Pressable
                    style={styles.profileRow}
                    onPress={() =>
                      router.push({ pathname: '/matrimony-profile', params: { id: p.id } })
                    }
                  >
                    {photo ? (
                      <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <SymbolView
                          name={{
                            ios: 'person.crop.circle.fill',
                            android: 'account_circle',
                            web: 'account_circle',
                          }}
                          tintColor="#C9B0A2"
                          size={48}
                        />
                      </View>
                    )}
                    <View style={styles.flexFill}>
                      <Text style={styles.name}>{nameOf(p)}</Text>
                      <Text style={styles.meta}>
                        {[p.currentCity, p.state].filter(Boolean).join(', ') || 'भारत'}
                      </Text>
                      <Text style={styles.meta}>
                        {p.occupation || p.education || 'प्रोफाइल देखें'}
                      </Text>
                    </View>
                    <View style={[styles.status, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </Pressable>
                  {item.message ? <Text style={styles.message}>“{item.message}”</Text> : null}
                  {tab === 'incoming' && item.status === 'PENDING' ? (
                    <View style={styles.actions}>
                      <Pressable
                        disabled={responding}
                        style={[styles.responseButton, styles.reject]}
                        onPress={() => void respondTo(item.id, 'REJECT')}
                      >
                        <Text style={styles.rejectText}>अस्वीकार</Text>
                      </Pressable>
                      <Pressable
                        disabled={responding}
                        style={[styles.responseButton, styles.accept]}
                        onPress={() => void respondTo(item.id, 'ACCEPT')}
                      >
                        <Text style={styles.acceptText}>स्वीकार करें</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
