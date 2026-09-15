import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type MatrimonyCategory,
  type MatrimonyGender,
  type MatrimonyProfile,
  useGetMatrimonyProfilesQuery,
} from '@/services/matrimony-api';

const C = {
  bg: '#FFF9F1',
  paper: '#FFFFFF',
  maroon: '#A30D1E',
  maroonDark: '#7D0A16',
  gold: '#D99A2B',
  text: '#231C19',
  muted: '#756B66',
  line: '#E9DCCF',
  green: '#0BAA67',
};

const genderFilters: Array<{ label: string; value?: MatrimonyGender }> = [
  { label: 'सभी' },
  { label: 'वर', value: 'MALE' },
  { label: 'वधू', value: 'FEMALE' },
];

const categoryFilters: Array<{ label: string; value?: MatrimonyCategory }> = [
  { label: 'सभी समाज' },
  { label: 'जूना गुजराती', value: 'JUNA_GUJARATI' },
  { label: 'पीपा', value: 'PIPA' },
  { label: 'नामदेव', value: 'NAMDEV' },
];

const ageFilters = [
  { label: 'सभी आयु' },
  { label: '18–25', minAge: 18, maxAge: 25 },
  { label: '26–32', minAge: 26, maxAge: 32 },
  { label: '33–45', minAge: 33, maxAge: 45 },
  { label: '46+', minAge: 46, maxAge: 100 },
];

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age;
}

