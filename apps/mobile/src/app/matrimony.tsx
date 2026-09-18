import { calculateAge } from '@/lib/profile-format';
import { C, styles } from '@/styles/matrimony.styles';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type MatrimonyCategory,
  type MatrimonyGender,
  type MatrimonyProfile,
  useGetMatrimonyProfilesQuery,
  useGetMyMatrimonyProfilesQuery,
} from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

const genderFilters: { label: string; value?: MatrimonyGender }[] = [
  { label: 'सभी' },
  { label: 'वर', value: 'MALE' },
  { label: 'वधू', value: 'FEMALE' },
];

const categoryFilters: { label: string; value?: MatrimonyCategory }[] = [
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
      onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })}
    >
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <SymbolView
              name={{
                ios: 'person.crop.circle.fill',
                android: 'account_circle',
                web: 'account_circle',
              }}
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
            <SymbolView
              name={{ ios: 'star.fill', android: 'star', web: 'star' }}
              tintColor="#FFFFFF"
              size={10}
            />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {fullName(profile)}, {age}
          </Text>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={C.maroon}
            size={15}
          />
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {location || 'भारत'}
        </Text>
        <Text style={styles.work} numberOfLines={1}>
          {profile.education || profile.occupation || 'विवरण देखें'}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MatrimonyScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [gender, setGender] = useState<MatrimonyGender | undefined>();
  const [category, setCategory] = useState<MatrimonyCategory | undefined>();
  const [ageIndex, setAgeIndex] = useState(0);
  const [page, setPage] = useState(1);

  const selectedAge = ageFilters[ageIndex];
  const queryArgs = useMemo(
    () => ({
      gender,
      category,
      minAge: selectedAge.minAge,
      maxAge: selectedAge.maxAge,
      page,
      limit: 20,
    }),
    [category, gender, page, selectedAge.maxAge, selectedAge.minAge],
  );

  const { data, isLoading, isFetching, isError, refetch } = useGetMatrimonyProfilesQuery(queryArgs);
  const { data: mineData, isLoading: isLoadingMine } = useGetMyMatrimonyProfilesQuery(undefined, {
    skip: !accessToken,
  });
  const hasAnyOwnProfile = (mineData?.items.length ?? 0) > 0;
  const ownProfileIds = useMemo(
    () => new Set(mineData?.items.map((item) => item.id) ?? []),
    [mineData?.items],
  );
  const visibleProfiles = useMemo(
    () => (data?.items ?? []).filter((item) => !ownProfileIds.has(item.id)),
    [data?.items, ownProfileIds],
  );

  function openOwnerFlow() {
    if (!accessToken) {
      router.push({ pathname: '/auth', params: { mode: 'register', next: '/matrimony-form' } });
      return;
    }
    if (isLoadingMine) return;
    if (hasAnyOwnProfile) {
      router.push('/my-matrimony');
      return;
    }
    router.push('/matrimony-form');
  }

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
        data={visibleProfiles}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProfileCard profile={item} />}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={styles.listContent}
        refreshing={isFetching && !isLoading}
        onRefresh={refetch}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={styles.eyebrow}>दर्जी समाज मैट्रिमोनी</Text>
                <Text style={styles.title}>अपना जीवनसाथी खोजें</Text>
                <Text style={styles.subtitle}>केवल स्वीकृत और सत्यापित प्रोफाइल</Text>
              </View>
              <Pressable
                style={styles.myProfileButton}
                onPress={() => router.push('/my-matrimony')}
              >
                <SymbolView
                  name={{
                    ios: 'person.crop.circle',
                    android: 'account_circle',
                    web: 'account_circle',
                  }}
                  tintColor={C.maroon}
                  size={22}
                />
                <Text style={styles.myProfileText}>मेरा प्रोफाइल</Text>
              </Pressable>
            </View>

            <Pressable style={styles.createProfileBanner} onPress={openOwnerFlow}>
              <View style={styles.createProfileIcon}>
                <SymbolView
                  name={{ ios: 'heart.circle.fill', android: 'favorite', web: 'favorite' }}
                  tintColor={C.maroon}
                  size={26}
                />
              </View>
              <View style={styles.createProfileCopy}>
                <Text style={styles.createProfileTitle}>
                  {hasAnyOwnProfile
                    ? 'अपने मैट्रिमोनी प्रोफाइल देखें'
                    : 'अपना मैट्रिमोनी प्रोफाइल बनाएँ'}
                </Text>
                <Text style={styles.createProfileText}>
                  {hasAnyOwnProfile
                    ? 'आपके अकाउंट में पहले से प्रोफाइल मौजूद है। उसे देखने, एडिट करने या स्थिति जांचने के लिए आगे बढ़ें।'
                    : 'अपनी जानकारी भरें, ड्राफ्ट सेव करें और तैयार होने पर समीक्षा के लिए भेजें।'}
                </Text>
              </View>
              <View style={styles.createProfileButton}>
                <Text style={styles.createProfileButtonText}>
                  {isLoadingMine ? 'जाँच रहे हैं' : hasAnyOwnProfile ? 'मेरे प्रोफाइल' : 'बनाएँ'}
                </Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor="#FFFFFF"
                  size={14}
                />
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChips}
              >
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
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalChips}
              >
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
              {isFetching && !isLoading ? (
                <ActivityIndicator color={C.maroon} size="small" />
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <>
                <ActivityIndicator color={C.maroon} size="large" />
                <Text style={styles.emptyTitle}>प्रोफाइल लोड हो रहे हैं...</Text>
              </>
            ) : isError ? (
              <>
                <SymbolView
                  name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                  tintColor={C.maroon}
                  size={42}
                />
                <Text style={styles.emptyTitle}>प्रोफाइल लोड नहीं हो पाए</Text>
                <Text style={styles.emptyText}>
                  API connection और EXPO_PUBLIC_API_URL check करें।
                </Text>
                <Pressable style={styles.retryButton} onPress={refetch}>
                  <Text style={styles.retryText}>फिर से कोशिश करें</Text>
                </Pressable>
              </>
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'person.2.slash', android: 'group_off', web: 'group_off' }}
                  tintColor="#B99D8C"
                  size={46}
                />
                <Text style={styles.emptyTitle}>इस फ़िल्टर में कोई प्रोफाइल नहीं मिला</Text>
                <Text style={styles.emptyText}>दूसरा समाज, आयु या वर/वधू विकल्प चुनकर देखें।</Text>
              </>
            )}
          </View>
        }
        ListFooterComponent={
          totalPages > 1 ? (
            <View style={styles.pagination}>
              <Pressable
                disabled={page <= 1 || isFetching}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                style={[styles.pageButton, (page <= 1 || isFetching) && styles.pageButtonDisabled]}
              >
                <Text style={styles.pageButtonText}>‹ पिछला</Text>
              </Pressable>

              <Text style={styles.pageInfo}>
                {page} / {totalPages}
              </Text>

              <Pressable
                disabled={page >= totalPages || isFetching}
                onPress={() => setPage((current) => current + 1)}
                style={[
                  styles.pageButton,
                  (page >= totalPages || isFetching) && styles.pageButtonDisabled,
                ]}
              >
                <Text style={styles.pageButtonText}>अगला ›</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.footerSpace} />
          )
        }
      />
    </SafeAreaView>
  );
}
