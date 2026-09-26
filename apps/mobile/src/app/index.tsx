import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_KEY } from './onboarding';
import { calculateAge } from '@/lib/profile-format';
import { useLanguageText } from '@/hooks/use-language-text';
import { C, styles } from '@/styles/index.styles';
import { useGetCommunityPostsQuery } from '@/services/community-api';
import { useGetMatrimonyProfilesQuery } from '@/services/matrimony-api';
import { useGetUnreadNotificationCountQuery } from '@/services/notification-api';
import { useAppSelector } from '@/store/hooks';

const GURU_BANNER = require('../../assets/images/home-guru-banner.png');
const COUPLE = require('../../assets/images/home-matrimony-couple.webp');
const LOGO = require('../../assets/images/icon.png');
const actions = [
  {
    category: 'NEWS',
    hi: 'समाचार',
    en: 'News',
    descriptionHi: 'समाज की ताज़ा खबरें',
    descriptionEn: 'Latest community news',
    bg: '#FFF0F2',
    border: '#F3CDD3',
    icon: { ios: 'newspaper', android: 'newspaper', web: 'newspaper' },
  },
  {
    category: 'ADVERTISEMENT',
    hi: 'विज्ञापन',
    en: 'Ads',
    descriptionHi: 'व्यापार और सेवाएँ',
    descriptionEn: 'Businesses and services',
    bg: '#FFF8E8',
    border: '#F2D9A8',
    icon: { ios: 'megaphone', android: 'campaign', web: 'campaign' },
  },
  {
    category: 'EVENT',
    hi: 'समारोह',
    en: 'Events',
    descriptionHi: 'आने वाले आयोजन',
    descriptionEn: 'Upcoming events',
    bg: '#FFF1E8',
    border: '#F3D4BD',
    icon: { ios: 'calendar', android: 'event', web: 'event' },
  },
  {
    category: 'OBITUARY',
    hi: 'शोक संदेश',
    en: 'Obituaries',
    descriptionHi: 'श्रद्धांजलि और शोक सूचना',
    descriptionEn: 'Tributes and notices',
    bg: '#F5F0FC',
    border: '#DDD0EF',
    icon: { ios: 'flame', android: 'local_florist', web: 'local_florist' },
  },
] as const;

function Icon({
  name,
  size = 24,
  color = C.maroon,
}: {
  name: ComponentProps<typeof SymbolView>['name'];
  size?: number;
  color?: string;
}) {
  return <SymbolView name={name} size={size} tintColor={color} />;
}

