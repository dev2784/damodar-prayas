import { calculateAge } from '@/lib/profile-format';
import { C, styles } from '@/styles/matrimony.styles';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type MatrimonyGender,
  type MatrimonyProfile,
  useGetMatrimonyProfilesQuery,
  useGetMyMatrimonyProfilesQuery,
} from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';
import { useLanguageText } from '@/hooks/use-language-text';

const genderFilters: { label: string; value?: MatrimonyGender }[] = [
  { label: 'सभी' },
  { label: 'वर', value: 'MALE' },
  { label: 'वधू', value: 'FEMALE' },
];

/* Future community-category filter. Re-enable when Darzi/Pipa/Namdev segmentation is needed.
const categoryFilters = [
  { label: 'सभी समाज' },
  { label: 'जूना गुजराती', value: 'JUNA_GUJARATI' },
  { label: 'पीपा', value: 'PIPA' },
  { label: 'नामदेव', value: 'NAMDEV' },
];
*/

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
  const { text } = useLanguageText();
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
          <Text style={styles.verifiedText}>{text('सत्यापित', 'Verified')}</Text>
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
          {location || text('भारत', 'India')}
        </Text>
        <Text style={styles.work} numberOfLines={1}>
          {profile.education || profile.occupation || text('विवरण देखें', 'View details')}
        </Text>
      </View>
    </Pressable>
  );
}

export default function MatrimonyScreen() {
  const { text } = useLanguageText();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [gender, setGender] = useState<MatrimonyGender | undefined>();
  const [ageIndex, setAgeIndex] = useState(0);
  const [page, setPage] = useState(1);

  const selectedAge = ageFilters[ageIndex];
  const queryArgs = useMemo(
    () => ({
      gender,
      minAge: selectedAge.minAge,
      maxAge: selectedAge.maxAge,
      page,
      limit: 20,
    }),
    [gender, page, selectedAge.maxAge, selectedAge.minAge],
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
                <Text style={styles.eyebrow}>{text('दर्जी समाज मैट्रिमोनी', 'Darzi Samaj Matrimony')}</Text>
                <Text style={styles.title}>{text('अपना जीवनसाथी खोजें', 'Find your life partner')}</Text>
                <Text style={styles.subtitle}>{text('केवल स्वीकृत और सत्यापित प्रोफाइल', 'Only approved and verified profiles')}</Text>
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
                <Text style={styles.myProfileText}>{text('मेरा प्रोफाइल', 'My profile')}</Text>
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
                    ? text('अपने मैट्रिमोनी प्रोफाइल देखें', 'View your matrimony profiles')
                    : text('अपना मैट्रिमोनी प्रोफाइल बनाएँ', 'Create your matrimony profile')}
                </Text>
                <Text style={styles.createProfileText}>
                  {hasAnyOwnProfile
                    ? text('आपके अकाउंट में पहले से प्रोफाइल मौजूद है। उसे देखने, एडिट करने या स्थिति जांचने के लिए आगे बढ़ें।', 'A profile already exists in your account. Continue to view, edit or check its status.')
                    : text('अपनी जानकारी भरें, ड्राफ्ट सेव करें और तैयार होने पर समीक्षा के लिए भेजें।', 'Fill in your details, save a draft and submit it for review when ready.')}
                </Text>
              </View>
              <View style={styles.createProfileButton}>
                <Text style={styles.createProfileButtonText}>
                  {isLoadingMine ? text('जाँच रहे हैं', 'Checking') : hasAnyOwnProfile ? text('मेरे प्रोफाइल', 'My profiles') : text('बनाएँ', 'Create')}
                </Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor="#FFFFFF"
                  size={14}
                />
              </View>
            </Pressable>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>{text('मैं देखना चाहता/चाहती हूँ', 'I want to see')}</Text>
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

            {/* Community category filter hidden for now. Keep category support in API for future use. */}
            <View style={styles.filterBlockCompact}>
              <Text style={styles.filterLabel}>{text('आयु', 'Age')}</Text>
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
                <Text style={styles.resultsTitle}>{text('मैट्रिमोनी प्रोफाइल', 'Matrimony profiles')}</Text>
                <Text style={styles.resultsCount}>{total} {text('प्रोफाइल मिले', 'profiles found')}</Text>
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
                <Text style={styles.emptyTitle}>{text('प्रोफाइल लोड हो रहे हैं...', 'Loading profiles...')}</Text>
              </>
            ) : isError ? (
              <>
                <SymbolView
                  name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                  tintColor={C.maroon}
                  size={42}
                />
                <Text style={styles.emptyTitle}>{text('प्रोफाइल लोड नहीं हो पाए', 'Could not load profiles')}</Text>
                <Text style={styles.emptyText}>
                  API connection और EXPO_PUBLIC_API_URL check करें।
                </Text>
                <Pressable style={styles.retryButton} onPress={refetch}>
                  <Text style={styles.retryText}>{text('फिर से कोशिश करें', 'Try again')}</Text>
                </Pressable>
              </>
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'person.2.slash', android: 'group_off', web: 'group_off' }}
                  tintColor="#B99D8C"
                  size={46}
                />
                <Text style={styles.emptyTitle}>{text('इस फ़िल्टर में कोई प्रोफाइल नहीं मिला', 'No profiles found for these filters')}</Text>
                <Text style={styles.emptyText}>{text('दूसरा समाज, आयु या वर/वधू विकल्प चुनकर देखें।', 'Try another community, age or bride/groom filter.')}</Text>
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
                <Text style={styles.pageButtonText}>{text('‹ पिछला', '‹ Previous')}</Text>
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
                <Text style={styles.pageButtonText}>{text('अगला ›', 'Next ›')}</Text>
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
