import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGetCommitteesQuery } from '@/services/committee-api';
import { useGetCommunityPostsQuery } from '@/services/community-api';
import {
  type MatrimonyProfile,
  useGetMatrimonyProfilesQuery,
} from '@/services/matrimony-api';
import { useGetUnreadNotificationCountQuery } from '@/services/notification-api';
import { useAppSelector } from '@/store/hooks';

const C = {
  bg: '#FFF9F1',
  paper: '#FFFDF9',
  maroon: '#A30D1E',
  maroonDark: '#7D0A16',
  gold: '#D79A25',
  text: '#1F1A18',
  muted: '#6F6870',
  line: '#E8D7C3',
  green: '#0BAA67',
};

const GURU_BANNER = require('../../assets/images/home-guru-banner.jpg');
const MATRIMONY_BANNER = require('../../assets/images/home-matrimony-banner.jpg');
const HEADER_LOGO = require('../../assets/images/home-guru-banner.jpg');

const quickActions = [
  { icon: { ios: 'person.3.fill', android: 'groups', web: 'groups' } as const, title: 'समाज सदस्य', sub: '(Directory)', tint: '#B70F22', bg: '#FFF2F3' },
  { icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as const, title: 'कार्यक्रम एवं', sub: 'समाचार', tint: '#D98A00', bg: '#FFF9ED' },
  { icon: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' } as const, title: 'समाज व्यापार', sub: '(Business)', tint: '#17893D', bg: '#EFFAF3' },
  { icon: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' } as const, title: 'लेख / ज्ञान', sub: '(Articles)', tint: '#5B3180', bg: '#F5F1FB' },
  { icon: { ios: 'phone.fill', android: 'support_agent', web: 'support_agent' } as const, title: 'सहायता', sub: '(Help & Support)', tint: '#154C8C', bg: '#EEF7FF' },
];

function Icon({ name, color, size = 24 }: { name: { ios: any; android: any; web: any }; color: string; size?: number }) {
  return <SymbolView name={name} tintColor={color} size={size} />;
}

function TrustStat({ icon, value, label, color = C.maroon }: { icon: { ios: any; android: any; web: any }; value?: string; label: string; color?: string }) {
  return (
    <View style={styles.statItem}>
      <View style={styles.statIconWrap}><Icon name={icon} color={color} size={20} /></View>
      <View style={styles.statCopy}>
        {value ? <Text style={styles.statValue}>{value}</Text> : null}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );
}

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

function profileName(profile: MatrimonyProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}

function profileLocation(profile: MatrimonyProfile) {
  return [profile.currentCity, profile.state].filter(Boolean).join(', ') || 'भारत';
}

function profileWork(profile: MatrimonyProfile) {
  const educationAndWork = [profile.education, profile.occupation].filter(Boolean).join(' • ');
  return educationAndWork || profile.companyOrBusiness || 'विवरण देखें';
}

export default function HomeScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data: notificationCount } = useGetUnreadNotificationCountQuery(undefined, {
    skip: !accessToken,
    pollingInterval: 10000,
    refetchOnMountOrArgChange: true,
  });
  const { data: matrimonyData, isLoading: isMatrimonyLoading } = useGetMatrimonyProfilesQuery(
    { page: 1, limit: 4 },
    { refetchOnMountOrArgChange: true },
  );
  const { data: committeeData, isLoading: isCommitteesLoading } = useGetCommitteesQuery(
    { language: 'HI' },
    { refetchOnMountOrArgChange: true },
  );
  const { data: advertisementData, isLoading: isAdvertisementsLoading } = useGetCommunityPostsQuery(
    {
      category: 'ADVERTISEMENT',
      language: 'HI',
    },
    { refetchOnMountOrArgChange: true },
  );

  const unreadNotificationCount = notificationCount?.unreadCount ?? 0;
  const latestProfiles = matrimonyData?.items ?? [];
  const approvedAds = advertisementData?.items ?? [];
  const profileTotal = matrimonyData?.pagination.total;
  const committeeTotal = committeeData?.pagination.total;
  const advertisementTotal = advertisementData?.pagination.total;

  function openQuickAction(title: string) {
    if (title === 'कार्यक्रम एवं') {
      router.push('/community');
      return;
    }
    if (title === 'समाज व्यापार') {
      router.push({ pathname: '/community', params: { category: 'ADVERTISEMENT' } });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandMark}>
            <ExpoImage source={HEADER_LOGO} style={styles.brandLogoImage} contentFit="cover" contentPosition="left center" />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brand}>दामोदर प्रयास</Text>
            <Text style={styles.brandSub}>दर्जी समाज समुदाय एवं वैवाहिक</Text>
          </View>
          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push('/notifications')}
            accessibilityRole="button"
            accessibilityLabel={unreadNotificationCount > 0 ? `${unreadNotificationCount} matrimony interest requests` : 'Notifications'}>
            <Icon name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} color={C.maroon} size={21} />
            {unreadNotificationCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</Text>
              </View>
            ) : null}
          </Pressable>
          <View style={styles.headerIcon}><Icon name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} color={C.maroon} size={21} /></View>
        </View>

        <View style={styles.heroBannerWrap}>
          <ExpoImage source={GURU_BANNER} style={styles.heroBannerImage} contentFit="cover" transition={0} />
        </View>

        <Pressable
          style={styles.matrimonyBannerWrap}
          onPress={() => router.push('/matrimony')}
          accessibilityRole="button"
          accessibilityLabel="मैट्रिमोनी देखें">
          <ExpoImage source={MATRIMONY_BANNER} style={styles.matrimonyBannerImage} contentFit="cover" transition={0} />
        </Pressable>

        <View style={styles.quickRow}>
          {quickActions.map((item) => (
            <Pressable
              key={item.title}
              style={[styles.quickCard, { backgroundColor: item.bg }]}
              onPress={() => openQuickAction(item.title)}>
              <View style={styles.quickIcon}><Icon name={item.icon} color={item.tint} size={26} /></View>
              <Text style={styles.quickTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.quickSub} numberOfLines={1}>{item.sub}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsStrip}>
          <TrustStat
            icon={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            value={isMatrimonyLoading ? '…' : String(profileTotal ?? 0)}
            label="उपलब्ध प्रोफाइल"
          />
          <View style={styles.statDivider} />
          <TrustStat
            icon={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }}
            value={isCommitteesLoading ? '…' : String(committeeTotal ?? 0)}
            label="समितियाँ"
          />
          <View style={styles.statDivider} />
          <TrustStat
            icon={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
            value={isAdvertisementsLoading ? '…' : String(advertisementTotal ?? 0)}
            label="स्वीकृत विज्ञापन"
          />
          <View style={styles.statDivider} />
          <TrustStat icon={{ ios: 'star.fill', android: 'star', web: 'star' }} label="एक मजबूत समाज के लिए साथ" color={C.gold} />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><Icon name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} color={C.maroon} size={21} /><Text style={styles.sectionTitle}>नए Matrimony Profiles</Text></View>
          <Pressable onPress={() => router.push('/matrimony')}>
            <Text style={styles.viewAll}>View All →</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
          {latestProfiles.map((profile) => {
            const photo = profile.photos[0]?.url;
            const age = calculateAge(profile.dateOfBirth);
            return (
              <Pressable
                style={styles.profileCard}
                key={profile.id}
                onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.profilePhoto} />
                ) : (
                  <View style={[styles.profilePhoto, styles.profilePhotoPlaceholder]}>
                    <Icon name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} color="#C7AFA1" size={54} />
                  </View>
                )}
                <View style={styles.verified}><Icon name={{ ios: 'checkmark.circle.fill', android: 'verified', web: 'verified' }} color={C.green} size={12} /><Text style={styles.verifiedText}>Verified</Text></View>
                <View style={styles.profileInfo}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName} numberOfLines={1}>{profileName(profile)}, {age}</Text>
                    {profile.isFeatured ? <Icon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={C.gold} size={15} /> : null}
                  </View>
                  <Text style={styles.profileMeta} numberOfLines={1}>{profileLocation(profile)}</Text>
                  <Text style={styles.profileMeta} numberOfLines={1}>{profileWork(profile)}</Text>
                </View>
              </Pressable>
            );
          })}
          {isMatrimonyLoading ? (
            <View style={styles.profileEmptyCard}>
              <Icon name={{ ios: 'heart.circle.fill', android: 'favorite', web: 'favorite' }} color={C.maroon} size={25} />
              <Text style={styles.profileEmptyTitle}>प्रोफाइल लोड हो रहे हैं...</Text>
            </View>
          ) : latestProfiles.length === 0 ? (
            <View style={styles.profileEmptyCard}>
              <Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={C.gold} size={25} />
              <Text style={styles.profileEmptyTitle}>अभी कोई स्वीकृत प्रोफाइल नहीं</Text>
              <Text style={styles.profileEmptyText}>Admin approval के बाद नए प्रोफाइल यहाँ दिखाई देंगे।</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.adsSectionHeader}>
          <View style={styles.adsHeaderTop}>
            <View style={styles.adsTitleRow}>
              <Icon name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }} color={C.maroon} size={24} />
              <Text style={styles.adsTitle}>समाज व्यापार</Text>
              <Text style={styles.adsEnglish}>Free Classifieds</Text>
            </View>
            <Pressable onPress={() => router.push({ pathname: '/community', params: { category: 'ADVERTISEMENT' } })}>
              <Text style={styles.viewAll}>View All →</Text>
            </Pressable>
          </View>

          <View style={styles.adsActionRow}>
            <Text style={styles.adsSubtitle}>अपने व्यवसाय, सेवा या ऑफर का विज्ञापन डालें</Text>
            <Pressable
              style={styles.postAdButton}
              onPress={() => router.push({ pathname: '/community-submit', params: { category: 'ADVERTISEMENT' } })}>
              <Text style={styles.postAdButtonText}>+ विज्ञापन डालें</Text>
              <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
            </Pressable>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adsRow}>
          {approvedAds.slice(0, 6).map((ad) => {
            const translation = ad.translations.find((item) => item.language === 'HI') ?? ad.translations[0];
            return (
              <Pressable
                key={ad.id}
                style={styles.adCard}
                onPress={() => router.push({ pathname: '/community-post', params: { id: ad.id } })}>
                {ad.bannerUrl ? (
                  <Image source={{ uri: ad.bannerUrl }} style={styles.adImage} />
                ) : (
                  <View style={styles.adImagePlaceholder}>
                    <Icon name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }} color={C.green} size={24} />
                  </View>
                )}
                <View style={styles.adBody}>
                  <Text style={styles.adTitle} numberOfLines={1}>{translation?.title ?? 'समाज विज्ञापन'}</Text>
                  <Text style={styles.adMeta} numberOfLines={2}>{translation?.details ?? 'विवरण उपलब्ध नहीं'}</Text>
                  <View style={styles.adFooter}>
                    <View style={styles.tag}><Text style={styles.tagText}>Approved</Text></View>
                    <Text style={styles.adCity} numberOfLines={1}>📍 {ad.location ?? 'समाज'}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
          {!isAdvertisementsLoading && approvedAds.length === 0 ? (
            <View style={styles.emptyAdCard}>
              <Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={C.gold} size={24} />
              <View style={styles.emptyAdCopy}>
                <Text style={styles.emptyAdTitle}>अभी कोई स्वीकृत विज्ञापन नहीं</Text>
                <Text style={styles.emptyAdText}>Admin approval के बाद विज्ञापन यहाँ दिखाई देंगे।</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.closingBanner}>
          <View style={styles.closingIcon}><Icon name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} color={C.maroon} size={34} /></View>
          <View style={styles.closingCopy}><Text style={styles.closingQuote}>“मिलकर बढ़ें, जुड़े रहें, समाज को और मजबूत बनाएं”</Text><View style={styles.goldLine} /></View>
          <View style={styles.joinButton}><Text style={styles.joinTitle}>Join Our Community</Text><Text style={styles.joinSub}>Because Community Matters</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 22 },
  header: { minHeight: 70, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: '#F2E6D8' },
  brandMark: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF1CF', borderWidth: 1, borderColor: '#E9C267', overflow: 'hidden' },
  brandLogoImage: { width: '100%', height: '100%' },
  brandCopy: { flex: 1, marginLeft: 10 },
  brand: { color: C.maroonDark, fontSize: 21, fontWeight: '900' },
  brandSub: { color: C.maroon, fontSize: 9.5, marginTop: 2, fontWeight: '700' },
  headerIcon: { width: 37, height: 37, borderRadius: 18.5, backgroundColor: '#FFF7E8', alignItems: 'center', justifyContent: 'center', marginLeft: 5, position: 'relative' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.maroon, borderWidth: 2, borderColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900', lineHeight: 11 },

  heroBannerWrap: { marginHorizontal: 12, marginTop: 10, borderRadius: 15, overflow: 'hidden', backgroundColor: '#FFF4D8', elevation: 1 },
  heroBannerImage: { width: '100%', aspectRatio: 480 / 146 },
  matrimonyBannerWrap: { marginHorizontal: 12, marginTop: 7, borderRadius: 13, overflow: 'hidden', backgroundColor: '#FFF1F1', elevation: 1 },
  matrimonyBannerImage: { width: '100%', aspectRatio: 480 / 74 },

  quickRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 12, marginTop: 7 },
  quickCard: { flex: 1, minWidth: 0, height: 90, borderRadius: 11, borderWidth: 1, borderColor: '#E8DCCF', paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center' },
  quickIcon: { height: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  quickTitle: { color: C.text, fontSize: 10, lineHeight: 13, fontWeight: '900', textAlign: 'center' },
  quickSub: { color: C.text, fontSize: 7.5, marginTop: 1.5, fontWeight: '700', textAlign: 'center' },

  statsStrip: { marginHorizontal: 12, marginTop: 7, minHeight: 64, borderRadius: 12, borderWidth: 1, borderColor: '#EFDFC6', backgroundColor: '#FFF9EE', flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 5, paddingVertical: 7 },
  statItem: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  statIconWrap: { width: 29, height: 29, borderRadius: 14.5, backgroundColor: '#FFF0D9', alignItems: 'center', justifyContent: 'center', marginRight: 3 },
  statCopy: { flexShrink: 1 },
  statValue: { color: C.maroon, fontSize: 11, fontWeight: '900', lineHeight: 13 },
  statLabel: { color: C.text, fontSize: 7.5, fontWeight: '700', lineHeight: 10, marginTop: 1 },
  statDivider: { width: 1, backgroundColor: '#EAD8BE', marginVertical: 4 },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13, marginTop: 15, marginBottom: 7 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  viewAll: { color: C.maroon, fontSize: 10.5, fontWeight: '900' },
  profileRow: { paddingHorizontal: 12, gap: 8 },
  profileCard: { width: 132, backgroundColor: '#FFFFFF', borderRadius: 11, borderWidth: 1, borderColor: '#ECE4DA', overflow: 'hidden', elevation: 2 },
  profilePhoto: { width: '100%', height: 116, backgroundColor: '#E6D7C4' },
  profilePhotoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  verified: { position: 'absolute', top: 104, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E9FAF1', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  verifiedText: { color: C.green, fontSize: 7.5, fontWeight: '900' },
  profileInfo: { padding: 7, paddingTop: 9 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  profileName: { color: C.text, fontSize: 11.5, fontWeight: '900', flex: 1 },
  profileMeta: { color: C.muted, fontSize: 8.5, lineHeight: 12, marginTop: 1 },
  profileEmptyCard: { width: 235, minHeight: 116, borderRadius: 11, borderWidth: 1, borderColor: '#ECE4DA', backgroundColor: '#FFFDF9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  profileEmptyTitle: { color: C.maroon, fontSize: 10.5, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  profileEmptyText: { color: C.muted, fontSize: 8.5, lineHeight: 12, marginTop: 3, textAlign: 'center' },

  adsSectionHeader: { marginTop: 16, paddingHorizontal: 13 },
  adsHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  adsTitleRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 5 },
  adsTitle: { color: C.maroon, fontSize: 15, fontWeight: '900' },
  adsEnglish: { color: C.maroon, fontSize: 10.5, fontWeight: '800', fontStyle: 'italic', flexShrink: 1 },
  adsActionRow: { marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  adsSubtitle: { flex: 1, color: C.muted, fontSize: 8.5, lineHeight: 12 },
  postAdButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.maroon, borderRadius: 9, paddingLeft: 10, paddingRight: 5, paddingVertical: 7 },
  postAdButtonText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  freeBadge: { backgroundColor: '#16B96A', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2.5 },
  freeBadgeText: { color: '#FFF', fontSize: 7, fontWeight: '900' },
  adsRow: { paddingHorizontal: 12, paddingTop: 8, gap: 8 },
  adCard: { width: 205, height: 83, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECE3D7', flexDirection: 'row', overflow: 'hidden', elevation: 1 },
  adImage: { width: 77, height: '100%', backgroundColor: '#EBDCC9' },
  adImagePlaceholder: { width: 77, height: '100%', backgroundColor: '#EAF7EF', alignItems: 'center', justifyContent: 'center' },
  adBody: { flex: 1, padding: 7 },
  adTitle: { color: C.maroon, fontSize: 10.5, fontWeight: '900' },
  adMeta: { color: C.muted, fontSize: 8, marginTop: 2 },
  adFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tag: { backgroundColor: '#FFF0F1', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { color: '#D1293D', fontSize: 7 },
  adCity: { color: '#637083', fontSize: 6.8, flexShrink: 1 },
  emptyAdCard: { width: 260, minHeight: 83, borderRadius: 10, borderWidth: 1, borderColor: '#ECE3D7', backgroundColor: '#FFFDF9', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  emptyAdCopy: { flex: 1 },
  emptyAdTitle: { color: C.maroon, fontSize: 10.5, fontWeight: '900' },
  emptyAdText: { color: C.muted, fontSize: 8, lineHeight: 12, marginTop: 2 },

  closingBanner: { marginHorizontal: 12, marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E9D1AE', backgroundColor: '#FFF6E8', minHeight: 76, padding: 10, flexDirection: 'row', alignItems: 'center' },
  closingIcon: { width: 44, alignItems: 'center' },
  closingCopy: { flex: 1, paddingHorizontal: 5 },
  closingQuote: { color: C.maroon, fontSize: 11.5, lineHeight: 16, fontWeight: '900' },
  goldLine: { width: 95, height: 1, backgroundColor: C.gold, marginTop: 7 },
  joinButton: { minWidth: 105, borderRadius: 18, backgroundColor: '#FFEBD5', paddingHorizontal: 9, paddingVertical: 8 },
  joinTitle: { color: C.maroon, fontSize: 8.5, fontWeight: '900' },
  joinSub: { color: C.maroon, fontSize: 6.7, marginTop: 1 },
});