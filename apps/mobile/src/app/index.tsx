import type { ComponentProps } from 'react';
import { calculateAge } from '@/lib/profile-format';
import { useLanguageText } from '@/hooks/use-language-text';
import { C, styles } from '@/styles/index.styles';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGetCommitteesQuery } from '@/services/committee-api';
import { useGetCommunityPostsQuery } from '@/services/community-api';
import { type MatrimonyProfile, useGetMatrimonyProfilesQuery } from '@/services/matrimony-api';
import { useGetUnreadNotificationCountQuery } from '@/services/notification-api';
import { useAppSelector } from '@/store/hooks';

const GURU_BANNER = require('../../assets/images/home-guru-banner.png');
const MATRIMONY_BANNER = require('../../assets/images/home-matrimony-banner.png');
const HOME_HEADER_ICON = require('../../assets/images/icon.png');
const quickActions = [
  {
    icon: { ios: 'person.3.fill', android: 'groups', web: 'groups' } as const,
    title: 'समाज सदस्य',
    sub: '(Directory)',
    tint: '#B70F22',
    bg: '#FFF2F3',
  },
  {
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as const,
    title: 'कार्यक्रम एवं',
    sub: 'समाचार',
    tint: '#D98A00',
    bg: '#FFF9ED',
  },
  {
    icon: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' } as const,
    title: 'समाज व्यापार',
    sub: '(Business)',
    tint: '#17893D',
    bg: '#EFFAF3',
  },
  {
    icon: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' } as const,
    title: 'लेख / ज्ञान',
    sub: '(Articles)',
    tint: '#5B3180',
    bg: '#F5F1FB',
  },
  {
    icon: { ios: 'phone.fill', android: 'support_agent', web: 'support_agent' } as const,
    title: 'सहायता',
    sub: '(Help & Support)',
    tint: '#154C8C',
    bg: '#EEF7FF',
  },
];
function languageQuickTitle(title: string, text: (hi: string, en: string) => string) {
  const labels: Record<string, [string, string]> = {
    'समाज सदस्य': ['समाज सदस्य', 'Community Members'],
    'कार्यक्रम एवं': ['कार्यक्रम एवं', 'Events &'],
    'समाज व्यापार': ['समाज व्यापार', 'Community Business'],
    'लेख / ज्ञान': ['लेख / ज्ञान', 'Articles / Knowledge'],
    'सहायता': ['सहायता', 'Help'],
  };
  const pair = labels[title];
  return pair ? text(pair[0], pair[1]) : title;
}

function Icon({
  name,
  color,
  size = 24,
}: {
  name: ComponentProps<typeof SymbolView>['name'];
  color: string;
  size?: number;
}) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}
function TrustStat({
  icon,
  value,
  label,
  color = C.maroon,
}: {
  icon: ComponentProps<typeof SymbolView>['name'];
  value?: string;
  label: string;
  color?: string;
}) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconWrap}>
        <Icon name={icon} color={color} size={20} />
      </View>
      <View style={styles.statCopy}>
        {value ? <Text style={styles.statValue}>{value}</Text> : null}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

function profileName(profile: MatrimonyProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}
function profileLocation(profile: MatrimonyProfile) {
  return [profile.currentCity, profile.state].filter(Boolean).join(', ') || 'भारत';
}
function profileWork(profile: MatrimonyProfile) {
  return (
    [profile.education, profile.occupation].filter(Boolean).join(' • ') ||
    profile.companyOrBusiness ||
    'विवरण देखें'
  );
}