export default function HomeScreen() {
  const { text, apiLanguage } = useLanguageText();
  const { width } = useWindowDimensions();
  const profileWidth = Math.min(220, Math.max(156, (width - 44) / 2));
  const adWidth = Math.min(440, width - 44);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(ONBOARDING_KEY)
      .then((value) => {
        if (!active) return;
        if (value !== '1') router.replace('/onboarding');
        setOnboardingChecked(true);
      })
      .catch(() => {
        if (active) setOnboardingChecked(true);
      });
    return () => {
      active = false;
    };
  }, []);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data: notificationCount } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !accessToken,
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const profiles = useGetMatrimonyProfilesQuery(
    { page: 1, limit: 4 },
    { refetchOnMountOrArgChange: true },
  );
  const ads = useGetCommunityPostsQuery(
    { category: 'ADVERTISEMENT', language: apiLanguage },
    { refetchOnMountOrArgChange: true },
  );
  const unread = notificationCount?.unreadCount ?? 0;
  const openAds = () =>
    router.push({ pathname: '/community', params: { category: 'ADVERTISEMENT' } });
  if (!onboardingChecked) return <View style={styles.safeArea} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={profiles.isFetching || ads.isFetching}
            onRefresh={() => {
              void profiles.refetch();
              void ads.refetch();
            }}
            tintColor={C.maroon}
            colors={[C.maroon]}
          />
        }
      >
        <View style={styles.header}>
          <Image source={LOGO} style={styles.brandIcon} contentFit="cover" />
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>{text('दामोदर प्रयास', 'Damodar Prayas')}</Text>
            <Text style={styles.brandSubtitle}>
              {text('रिश्तों से समाज तक', 'From relationships to community')}
            </Text>
          </View>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={text('सूचनाएँ', 'Notifications')}
          >
            <Icon
              name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
              size={23}
            />
            {unread > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push('/settings')}
            accessibilityRole="button"
            accessibilityLabel={text('भाषा और सेटिंग्स', 'Language and settings')}
          >
            <Icon name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} size={23} />
          </Pressable>
        </View>
        <View style={styles.heroBannerWrap}>
          <Image source={GURU_BANNER} style={styles.heroBannerImage} contentFit="cover" />
        </View>
        <Pressable
          style={styles.matrimonyBanner}
          onPress={() => router.push('/matrimony')}
          accessibilityRole="button"
          accessibilityLabel={text('वैवाहिक प्रोफाइल देखें', 'Browse matrimony profiles')}
        >
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>
              {text('अपने जीवनसाथी से मिलें', 'Meet your life partner')}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {text('अपने समाज में रिश्तों की नई शुरुआत', 'A new beginning within your community')}
            </Text>
            <View style={styles.bannerButton}>
              <Text style={styles.buttonText}>{text('प्रोफाइल देखें →', 'View profiles →')}</Text>
            </View>
          </View>
          <Image
            source={COUPLE}
            style={styles.bannerArtwork}
            contentFit="cover"
            contentPosition="center"
          />
        </Pressable>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} />
            <Text style={styles.sectionTitle}>
              {text('नए वैवाहिक प्रोफाइल', 'New matrimony profiles')}
            </Text>
          </View>
          <Pressable
            style={styles.viewAllButton}
            onPress={() => router.push('/matrimony')}
            accessibilityRole="button"
          >
            <Text style={styles.viewAll}>{text('सभी देखें →', 'View all →')}</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {profiles.data?.items.map((profile) => {
            const photo =
              profile.photos.find((item) => item.isPrimary)?.url ?? profile.photos[0]?.url;
            const name = [profile.firstName, profile.middleName, profile.lastName]
              .filter(Boolean)
              .join(' ');
            return (
              <Pressable
                key={profile.id}
                style={[styles.profileCard, { width: profileWidth }]}
                accessibilityRole="button"
                accessibilityLabel={`${text('प्रोफाइल देखें', 'View profile')}: ${name}`}
                onPress={() =>
                  accessToken
                    ? router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })
                    : router.push({
                        pathname: '/auth',
                        params: { next: `/matrimony-profile?id=${profile.id}` },
                      })
                }
              >
                {photo ? (
                  <Image source={photo} style={styles.profilePhoto} contentFit="cover" />
                ) : (
                  <View style={[styles.profilePhoto, styles.placeholder]}>
                    <Icon
                      name={{
                        ios: 'person.crop.circle',
                        android: 'account_circle',
                        web: 'account_circle',
                      }}
                      size={64}
                      color="#BD8F88"
                    />
                    <Text style={styles.photoLabel}>
                      {text('फोटो उपलब्ध नहीं', 'No photo available')}
                    </Text>
                  </View>
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName} numberOfLines={2}>
                    {name}, {calculateAge(profile.dateOfBirth)}
                  </Text>
                  <Text style={styles.profileMeta} numberOfLines={2}>
                    {[profile.currentCity, profile.education].filter(Boolean).join(' • ') ||
                      text('विवरण उपलब्ध नहीं', 'Details unavailable')}
                  </Text>
                  <Text style={styles.profileMeta} numberOfLines={2}>
                    {profile.occupation ||
                      profile.companyOrBusiness ||
                      text('पेशा उपलब्ध नहीं', 'Occupation not provided')}
                  </Text>
                  <View style={styles.profileButton}>
                    <Text style={styles.buttonText}>
                      {text('प्रोफाइल देखें →', 'View profile →')}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {!profiles.data?.items.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {profiles.isLoading
                  ? text('प्रोफाइल लोड हो रहे हैं…', 'Loading profiles…')
                  : profiles.isError
                    ? text('प्रोफाइल लोड नहीं हुए', 'Could not load profiles')
                    : text('अभी कोई स्वीकृत प्रोफाइल नहीं', 'No approved profiles yet')}
              </Text>
              <Text style={styles.emptyText}>
                {text('ताज़ा जानकारी के लिए नीचे खींचें।', 'Pull down to refresh.')}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} />
            <Text style={styles.sectionTitle}>{text('समाज व्यापार', 'Community business')}</Text>
          </View>
          <Pressable style={styles.viewAllButton} onPress={openAds} accessibilityRole="button">
            <Text style={styles.viewAll}>{text('सभी देखें →', 'View all →')}</Text>
          </Pressable>
        </View>
        <View style={styles.adsActions}>
          <Text style={styles.adsSubtitle}>
            {text('अपने समाज के व्यापार को बढ़ावा दें', 'Support businesses in your community')}
          </Text>
          <Pressable
            style={styles.postAdButton}
            onPress={() =>
              router.push({ pathname: '/community-submit', params: { category: 'ADVERTISEMENT' } })
            }
            accessibilityRole="button"
          >
            <Text style={styles.postAdText}>{text('+ विज्ञापन जोड़ें', '+ Post an ad')}</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {ads.data?.items.slice(0, 6).map((ad) => {
            const translation =
              ad.translations.find((item) => item.language === apiLanguage) ?? ad.translations[0];
            return (
              <Pressable
                key={ad.id}
                style={[styles.adCard, { width: adWidth }]}
                onPress={() => router.push({ pathname: '/community-post', params: { id: ad.id } })}
                accessibilityRole="button"
              >
                {ad.bannerUrl ? (
                  <Image source={ad.bannerUrl} style={styles.adImage} contentFit="cover" />
                ) : (
                  <View style={[styles.adImage, styles.adPlaceholder]}>
                    <Icon
                      name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
                      color="#28754A"
                      size={38}
                    />
                  </View>
                )}
                <View style={styles.adBody}>
                  <Text style={styles.adCategory}>
                    {text('व्यापार और सेवाएँ', 'Business & services')}
                  </Text>
                  <Text style={styles.adTitle} numberOfLines={2}>
                    {translation?.title ?? text('समाज विज्ञापन', 'Community advertisement')}
                  </Text>
                  <Text style={styles.adMeta} numberOfLines={2}>
                    {translation?.details ?? text('विवरण उपलब्ध नहीं', 'Details unavailable')}
                  </Text>
                  {ad.location ? (
                    <Text style={styles.adLocation} numberOfLines={1}>
                      📍 {ad.location}
                    </Text>
                  ) : null}
                  <Text style={styles.adLink}>{text('विवरण देखें →', 'View details →')}</Text>
                </View>
              </Pressable>
            );
          })}
          {!ads.data?.items.length ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                {ads.isLoading
                  ? text('विज्ञापन लोड हो रहे हैं…', 'Loading ads…')
                  : ads.isError
                    ? text('विज्ञापन लोड नहीं हुए', 'Could not load ads')
                    : text('अभी कोई विज्ञापन नहीं', 'No advertisements yet')}
              </Text>
              <Text style={styles.emptyText}>
                {text('अपने व्यापार का विज्ञापन जोड़ें।', 'Add your business advertisement.')}
              </Text>
            </View>
          ) : null}
        </ScrollView>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} />
            <Text style={styles.sectionTitle}>
              {text('समाज से जुड़ें', 'Connect with your community')}
            </Text>
          </View>
        </View>
        <View style={styles.actionGrid}>
          {actions.map((action) => (
            <Pressable
              key={action.category}
              style={[
                styles.actionCard,
                { backgroundColor: action.bg, borderColor: action.border },
              ]}
              onPress={() =>
                router.push({ pathname: '/community', params: { category: action.category } })
              }
              accessibilityRole="button"
            >
              <View style={styles.actionTop}>
                <Icon name={action.icon} size={36} />
                <Text style={styles.arrow}>›</Text>
              </View>
              <Text style={styles.actionTitle}>{text(action.hi, action.en)}</Text>
              <Text style={styles.actionDescription}>
                {text(action.descriptionHi, action.descriptionEn)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable
          style={styles.committeeBanner}
          onPress={() => router.push('/samiti')}
          accessibilityRole="button"
        >
          <Icon name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} size={42} />
          <View style={styles.committeeCopy}>
            <Text style={styles.actionTitle}>{text('समितियाँ', 'Committees')}</Text>
            <Text style={styles.actionDescription}>
              {text('अपने क्षेत्र की समिति से जुड़ें', 'Connect with your local committee')}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