function fullName(profile: MatrimonyProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ProfileCard({ profile }: { profile: MatrimonyProfile }) {
  const photo = profile.photos[0]?.url;
  const age = calculateAge(profile.dateOfBirth);
  const location = [profile.currentCity, profile.state].filter(Boolean).join(', ');

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })}>
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <SymbolView
              name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }}
              tintColor="#C7AFA1"
              size={68}
            />
          </View>
        )}

        <View style={styles.verifiedBadge}>
          <SymbolView
            name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
            tintColor={C.green}
            size={13}
          />
          <Text style={styles.verifiedText}>सत्यापित</Text>
        </View>

        {profile.isFeatured ? (
          <View style={styles.featuredBadge}>
            <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor="#FFFFFF" size={10} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{fullName(profile)}, {age}</Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={C.maroon}
            size={15}
          />
        </View>

        <Text style={styles.meta} numberOfLines={1}>{location || 'भारत'}</Text>
        <Text style={styles.work} numberOfLines={1}>
          {profile.education || profile.occupation || 'विवरण देखें'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MatrimonyScreen() {
  const [gender, setGender] = useState<MatrimonyGender | undefined>();
  const [category, setCategory] = useState<MatrimonyCategory | undefined>();
  const [ageIndex, setAgeIndex] = useState(0);
  const [page, setPage] = useState(1);

  const selectedAge = ageFilters[ageIndex];
  const queryArgs = useMemo(() => ({
    gender,
    category,
    minAge: selectedAge.minAge,
    maxAge: selectedAge.maxAge,
    page,
    limit: 20,
  }), [category, gender, page, selectedAge.maxAge, selectedAge.minAge]);

  const { data, isLoading, isFetching, isError, refetch } = useGetMatrimonyProfilesQuery(queryArgs);

  function changeGender(value?: MatrimonyGender) {
    setGender(value);
    setPage(1);
  }

  function changeCategory(value?: MatrimonyCategory) {
    setCategory(value);
    setPage(1);
  }

  function changeAge(index: number) {
    setAgeIndex(index);
    setPage(1);
  }

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={data?.items ?? []}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfileCard profile={item} />}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        ListHeaderComponent={(
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>दर्जी समाज मैट्रिमोनी</Text>
                <Text style={styles.title}>अपना जीवनसाथी खोजें</Text>
                <Text style={styles.subtitle}>केवल स्वीकृत और सत्यापित प्रोफाइल</Text>
              </View>
              <Pressable style={styles.myProfileButton} onPress={() => router.push('/my-matrimony')}>
                <SymbolView name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }} tintColor={C.maroon} size={22} />
                <Text style={styles.myProfileText}>मेरा प्रोफाइल</Text>
              </Pressable>
            </View>

            <Pressable style={styles.createProfileBanner} onPress={() => router.push('/matrimony-form')}>
              <View style={styles.createProfileIcon}>
                <SymbolView name={{ ios: 'heart.circle.fill', android: 'favorite', web: 'favorite' }} tintColor={C.maroon} size={26} />
              </View>
              <View style={styles.createProfileCopy}>
                <Text style={styles.createProfileTitle}>अपना मैट्रिमोनी प्रोफाइल बनाएँ</Text>
                <Text style={styles.createProfileText}>अपनी जानकारी भरें, ड्राफ्ट सेव करें और तैयार होने पर समीक्षा के लिए भेजें।</Text>
              </View>
              <View style={styles.createProfileButton}>
                <Text style={styles.createProfileButtonText}>बनाएँ</Text>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="#FFFFFF" size={14} />
              </View>
            </Pressable>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>मैं देखना चाहता/चाहती हूँ</Text>
              <View style={styles.genderRow}>
                {genderFilters.map((item) => (
                  <FilterChip
                    key={item.label}
                    label={item.label}
                    active={gender === item.value}
                    onPress={() => changeGender(item.value)}
                  />
                ))}
              </View>
            </View>

            <View style={styles.filterBlockCompact}>
              <Text style={styles.filterLabel}>समाज</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {categoryFilters.map((item) => (
                  <FilterChip
                    key={item.label}
                    label={item.label}
                    active={category === item.value}
                    onPress={() => changeCategory(item.value)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.filterBlockCompact}>
              <Text style={styles.filterLabel}>आयु</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {ageFilters.map((item, index) => (
                  <FilterChip
                    key={item.label}
                    label={item.label}
                    active={ageIndex === index}
                    onPress={() => changeAge(index)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={styles.resultsRow}>
              <View>
                <Text style={styles.resultsTitle}>मैट्रिमोनी प्रोफाइल</Text>
                <Text style={styles.resultsCount}>{total} प्रोफाइल मिले</Text>
              </View>
              {isFetching && !isLoading ? <ActivityIndicator color={C.maroon} size="small" /> : null}
            </View>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator color={C.maroon} size="large" />
                <Text style={styles.emptyTitle}>प्रोफाइल लोड हो रहे हैं...</Text>
              </>
            ) : isError ? (
              <>
                <SymbolView name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} tintColor={C.maroon} size={42} />
                <Text style={styles.emptyTitle}>प्रोफाइल लोड नहीं हो पाए</Text>
                <Text style={styles.emptyText}>API connection और EXPO_PUBLIC_API_URL check करें।</Text>
                <Pressable style={styles.retryButton} onPress={refetch}>
                  <Text style={styles.retryText}>फिर से कोशिश करें</Text>
                </Pressable>
              </>
            ) : (
              <>
                <SymbolView name={{ ios: 'person.2.slash', android: 'group_off', web: 'group_off' }} tintColor="#B99D8C" size={46} />
                <Text style={styles.emptyTitle}>इस फ़िल्टर में कोई प्रोफाइल नहीं मिला</Text>
                <Text style={styles.emptyText}>दूसरा समाज, आयु या वर/वधू विकल्प चुनकर देखें।</Text>
              </>
            )}
          </View>
        )}
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <Pressable
                disabled={page <= 1 || isFetching}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                style={[styles.pageButton, (page <= 1 || isFetching) && styles.pageButtonDisabled]}>
                <Text style={styles.pageButtonText}>‹ पिछला</Text>
              </Pressable>

              <Text style={styles.pageInfo}>{page} / {totalPages}</Text>

              <Pressable
                disabled={page >= totalPages || isFetching}
                onPress={() => setPage((current) => current + 1)}
                style={[styles.pageButton, (page >= totalPages || isFetching) && styles.pageButtonDisabled]}>
                <Text style={styles.pageButtonText}>अगला ›</Text>
              </Pressable>
            </View>
          ) : <View style={styles.footerSpace} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 14, paddingBottom: 108 },
  header: { paddingTop: 10, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  eyebrow: { color: C.gold, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: C.maroonDark, fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: 3 },
  subtitle: { color: C.muted, fontSize: 11, marginTop: 3 },
  myProfileButton: { minWidth: 74, alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 8, paddingHorizontal: 7, borderRadius: 12, backgroundColor: '#FFF0EC', borderWidth: 1, borderColor: '#F0D1C8' },
  myProfileText: { color: C.maroon, fontSize: 8.5, fontWeight: '900' },

  createProfileBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 12, marginBottom: 12, backgroundColor: '#FFF1EC', borderWidth: 1, borderColor: '#F0CEC4' },
  createProfileIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  createProfileCopy: { flex: 1, minWidth: 0 },
  createProfileTitle: { color: C.maroonDark, fontSize: 13, fontWeight: '900' },
  createProfileText: { color: C.muted, fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  createProfileButton: { minWidth: 58, minHeight: 34, borderRadius: 11, paddingHorizontal: 10, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  createProfileButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  filterBlock: { borderRadius: 15, padding: 12, backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: C.line, marginBottom: 9 },
  filterBlockCompact: { marginTop: 2, marginBottom: 8 },
  filterLabel: { color: C.text, fontSize: 11, fontWeight: '900', marginBottom: 7 },
  genderRow: { flexDirection: 'row', gap: 7 },
  horizontalChips: { gap: 7, paddingRight: 14 },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: '#E5D6CA', backgroundColor: '#FFFDF9' },
  chipActive: { backgroundColor: C.maroon, borderColor: C.maroon },
  chipText: { color: '#695D58', fontSize: 10, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },

  resultsRow: { marginTop: 8, marginBottom: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultsTitle: { color: C.text, fontSize: 17, fontWeight: '900' },
  resultsCount: { color: C.muted, fontSize: 9.5, marginTop: 2 },

  columns: { gap: 9 },
  card: { flex: 1, minWidth: 0, marginBottom: 10, borderRadius: 14, overflow: 'hidden', backgroundColor: C.paper, borderWidth: 1, borderColor: '#EADFD6', elevation: 2 },
  photoWrap: { width: '100%', aspectRatio: 0.87, backgroundColor: '#F0E5DC' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F6ECE3' },
  verifiedBadge: { position: 'absolute', left: 7, bottom: 7, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, backgroundColor: '#ECFFF5', paddingHorizontal: 6, paddingVertical: 3 },
  verifiedText: { color: C.green, fontSize: 7.5, fontWeight: '900' },
  featuredBadge: { position: 'absolute', top: 7, right: 7, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 7, backgroundColor: C.gold, paddingHorizontal: 6, paddingVertical: 3 },
  featuredText: { color: '#FFFFFF', fontSize: 6.8, fontWeight: '900' },
  cardBody: { padding: 9 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { flex: 1, color: C.text, fontSize: 12.5, fontWeight: '900' },
  meta: { color: C.muted, fontSize: 9, marginTop: 3 },
  work: { color: C.maroon, fontSize: 9, fontWeight: '700', marginTop: 3 },

  emptyState: { minHeight: 250, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 25 },
  emptyTitle: { color: C.text, fontSize: 15, fontWeight: '900', marginTop: 10, textAlign: 'center' },
  emptyText: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5, textAlign: 'center' },
  retryButton: { marginTop: 12, borderRadius: 10, backgroundColor: C.maroon, paddingHorizontal: 14, paddingVertical: 9 },
  retryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },

  pagination: { paddingTop: 12, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  pageButton: { minWidth: 78, alignItems: 'center', borderRadius: 10, backgroundColor: C.maroon, paddingVertical: 9, paddingHorizontal: 11 },
  pageButtonDisabled: { opacity: 0.35 },
  pageButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  pageInfo: { color: C.muted, fontSize: 10, fontWeight: '800' },
  footerSpace: { height: 18 },
});
