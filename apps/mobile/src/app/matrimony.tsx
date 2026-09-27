import { svgImage } from '@/lib/svg-image';
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

const vector = svgImage;
const FLORAL = vector(
  '<g stroke="#C69649" stroke-width="1.1"><path d="M95 5Q40 30 15 95M82 12Q55 0 55 26Q72 30 82 12ZM65 28Q35 14 38 44Q56 44 65 28ZM46 49Q15 39 20 66Q38 66 46 49ZM31 70Q4 68 8 90Q23 88 31 70ZM75 20Q95 22 88 42Q69 44 75 20ZM57 39Q81 44 70 62Q50 60 57 39ZM39 62Q64 66 53 83Q34 82 39 62Z"/></g>',
);
const HEARTS = vector(
  '<path d="M43 30C20 4 0 36 18 52L46 77L66 57" stroke="#790D21" stroke-width="5" stroke-linecap="round"/><path d="M43 30C57 10 77 23 71 41" stroke="#790D21" stroke-width="5"/><path d="M66 47C85 27 104 51 86 68L66 86L45 66C28 48 49 29 66 47Z" stroke="#BF8B37" stroke-width="5"/><path d="M78 10V2M87 16L94 9" stroke="#BF8B37" stroke-width="3"/>',
);

const genderFilters: { label: string; en: string; value?: MatrimonyGender }[] = [
  { label: 'सभी', en: 'All' },
  { label: 'वर', en: 'Groom', value: 'MALE' },
  { label: 'वधू', en: 'Bride', value: 'FEMALE' },
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
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ProfileCard({ profile }: { profile: MatrimonyProfile }) {
  const { text } = useLanguageText();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const photo = profile.photos.find((item) => item.isPrimary)?.url ?? profile.photos[0]?.url;
  const age = calculateAge(profile.dateOfBirth);
  const location = [profile.currentCity, profile.state].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${text('प्रोफाइल देखें', 'View profile')}: ${fullName(profile)}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() =>
        accessToken
          ? router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })
          : router.push({
              pathname: '/auth',
              params: { next: `/matrimony-profile?id=${profile.id}` },
            })
      }
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

        {profile.isFeatured ? (
          <View style={styles.featuredBadge}>
            <SymbolView
              name={{ ios: 'star.fill', android: 'star', web: 'star' }}
              tintColor="#FFFFFF"
              size={10}
            />
            <Text style={styles.featuredText}>{text('विशेष', 'Featured')}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.name} numberOfLines={2}>
          {fullName(profile)}, {age}
        </Text>
        <View style={styles.detailRow}>
          <SymbolView
            name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
            size={14}
            tintColor={C.maroon}
          />
          <Text style={styles.meta} numberOfLines={2}>
            {location || text('स्थान उपलब्ध नहीं', 'Location unavailable')}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <SymbolView
            name={{ ios: 'graduationcap', android: 'school', web: 'school' }}
            size={14}
            tintColor={C.maroon}
          />
          <Text style={styles.meta} numberOfLines={2}>
            {profile.education || profile.occupation || text('विवरण देखें', 'View details')}
          </Text>
        </View>
        <View style={styles.viewProfileButton}>
          <Text style={styles.viewProfileText}>{text('प्रोफाइल देखें →', 'View profile →')}</Text>
        </View>
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
              <Image
                pointerEvents="none"
                accessible={false}
                source={FLORAL}
                style={styles.headerFloral}
              />
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>
                  {text('दर्जी समाज मैट्रिमोनी', 'Darzi Samaj Matrimony')}
                </Text>
                <Text style={styles.title}>
                  {text('अपना जीवनसाथी खोजें', 'Find your life partner')}
                </Text>
                <Text style={styles.subtitle}>
                  {text(
                    'अपने समाज में रिश्तों की नई शुरुआत',
                    'A new beginning within your community',
                  )}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
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

            <Pressable
              accessibilityRole="button"
              disabled={isLoadingMine}
              style={styles.createProfileBanner}
              onPress={openOwnerFlow}
            >
              <Image
                pointerEvents="none"
                accessible={false}
                source={FLORAL}
                style={styles.bannerFloral}
              />
              <View style={styles.createProfileIcon}>
                <Image accessible={false} source={HEARTS} style={styles.hearts} />
              </View>
              <View style={styles.createProfileCopy}>
                <Text style={styles.createProfileTitle}>
                  {hasAnyOwnProfile
                    ? text('अपने मैट्रिमोनी प्रोफाइल देखें', 'View your matrimony profiles')
                    : text('अपना मैट्रिमोनी प्रोफाइल बनाएँ', 'Create your matrimony profile')}
                </Text>
                <Text style={styles.createProfileText}>
                  {hasAnyOwnProfile
                    ? text('प्रोफाइल बदलें या स्थिति देखें', 'Edit profiles or check their status')
                    : text('रिश्तों की नई शुरुआत करें', 'Begin your journey together')}
                </Text>
              </View>
              <View style={styles.createProfileButton}>
                <Text style={styles.createProfileButtonText}>
                  {isLoadingMine
                    ? text('जाँच रहे हैं', 'Checking')
                    : hasAnyOwnProfile
                      ? text('देखें', 'View')
                      : text('बनाएँ', 'Create')}
                </Text>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor="#FFFFFF"
                  size={14}
                />
              </View>
            </Pressable>

            <View style={styles.filterBlock}>
              <Text style={styles.filterLabel}>
                {text('मैं देखना चाहता/चाहती हूँ', 'I want to see')}
              </Text>
              <View style={styles.genderRow}>
                {genderFilters.map((item) => (
                  <FilterChip
                    key={item.label}
                    label={text(item.label, item.en)}
                    active={gender === item.value}
                    onPress={() => changeGender(item.value)}
                  />
                ))}
              </View>
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
                      label={index === 0 ? text('सभी आयु', 'All ages') : item.label}
                      active={ageIndex === index}
                      onPress={() => changeAge(index)}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
            <View style={styles.resultsRow}>
              <View style={styles.resultRule} />
              <Text accessible={false} style={styles.ornament}>
                ◇
              </Text>
              <View style={styles.resultsCopy}>
                <Text style={styles.resultsTitle}>
                  {text('मैट्रिमोनी प्रोफाइल', 'Matrimony profiles')}
                </Text>
                <Text style={styles.resultsCount}>
                  {total} {text('प्रोफाइल मिले', 'profiles found')}
                </Text>
              </View>
              <Text accessible={false} style={styles.ornament}>
                ◇
              </Text>
              <View style={styles.resultRule} />
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
                <Text style={styles.emptyTitle}>
                  {text('प्रोफाइल लोड हो रहे हैं...', 'Loading profiles...')}
                </Text>
              </>
            ) : isError ? (
              <>
                <SymbolView
                  name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                  tintColor={C.maroon}
                  size={42}
                />
                <Text style={styles.emptyTitle}>
                  {text('प्रोफाइल लोड नहीं हो पाए', 'Could not load profiles')}
                </Text>
                <Text style={styles.emptyText}>
                  {text(
                    'कनेक्शन जाँचें और फिर कोशिश करें।',
                    'Check your connection and try again.',
                  )}
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
                <Text style={styles.emptyTitle}>
                  {text(
                    'इस फ़िल्टर में कोई प्रोफाइल नहीं मिला',
                    'No profiles found for these filters',
                  )}
                </Text>
                <Text style={styles.emptyText}>
                  {text(
                    'दूसरी आयु या वर/वधू विकल्प चुनकर देखें।',
                    'Try another age or bride/groom filter.',
                  )}
                </Text>
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