export default function HomeScreen() {
  const { text, apiLanguage } = useLanguageText();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data: notificationCount } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !accessToken,
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const { data: matrimonyData, isLoading: isMatrimonyLoading, isFetching: isMatrimonyFetching, refetch: refetchMatrimony } = useGetMatrimonyProfilesQuery(
    { page: 1, limit: 4 },
    { refetchOnMountOrArgChange: true },
  );
  const { data: committeeData, isLoading: isCommitteesLoading, isFetching: isCommitteesFetching, refetch: refetchCommittees } = useGetCommitteesQuery(
    { language: apiLanguage },
    { refetchOnMountOrArgChange: true },
  );
  const { data: advertisementData, isLoading: isAdvertisementsLoading, isFetching: isAdvertisementsFetching, refetch: refetchAdvertisements } = useGetCommunityPostsQuery(
    { category: 'ADVERTISEMENT', language: apiLanguage },
    { refetchOnMountOrArgChange: true },
  );
  const unreadNotificationCount = notificationCount?.unreadCount ?? 0,
    latestProfiles = matrimonyData?.items ?? [],
    approvedAds = advertisementData?.items ?? [],
    profileTotal = matrimonyData?.pagination.total,
    committeeTotal = committeeData?.pagination.total,
    advertisementTotal = advertisementData?.pagination.total;
  const isRefreshing = isMatrimonyFetching || isCommitteesFetching || isAdvertisementsFetching;
  function refreshHome() {
    void Promise.all([refetchMatrimony(), refetchCommittees(), refetchAdvertisements()]);
  }
  function openQuickAction(title: string) {
    if (title === 'कार्यक्रम एवं') {
      router.push('/community');
      return;
    }
    if (title === 'समाज व्यापार')
      router.push({ pathname: '/community', params: { category: 'ADVERTISEMENT' } });
  }
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshHome}
            tintColor={C.maroon}
            colors={[C.maroon]}
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.brandBadge}>
            <ExpoImage
              source={HOME_HEADER_ICON}
              style={styles.brandIconImage}
              contentFit="cover"
              transition={0}
            />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>{text('दामोदर प्रयास', 'Damodar Prayas')}</Text>
            <Text style={styles.brandSubtitle}>Darzi Samaj Community & Matrimony</Text>
          </View>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={
              unreadNotificationCount > 0
                ? `${unreadNotificationCount} matrimony interest requests`
                : 'Notifications'
            }
          >
            <Icon
              name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
              color={C.maroon}
              size={21}
            />
            {unreadNotificationCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel="Language and settings"
          >
            <Icon
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              color={C.maroon}
              size={21}
            />
          </Pressable>
        </View>
        <View style={styles.heroBannerWrap}>
          <ExpoImage
            source={GURU_BANNER}
            style={styles.heroBannerImage}
            contentFit="cover"
            transition={0}
          />
        </View>
        <Pressable
          style={styles.matrimonyBannerWrap}
          onPress={() => router.push('/matrimony')}
          accessibilityRole="button"
          accessibilityLabel={text('मैट्रिमोनी देखें', 'View matrimony')}
        >
          <ExpoImage
            source={MATRIMONY_BANNER}
            style={styles.matrimonyBannerImage}
            contentFit="cover"
            transition={0}
          />
        </Pressable>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon
              name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
              color={C.maroon}
              size={21}
            />
            <Text style={styles.sectionTitle}>{text('नए Matrimony Profiles', 'New Matrimony Profiles')}</Text>
          </View>
          <Pressable onPress={() => router.push('/matrimony')}>
            <Text style={styles.viewAll}>{text('सभी देखें →', 'View All →')}</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.profileRow}
        >
          {latestProfiles.map((profile) => {
            const photo = profile.photos[0]?.url,
              age = calculateAge(profile.dateOfBirth);
            return (
              <Pressable
                style={styles.profileCard}
                key={profile.id}
                onPress={() =>
                  accessToken
                    ? router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })
                    : router.push({ pathname: '/auth', params: { next: `/matrimony-profile?id=${profile.id}` } })
                }
              >
                {photo ? (
                  <ExpoImage source={{ uri: photo }} style={styles.profilePhoto} contentFit="cover" cachePolicy="none" />
                ) : (
                  <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
                    <Icon
                      name={{
                        ios: 'person.crop.circle.fill',
                        android: 'account_circle',
                        web: 'account_circle',
                      }}
                      color="#C7AFA1"
                      size={54}
                    />
                  </View>
                )}
                <View style={styles.verified}>
                  <Icon
                    name={{ ios: 'checkmark.circle.fill', android: 'verified', web: 'verified' }}
                    color={C.green}
                    size={12}
                  />
                  <Text style={styles.verifiedText}>{text('सत्यापित', 'Verified')}</Text>
                </View>
                <View style={styles.profileInfo}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {profileName(profile)}, {age}
                    </Text>
                    {profile.isFeatured ? (
                      <Icon
                        name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                        color={C.gold}
                        size={15}
                      />
                    ) : null}
                  </View>
                  <Text style={styles.profileMeta} numberOfLines={1}>
                    {profileLocation(profile)}
                  </Text>
                  <Text style={styles.profileMeta} numberOfLines={1}>
                    {profileWork(profile)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {isMatrimonyLoading ? (
            <View style={styles.profileEmptyCard}>
              <Icon
                name={{ ios: 'heart.circle.fill', android: 'favorite', web: 'favorite' }}
                color={C.maroon}
                size={25}
              />
              <Text style={styles.profileEmptyTitle}>{text('प्रोफाइल लोड हो रहे हैं...', 'Loading profiles...')}</Text>
            </View>
          ) : latestProfiles.length === 0 ? (
            <View style={styles.profileEmptyCard}>
              <Icon
                name={{
                  ios: 'checkmark.shield.fill',
                  android: 'verified_user',
                  web: 'verified_user',
                }}
                color={C.gold}
                size={25}
              />
              <Text style={styles.profileEmptyTitle}>{text('अभी कोई स्वीकृत प्रोफाइल नहीं', 'No approved profiles yet')}</Text>
              <Text style={styles.profileEmptyText}>
                {text('Admin approval के बाद नए प्रोफाइल यहाँ दिखाई देंगे।', 'New profiles will appear here after admin approval.')}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.adsSectionHeader}>
          <View style={styles.adsHeaderTop}>
            <View style={styles.adsTitleRow}>
              <Icon
                name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
                color={C.maroon}
                size={24}
              />
              <Text style={styles.adsTitle}>{text('समाज व्यापार', 'Community Business')}</Text>
              <Text style={styles.adsEnglish}>Free Classifieds</Text>
            </View>
            <Pressable
              onPress={() =>
                router.push({ pathname: '/community', params: { category: 'ADVERTISEMENT' } })
              }
            >
              <Text style={styles.viewAll}>{text('सभी देखें →', 'View All →')}</Text>
            </Pressable>
          </View>
          <View style={styles.adsActionRow}>
            <Text style={styles.adsSubtitle}>{text('अपने व्यवसाय, सेवा या ऑफर का विज्ञापन डालें', 'Post an advertisement for your business, service or offer')}</Text>
            <Pressable
              style={styles.postAdButton}
              onPress={() =>
                router.push({
                  pathname: '/community-submit',
                  params: { category: 'ADVERTISEMENT' },
                })
              }
            >
              <Text style={styles.postAdButtonText}>{text('+ विज्ञापन डालें', '+ Post ad')}</Text>
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>FREE</Text>
              </View>
            </Pressable>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.adsRow}
        >
          {approvedAds.slice(0, 6).map((ad) => {
            const translation =
              ad.translations.find((item) => item.language === 'HI') ?? ad.translations[0];
            return (
              <Pressable
                key={ad.id}
                style={styles.adCard}
                onPress={() => router.push({ pathname: '/community-post', params: { id: ad.id } })}
              >
                {ad.bannerUrl ? (
                  <ExpoImage source={{ uri: ad.bannerUrl }} style={styles.adImage} contentFit="cover" />
                ) : (
                  <View style={styles.adImagePlaceholder}>
                    <Icon
                      name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
                      color={C.green}
                      size={24}
                    />
                  </View>
                )}
                <View style={styles.adBody}>
                  <Text style={styles.adTitle} numberOfLines={1}>
                    {translation?.title ?? text('समाज विज्ञापन', 'Community advertisement')}
                  </Text>
                  <Text style={styles.adMeta} numberOfLines={2}>
                    {translation?.details ?? text('विवरण उपलब्ध नहीं', 'Details unavailable')}
                  </Text>
                  <View style={styles.adFooter}>
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>Approved</Text>
                    </View>
                    <Text style={styles.adCity} numberOfLines={1}>
                      📍 {ad.location ?? 'समाज'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {!isAdvertisementsLoading && approvedAds.length === 0 ? (
            <View style={styles.emptyAdCard}>
              <Icon
                name={{
                  ios: 'checkmark.shield.fill',
                  android: 'verified_user',
                  web: 'verified_user',
                }}
                color={C.gold}
                size={24}
              />
              <View style={styles.emptyAdCopy}>
                <Text style={styles.emptyAdTitle}>{text('अभी कोई स्वीकृत विज्ञापन नहीं', 'No approved advertisements yet')}</Text>
                <Text style={styles.emptyAdText}>
                  {text('Admin approval के बाद विज्ञापन यहाँ दिखाई देंगे।', 'Advertisements will appear here after admin approval.')}
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.quickRow}>
          {quickActions.map((item) => { const title = languageQuickTitle(item.title, text); return (
            <Pressable
              key={item.title}
              style={[styles.quickCard, { backgroundColor: item.bg }]}
              onPress={() => openQuickAction(item.title)}
            >
              <View style={styles.quickIcon}>
                <Icon name={item.icon} color={item.tint} size={26} />
              </View>
              <Text style={styles.quickTitle} numberOfLines={2}>
                {title}
              </Text>
              <Text style={styles.quickSub} numberOfLines={1}>
                {item.sub}
              </Text>
            </Pressable>); })}
        </View>
        <View style={styles.statsStrip}>
          <TrustStat
            icon={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            value={isMatrimonyLoading ? '…' : String(profileTotal ?? 0)}
            label={text('उपलब्ध प्रोफाइल', 'Available profiles')}
          />
          <View style={styles.statDivider} />
          <TrustStat
            icon={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }}
            value={isCommitteesLoading ? '…' : String(committeeTotal ?? 0)}
            label={text('समितियाँ', 'Committees')}
          />
          <View style={styles.statDivider} />
          <TrustStat
            icon={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
            value={isAdvertisementsLoading ? '…' : String(advertisementTotal ?? 0)}
            label={text('स्वीकृत विज्ञापन', 'Approved ads')}
          />
          <View style={styles.statDivider} />
          <TrustStat
            icon={{ ios: 'star.fill', android: 'star', web: 'star' }}
            label={text('एक मजबूत समाज के लिए साथ', 'Together for a stronger community')}
            color={C.gold}
          />
        </View>
        <View style={styles.closingBanner}>
          <View style={styles.closingIcon}>
            <Icon
              name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }}
              color={C.maroon}
              size={34}
            />
          </View>
          <View style={styles.closingCopy}>
            <Text style={styles.closingQuote}>
              {text('“मिलकर बढ़ें, जुड़े रहें, समाज को और मजबूत बनाएं”', '“Grow together, stay connected, strengthen our community”')}
            </Text>
            <View style={styles.goldLine} />
          </View>
          <View style={styles.joinButton}>
            <Text style={styles.joinTitle}>{text('हमारे समाज से जुड़ें', 'Join Our Community')}</Text>
            <Text style={styles.joinSub}>{text('क्योंकि समाज मायने रखता है', 'Because Community Matters')}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
