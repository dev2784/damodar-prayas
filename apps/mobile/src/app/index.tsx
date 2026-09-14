import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg: '#FFF8EE',
  paper: '#FFFDF9',
  maroon: '#A30D1E',
  maroonDark: '#7D0A16',
  gold: '#D79A25',
  goldSoft: '#F9E8BC',
  text: '#211B18',
  muted: '#776A64',
  line: '#EBDCC9',
  green: '#0F9D63',
  blush: '#FFF0EE',
};

const GURU = 'https://pbs.twimg.com/media/FCJ3lLkUcAI8zGY.jpg';
const COUPLE = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=85';

const quickActions = [
  { icon: { ios: 'person.3.fill', android: 'groups', web: 'groups' } as const, title: 'समाज सदस्य', sub: '(Directory)', tint: '#B70F22', bg: '#FFF0F1' },
  { icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' } as const, title: 'कार्यक्रम एवं', sub: 'समाचार', tint: '#D88400', bg: '#FFF8E8' },
  { icon: { ios: 'storefront.fill', android: 'storefront', web: 'storefront' } as const, title: 'समाज व्यापार', sub: '(Business)', tint: '#16883B', bg: '#EEFAF2' },
  { icon: { ios: 'book.closed.fill', android: 'menu_book', web: 'menu_book' } as const, title: 'लेख / ज्ञान', sub: '(Articles)', tint: '#56307D', bg: '#F5F0FB' },
  { icon: { ios: 'phone.fill', android: 'support_agent', web: 'support_agent' } as const, title: 'सहायता', sub: '(Help & Support)', tint: '#154A8A', bg: '#EEF6FF' },
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
          <View style={styles.headerIcon}><Icon name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} color={C.maroon} size={22} /></View>
          <View style={styles.headerIcon}><Icon name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} color={C.maroon} size={22} /></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroGlowA} /><View style={styles.heroGlowB} />
          <View style={styles.guruFrame}>
            <Image source={{ uri: GURU }} style={styles.guruImage} resizeMode="cover" />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>॥ जय गुरु टेकचंद महाराज ॥</Text>
            <Text style={styles.heroSub}>समाज की शक्ति, परिवारों की खुशी</Text>
            <View style={styles.quoteBox}>
              <Text style={styles.quoteMark}>“</Text>
              <Text style={styles.heroQuote}>मुश्किल की घड़ियों में वही हस्ती है{`\n`}जिनके दिल में मेरे सेठ बसते हैं</Text>
              <Text style={[styles.quoteMark, styles.quoteRight]}>”</Text>
            </View>
          </View>
        </View>

        <View style={styles.matrimonyCard}>
          <ImageBackground source={{ uri: COUPLE }} style={styles.coupleImage} imageStyle={styles.coupleImageRadius} />
          <View style={styles.matchCopy}>
            <Text style={styles.matchTitle}>अपने जीवन साथी की खोज शुरू करें</Text>
            <Text style={styles.matchSub}>Trusted by Darzi Samaj families</Text>
            <View style={styles.trustRow}>
              <View style={styles.trustItem}><Icon name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} color={C.maroon} size={17} /><Text style={styles.trustText}>Verified</Text></View>
              <View style={styles.trustItem}><Icon name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} color={C.maroon} size={17} /><Text style={styles.trustText}>Same Community</Text></View>
              <View style={styles.trustItem}><Icon name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} color={C.maroon} size={17} /><Text style={styles.trustText}>Safe</Text></View>
            </View>
          </View>
          <View style={styles.cta}><Text style={styles.ctaText}>Explore Matrimony  →</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
          {quickActions.map((item) => (
            <View key={item.title} style={[styles.quickCard, { backgroundColor: item.bg }]}>
              <View style={styles.quickIcon}><Icon name={item.icon} color={item.tint} size={29} /></View>
              <Text style={styles.quickTitle}>{item.title}</Text>
              <Text style={styles.quickSub}>{item.sub}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.valueStrip}>
          <View style={styles.valueItem}><Icon name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} color={C.maroon} size={24} /><Text style={styles.valueMain}>समाज परिवार</Text><Text style={styles.valueSub}>साथ और विश्वास</Text></View>
          <View style={styles.valueDivider} />
          <View style={styles.valueItem}><Icon name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} color={C.maroon} size={24} /><Text style={styles.valueMain}>प्रोफाइल</Text><Text style={styles.valueSub}>सत्यापित रिश्ते</Text></View>
          <View style={styles.valueDivider} />
          <View style={styles.valueItem}><Icon name={{ ios: 'storefront.fill', android: 'storefront', web: 'storefront' }} color={C.maroon} size={24} /><Text style={styles.valueMain}>व्यवसाय</Text><Text style={styles.valueSub}>समाज सूची</Text></View>
          <View style={styles.valueDivider} />
          <View style={styles.valueItem}><Icon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={C.gold} size={24} /><Text style={styles.valueMain}>एक मजबूत</Text><Text style={styles.valueSub}>समाज के लिए साथ</Text></View>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}><Icon name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} color={C.maroon} size={22} /><Text style={styles.sectionTitle}>नए Matrimony Profiles</Text></View>
          <Text style={styles.viewAll}>View All  →</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
          {profiles.map((profile) => (
            <View style={styles.profileCard} key={profile.name}>
              <Image source={{ uri: profile.image }} style={styles.profilePhoto} />
              <View style={styles.verified}><Icon name={{ ios: 'checkmark.circle.fill', android: 'verified', web: 'verified' }} color={C.green} size={13} /><Text style={styles.verifiedText}>Verified</Text></View>
              <View style={styles.profileInfo}>
                <View style={styles.profileNameRow}><Text style={styles.profileName}>{profile.name}</Text><Icon name={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} color='#F04455' size={21} /></View>
                <Text style={styles.profileMeta}>{profile.city}</Text>
                <Text style={styles.profileMeta}>{profile.work}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.adsHeader}>
          <View style={styles.adsTitleWrap}>
            <View style={styles.adsTitleRow}><Icon name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }} color={C.maroon} size={25} /><Text style={styles.adsTitle}>समाज व्यापार - Free Classifieds</Text></View>
            <Text style={styles.adsSubtitle}>अपने व्यवसाय, सेवा या ऑफर का विज्ञापन डालें</Text>
          </View>
          <View style={styles.postAdButton}><Text style={styles.postAdButtonText}>+ अपना विज्ञापन डालें</Text><View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View></View>
        </View>

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
          <View style={styles.closingIcon}><Icon name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }} color={C.maroon} size={37} /></View>
          <View style={styles.closingCopy}><Text style={styles.closingQuote}>“मिलकर बढ़ें, जुड़े रहें, समाज को और मजबूत बनाएं”</Text><View style={styles.goldLine} /></View>
          <View style={styles.joinButton}><Text style={styles.joinTitle}>Join Our Community</Text><Text style={styles.joinSub}>Because Community Matters</Text></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 26 },
  header: { minHeight: 72, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: '#F3E7D7' },
  brandMark: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF1CF', borderWidth: 1, borderColor: '#E9C267', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.maroon, fontSize: 25, fontWeight: '900' },
  brandCopy: { flex: 1, marginLeft: 10 },
  brand: { color: C.maroonDark, fontSize: 21, fontWeight: '900', fontFamily: 'serif' },
  brandSub: { color: C.maroon, fontSize: 10, marginTop: 1, fontWeight: '600' },
  headerIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF7E8', alignItems: 'center', justifyContent: 'center', marginLeft: 6 },

  hero: { marginHorizontal: 12, marginTop: 10, height: 238, borderRadius: 18, overflow: 'hidden', backgroundColor: '#F9D57B', borderWidth: 1, borderColor: '#E7BB59', flexDirection: 'row', padding: 14, alignItems: 'center' },
  heroGlowA: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: '#FFF4B8', opacity: 0.55, left: -70, top: -60 },
  heroGlowB: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#FFF7D6', opacity: 0.72, right: -85, top: -30 },
  guruFrame: { width: '43%', height: 205, borderRadius: 17, overflow: 'hidden', borderWidth: 2, borderColor: '#FFF7DF', backgroundColor: '#D99729' },
  guruImage: { width: '100%', height: '100%' },
  heroCopy: { flex: 1, paddingLeft: 14, zIndex: 2 },
  heroTitle: { color: C.maroonDark, fontSize: 18, fontWeight: '900', textAlign: 'center', lineHeight: 25 },
  heroSub: { color: '#985B34', fontSize: 11.5, textAlign: 'center', marginTop: 6, fontWeight: '700' },
  quoteBox: { backgroundColor: 'rgba(255,253,244,0.82)', borderWidth: 1, borderColor: '#E3AD4C', borderRadius: 13, marginTop: 14, paddingVertical: 12, paddingHorizontal: 11 },
  quoteMark: { color: '#D1840B', fontSize: 27, lineHeight: 20, fontWeight: '900' },
  quoteRight: { alignSelf: 'flex-end', marginTop: -3 },
  heroQuote: { color: '#34241D', fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginVertical: -2 },

  matrimonyCard: { marginHorizontal: 12, marginTop: 11, minHeight: 132, borderRadius: 18, backgroundColor: '#FFF4F3', borderWidth: 1, borderColor: '#F1C9C8', flexDirection: 'row', alignItems: 'center', padding: 10, overflow: 'hidden' },
  coupleImage: { width: 88, height: 110 },
  coupleImageRadius: { borderRadius: 13 },
  matchCopy: { flex: 1, paddingHorizontal: 10 },
  matchTitle: { color: C.maroonDark, fontSize: 15, fontWeight: '900', lineHeight: 20 },
  matchSub: { color: '#687080', fontSize: 10.5, marginTop: 4 },
  trustRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  trustText: { color: '#4B5057', fontSize: 8.5, fontWeight: '700' },
  cta: { backgroundColor: C.maroon, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, minWidth: 126, alignItems: 'center' },
  ctaText: { color: '#FFF', fontSize: 11, fontWeight: '900' },

  quickRow: { paddingHorizontal: 12, paddingTop: 10, gap: 8 },
  quickCard: { width: 132, height: 112, borderRadius: 14, borderWidth: 1, borderColor: '#E8DCCF', alignItems: 'center', justifyContent: 'center', padding: 10 },
  quickIcon: { marginBottom: 7 },
  quickTitle: { color: C.text, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  quickSub: { color: '#242424', fontSize: 9, marginTop: 2, textAlign: 'center' },

  valueStrip: { marginHorizontal: 12, marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: '#ECDCC6', backgroundColor: '#FFFCF4', flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  valueItem: { flex: 1, alignItems: 'center', minWidth: 0 },
  valueMain: { color: C.maroonDark, fontSize: 9.5, fontWeight: '900', marginTop: 4, textAlign: 'center' },
  valueSub: { color: C.text, fontSize: 7.5, marginTop: 1, textAlign: 'center' },
  valueDivider: { width: 1, height: 42, backgroundColor: '#E8D9C6' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, marginTop: 18, marginBottom: 9 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { color: C.text, fontSize: 16, fontWeight: '900' },
  viewAll: { color: C.maroon, fontSize: 11, fontWeight: '900' },
  profileRow: { paddingHorizontal: 12, gap: 9 },
  profileCard: { width: 150, backgroundColor: C.paper, borderRadius: 13, borderWidth: 1, borderColor: C.line, overflow: 'hidden' },
  profilePhoto: { width: '100%', height: 132 },
  verified: { position: 'absolute', top: 112, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E8FFF2', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3 },
  verifiedText: { color: C.green, fontSize: 8, fontWeight: '900' },
  profileInfo: { padding: 9 },
  profileNameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileName: { color: C.text, fontSize: 13, fontWeight: '900' },
  profileMeta: { color: '#677080', fontSize: 9.5, marginTop: 2 },

  adsHeader: { marginTop: 19, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  adsTitleWrap: { flex: 1 },
  adsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  adsTitle: { color: C.maroon, fontSize: 15, fontWeight: '900', flexShrink: 1 },
  adsSubtitle: { color: '#687080', fontSize: 9.5, marginLeft: 31, marginTop: 2 },
  postAdButton: { backgroundColor: C.maroon, borderRadius: 11, paddingLeft: 10, paddingRight: 6, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  postAdButtonText: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  freeBadge: { backgroundColor: '#20AD68', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3 },
  freeBadgeText: { color: '#FFF', fontSize: 7.5, fontWeight: '900' },
  adsRow: { paddingHorizontal: 12, paddingTop: 10, gap: 9 },
  adCard: { width: 225, height: 102, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 12, padding: 8, flexDirection: 'row' },
  adImage: { width: 83, height: 84, borderRadius: 9 },
  adBody: { flex: 1, paddingLeft: 9 },
  adTitle: { color: C.maroon, fontSize: 11.5, fontWeight: '900' },
  adMeta: { color: '#687080', fontSize: 9, marginTop: 4 },
  adFooter: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5 },
  tag: { backgroundColor: '#FFF0F1', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 3 },
  tagText: { color: C.maroon, fontSize: 7.5, fontWeight: '700' },
  adCity: { color: '#667085', fontSize: 7.5, flexShrink: 1 },

  closingBanner: { marginHorizontal: 12, marginTop: 15, minHeight: 94, borderRadius: 16, borderWidth: 1, borderColor: '#ECD6B3', backgroundColor: '#FFF9EF', flexDirection: 'row', alignItems: 'center', padding: 12 },
  closingIcon: { width: 50, alignItems: 'center' },
  closingCopy: { flex: 1, paddingHorizontal: 8 },
  closingQuote: { color: C.maroon, fontSize: 13, fontWeight: '900', textAlign: 'center', lineHeight: 18 },
  goldLine: { height: 1, backgroundColor: C.gold, marginTop: 8, marginHorizontal: 20 },
  joinButton: { backgroundColor: '#FFF0DE', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, minWidth: 112 },
  joinTitle: { color: C.maroonDark, fontSize: 10, fontWeight: '900', textAlign: 'center' },
  joinSub: { color: C.maroon, fontSize: 7.5, marginTop: 2, textAlign: 'center' },
});
