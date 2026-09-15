import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Committee, useGetCommitteesQuery } from '@/services/committee-api';

const C = {
  bg: '#FFF8ED',
  paper: '#FFFDF9',
  maroon: '#A30D1E',
  maroonDark: '#74101B',
  gold: '#D99A2B',
  text: '#251B18',
  muted: '#776A64',
  line: '#E9D8C5',
  green: '#168458',
};

function CommitteeCard({ committee }: { committee: Committee }) {
  const translation = committee.translations[0];
  const location = [committee.city, committee.state].filter(Boolean).join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/samiti-detail', params: { id: committee.id } })}>
      {committee.bannerUrl ? (
        <Image source={{ uri: committee.bannerUrl }} style={styles.banner} contentFit="cover" transition={180} />
      ) : (
        <View style={styles.bannerPlaceholder}>
          <SymbolView name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }} tintColor={C.maroon} size={48} />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{translation?.name ?? 'समिति'}</Text>
        {location ? (
          <View style={styles.locationRow}>
            <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor={C.green} size={15} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          {committee.members.length > 0 ? (
            <View style={styles.memberMeta}>
              <SymbolView name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} tintColor={C.gold} size={15} />
              <Text style={styles.memberMetaText}>{committee.members.length} पदाधिकारी</Text>
            </View>
          ) : (
            <Text style={styles.optionalText}>पदाधिकारी विवरण वैकल्पिक</Text>
          )}
          <View style={styles.openRow}>
            <Text style={styles.openText}>समिति देखें</Text>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={C.maroon} size={14} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function SamitiScreen() {
  const { data, isLoading, isFetching, isError, refetch } = useGetCommitteesQuery({ language: 'HI' });
  const items = data?.items ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommitteeCard committee={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={C.maroon}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.eyebrow}>समाज संगठन</Text>
            <Text style={styles.title}>समितियाँ</Text>
            <Text style={styles.subtitle}>
              शहर और राज्य के अनुसार समाज की सक्रिय समितियाँ देखें। पदाधिकारी जोड़ना वैकल्पिक है।
            </Text>
            {!isLoading && !isError && items.length > 0 ? (
              <View style={styles.countPill}>
                <Text style={styles.countText}>{data?.pagination.total ?? items.length} समितियाँ</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={C.maroon} size="large" />
              <Text style={styles.stateTitle}>समितियाँ लोड हो रही हैं...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateCard}>
              <SymbolView name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} tintColor={C.maroon} size={42} />
              <Text style={styles.stateTitle}>समिति जानकारी लोड नहीं हो पाई</Text>
              <Text style={styles.stateText}>इंटरनेट या API कनेक्शन जाँचकर दोबारा कोशिश करें।</Text>
              <Pressable style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryText}>फिर से कोशिश करें</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <SymbolView name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }} tintColor={C.gold} size={46} />
              <Text style={styles.stateTitle}>अभी कोई समिति प्रकाशित नहीं है</Text>
              <Text style={styles.stateText}>नई समिति जुड़ते ही उसका banner, नाम, शहर और राज्य यहाँ दिखाई देगा।</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 110, flexGrow: 1 },
  header: { paddingHorizontal: 2, paddingTop: 5, paddingBottom: 14 },
  eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: C.maroonDark, fontSize: 28, lineHeight: 35, fontWeight: '900', marginTop: 3 },
  subtitle: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 4, maxWidth: 370 },
  countPill: { alignSelf: 'flex-start', marginTop: 10, borderRadius: 10, backgroundColor: '#F3E5E2', paddingHorizontal: 10, paddingVertical: 6 },
  countText: { color: C.maroon, fontSize: 9.5, fontWeight: '900' },
  card: { backgroundColor: C.paper, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: C.line, marginBottom: 14, elevation: 2, shadowColor: '#5D3724', shadowOpacity: 0.05, shadowRadius: 8 },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  banner: { width: '100%', aspectRatio: 1.85, backgroundColor: '#EEDFD3' },
  bannerPlaceholder: { width: '100%', aspectRatio: 1.85, backgroundColor: '#F7E9DF', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 13 },
  cardTitle: { color: C.text, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  locationText: { color: C.green, fontSize: 10.5, fontWeight: '800' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 13 },
  memberMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  memberMetaText: { color: C.muted, fontSize: 9.5, fontWeight: '800' },
  optionalText: { color: '#988A83', fontSize: 8.8, fontWeight: '700' },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  openText: { color: C.maroon, fontSize: 9.5, fontWeight: '900' },
  stateCard: { minHeight: 280, marginTop: 8, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stateTitle: { color: C.text, fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  stateText: { color: C.muted, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  retryButton: { marginTop: 14, borderRadius: 11, backgroundColor: C.maroon, paddingHorizontal: 17, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
});
