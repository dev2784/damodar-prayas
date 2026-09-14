import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const TOP_REFERENCE = require('../../assets/images/home-top-reference.jpg');

const quickActions = [
  { icon: { ios: 'person.3.fill', android: 'groups', web: 'groups' } as const, title: 'समाज सदस्य', sub: '(Directory)', tint: '#B70F22', bg: '#FFF2F3' },
  { icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as const, title: 'कार्यक्रम एवं', sub: 'समाचार', tint: '#D98A00', bg: '#FFF9ED' },
  { icon: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' } as const, title: 'समाज व्यापार', sub: '(Business)', tint: '#17893D', bg: '#EFFAF3' },
  { icon: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' } as const, title: 'लेख / ज्ञान', sub: '(Articles)', tint: '#5B3180', bg: '#F5F1FB' },
  { icon: { ios: 'phone.fill', android: 'support_agent', web: 'support_agent' } as const, title: 'सहायता', sub: '(Help & Support)', tint: '#154C8C', bg: '#EEF7FF' },
];

const profiles = [
  { name: 'Priya, 27', city: 'Jabalpur, MP', work: 'MBA • Banking', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=85' },
  { name: 'Rahul, 29', city: 'Indore, MP', work: 'B.Tech • IT', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85' },
  { name: 'Neha, 26', city: 'Bhopal, MP', work: 'M.Sc • Teaching', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=85' },
  { name: 'Amit, 30', city: 'Jabalpur, MP', work: 'MBA • Business', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=85' },
];

const ads = [
  { title: 'Tailor & Boutique', meta: 'कपड़े सिलाई • डिजाइन', tag: 'Service', city: 'Jabalpur, MP', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=85' },
  { title: 'Wedding Services', meta: 'कैटरिंग • डेकोरेशन', tag: 'Event', city: 'Indore, MP', image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=500&q=85' },
  { title: 'Garments & Fabric', meta: 'कपड़ा • होलसेल', tag: 'Business', city: 'Bhopal, MP', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=500&q=85' },
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

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>द</Text></View>
          <View style={styles.brandCopy}>
            <Text style={styles.brand}>Damodar Prayas</Text>
            <Text style={styles.brandSub}>Darzi Samaj Community & Matrimony</Text>
          </View>
          <View style={styles.headerIcon}><Icon name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} color={C.maroon} size={21} /></View>
          <View style={styles.headerIcon}><Icon name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} color={C.maroon} size={21} /></View>
        </View>

        <View style={styles.referenceWrap}>
          <Image source={TOP_REFERENCE} style={styles.referenceImage} resizeMode="stretch" />
          <Pressable style={styles.matrimonyHotspot} onPress={() => router.push('/matrimony')} accessibilityRole="button" accessibilityLabel="Explore Matrimony" />
        </View>

        <View style={styles.quickRow}>
          {quickActions.map((item) => (
            <Pressable key={item.title} style={[styles.quickCard, { backgroundColor: item.bg }]}>
              <View style={styles.quickIcon}><Icon name={item.icon} color={item.tint} size={26} /></View>
              <Text style={styles.quickTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.quickSub} numberOfLines={1}>{item.sub}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.statsStrip}>
          <TrustStat icon={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} value="5,000+" label="समाज परिवार" />
          <View style={styles.statDivider} />
          <TrustStat icon={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} value="1,200+" label="प्रोफाइल्स" />
          <View style={styles.statDivider} />
          <TrustStat icon={{ ios: 'handshake.fill', android: 'handshake', web: 'handshake' }} value="150+" label="व्यवसाय सूचीबद्ध" />
          <View style={styles.statDivider} />
          <TrustStat icon={{ ios: 'star.fill', android: 'star', web: 'star' }} label="एक मजबूत समाज के लिए साथ" color={C.gold} />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><Icon name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} color={C.maroon} size={21} /><Text style={styles.sectionTitle}>नए Matrimony Profiles</Text></View>
          <Text style={styles.viewAll}>View All  →</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
          {profiles.map((profile) => (
            <View style={styles.profileCard} key={profile.name}>
              <Image source={{ uri: profile.image }} style={styles.profilePhoto} />
              <View style={styles.verified}><Icon name={{ ios: 'checkmark.circle.fill', android: 'verified', web: 'verified' }} color={C.green} size={12} /><Text style={styles.verifiedText}>Verified</Text></View>
              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}><Text style={styles.profileName}>{profile.name}</Text><Icon name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} color="#F04455" size={20} /></View>
                <Text style={styles.profileMeta}>{profile.city}</Text>
                <Text style={styles.profileMeta}>{profile.work}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.adsHeader}>
          <View style={styles.adsTitleWrap}>
            <View style={styles.adsTitleRow}><Icon name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }} color={C.maroon} size={24} /><Text style={styles.adsTitle}>समाज व्यापार - Free Classifieds</Text></View>
            <Text style={styles.adsSubtitle}>अपने व्यवसाय, सेवा या ऑफर का विज्ञापन डालें</Text>
          </View>
          <Text style={styles.viewAll}>View All →</Text>
        </View>

        <Pressable style={styles.postAdButton}>
          <Text style={styles.postAdButtonText}>+ अपना विज्ञापन डालें</Text>
          <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adsRow}>
          {ads.map((ad) => (
            <View key={ad.title} style={styles.adCard}>
              <Image source={{ uri: ad.image }} style={styles.adImage} />
              <View style={styles.adBody}>
                <Text style={styles.adTitle}>{ad.title}</Text>
                <Text style={styles.adMeta}>{ad.meta}</Text>
                <View style={styles.adFooter}><View style={styles.tag}><Text style={styles.tagText}>{ad.tag}</Text></View><Text style={styles.adCity}>📍 {ad.city}</Text></View>
              </View>
            </View>
          ))}
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
  brandMark: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF1CF', borderWidth: 1, borderColor: '#E9C267', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.maroon, fontSize: 25, fontWeight: '900' },
  brandCopy: { flex: 1, marginLeft: 10 },
  brand: { color: C.maroonDark, fontSize: 20, fontWeight: '900', fontFamily: 'serif' },
  brandSub: { color: C.maroon, fontSize: 9.5, marginTop: 1, fontWeight: '700' },
  headerIcon: { width: 37, height: 37, borderRadius: 18.5, backgroundColor: '#FFF7E8', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },

  referenceWrap: { marginHorizontal: 12, marginTop: 10, borderRadius: 15, overflow: 'hidden', backgroundColor: '#FFF4D8', elevation: 1 },
  referenceImage: { width: '100%', aspectRatio: 480 / 225 },
  matrimonyHotspot: { position: 'absolute', right: '1.5%', top: '69%', width: '29%', height: '18%' },

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
  verified: { position: 'absolute', top: 104, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E9FAF1', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  verifiedText: { color: C.green, fontSize: 7.5, fontWeight: '900' },
  profileInfo: { padding: 7, paddingTop: 9 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  profileName: { color: C.text, fontSize: 11.5, fontWeight: '900', flex: 1 },
  profileMeta: { color: C.muted, fontSize: 8.5, lineHeight: 12, marginTop: 1 },

  adsHeader: { marginTop: 16, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 },
  adsTitleWrap: { flex: 1 },
  adsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adsTitle: { color: C.maroon, fontSize: 15, fontWeight: '900' },
  adsSubtitle: { color: C.muted, fontSize: 9, marginTop: 1 },
  postAdButton: { marginHorizontal: 12, marginTop: 7, alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.maroon, borderRadius: 10, paddingLeft: 13, paddingRight: 7, paddingVertical: 8 },
  postAdButtonText: { color: '#FFF', fontSize: 10.5, fontWeight: '900' },
  freeBadge: { backgroundColor: '#16B96A', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  freeBadgeText: { color: '#FFF', fontSize: 8, fontWeight: '900' },
  adsRow: { paddingHorizontal: 12, paddingTop: 7, gap: 8 },
  adCard: { width: 205, height: 83, borderRadius: 10, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#ECE3D7', flexDirection: 'row', overflow: 'hidden', elevation: 1 },
  adImage: { width: 77, height: '100%', backgroundColor: '#EBDCC9' },
  adBody: { flex: 1, padding: 7 },
  adTitle: { color: C.maroon, fontSize: 10.5, fontWeight: '900' },
  adMeta: { color: C.muted, fontSize: 8, marginTop: 2 },
  adFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4 },
  tag: { backgroundColor: '#FFF0F1', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  tagText: { color: '#D1293D', fontSize: 7 },
  adCity: { color: '#637083', fontSize: 6.8, flexShrink: 1 },

  closingBanner: { marginHorizontal: 12, marginTop: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E9D1AE', backgroundColor: '#FFF6E8', minHeight: 76, padding: 10, flexDirection: 'row', alignItems: 'center' },
  closingIcon: { width: 44, alignItems: 'center' },
  closingCopy: { flex: 1, paddingHorizontal: 5 },
  closingQuote: { color: C.maroon, fontSize: 11.5, lineHeight: 16, fontWeight: '900' },
  goldLine: { width: 95, height: 1, backgroundColor: C.gold, marginTop: 7 },
  joinButton: { minWidth: 105, borderRadius: 18, backgroundColor: '#FFEBD5', paddingHorizontal: 9, paddingVertical: 8 },
  joinTitle: { color: C.maroon, fontSize: 8.5, fontWeight: '900' },
  joinSub: { color: C.maroon, fontSize: 6.7, marginTop: 1 },
});
