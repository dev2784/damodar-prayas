import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const C = {
  bg: '#FFF9F0',
  paper: '#FFFCF7',
  maroon: '#8B101B',
  maroonDark: '#681019',
  gold: '#D8941B',
  saffron: '#E9A426',
  text: '#241B18',
  muted: '#806C63',
  line: '#EEDFCB',
  blush: '#FFF1E5',
  green: '#237A50',
};

const quickActions = [
  ['◎', 'Samaj Members', 'समाज सदस्य'],
  ['▦', 'Events & News', 'कार्यक्रम व समाचार'],
  ['▣', 'Business', 'समाज व्यापार'],
  ['✦', 'Articles', 'लेख व जानकारी'],
];

const profiles = [
  ['प्रिया, 27', 'जबलपुर, MP', 'MBA • Banking'],
  ['राहुल, 29', 'इंदौर, MP', 'B.Tech • IT'],
  ['नेहा, 26', 'भोपाल, MP', 'M.Sc • Teaching'],
];

const ads = [
  ['✂', 'Tailor & Boutique', 'कपड़े सिलाई • डिजाइन'],
  ['❖', 'Wedding Services', 'कैटरिंग • डेकोरेशन'],
  ['⌂', 'Shop / Property', 'दुकान • किराया • प्रॉपर्टी'],
];

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
          <Text style={styles.bell}>♧</Text>
        </View>

        <View style={styles.guruCard}>
          <View style={styles.templeLine} />
          <View style={styles.guruPlaceholder}>
            <Text style={styles.guruMonogram}>गुरु</Text>
          </View>
          <View style={styles.guruCopy}>
            <Text style={styles.guruTitle}>॥ जय गुरु टेकचंद महाराज ॥</Text>
            <Text style={styles.guruSubtitle}>समाज की शक्ति, परिवारों की खुशी</Text>
            <Text style={styles.script}>Rishton se{`\n`}Samaj tak</Text>
          </View>
        </View>

        <View style={styles.matrimonyCard}>
          <View style={styles.matchTopRow}>
            <View style={styles.matchIcon}><Text style={styles.matchIconText}>♥</Text></View>
            <View style={styles.matchCopy}>
              <Text style={styles.matchTitle}>अपने जीवन साथी की खोज शुरू करें</Text>
              <Text style={styles.matchSub}>Verified Darzi Samaj profiles</Text>
            </View>
          </View>
          <View style={styles.cta}><Text style={styles.ctaText}>Explore Matrimony  →</Text></View>
        </View>

        <View style={styles.quickRow}>
          {quickActions.map(([icon, en, hi]) => (
            <View key={en} style={styles.quickCard}>
              <View style={styles.quickIcon}><Text style={styles.quickIconText}>{icon}</Text></View>
              <Text style={styles.quickTitle}>{en}</Text>
              <Text style={styles.quickHindi}>{hi}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Profiles</Text>
          <Text style={styles.viewAll}>View All  →</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.profileRow}>
          {profiles.map(([name, city, work], index) => (
            <View style={styles.profileCard} key={name}>
              <View style={styles.photoPlaceholder}>
                <Text style={styles.personIcon}>{index === 1 ? '👨' : '👩'}</Text>
              </View>
              <View style={styles.verified}><Text style={styles.verifiedText}>✓ Verified</Text></View>
              <Text style={styles.profileName}>{name}</Text>
              <Text style={styles.profileMeta}>{city}</Text>
              <Text style={styles.profileMeta}>{work}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.adsHeader}>
          <View>
            <View style={styles.adsTitleRow}>
              <Text style={styles.sectionTitle}>समाज व्यापार</Text>
              <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>FREE</Text></View>
            </View>
            <Text style={styles.adsSubtitle}>अपने व्यवसाय, सेवा या ऑफर का विज्ञापन डालें</Text>
          </View>
          <View style={styles.postAdButton}><Text style={styles.postAdButtonText}>+ विज्ञापन डालें</Text></View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.adsRow}>
          {ads.map(([icon, title, meta]) => (
            <View key={title} style={styles.adCard}>
              <View style={styles.adIcon}><Text style={styles.adIconText}>{icon}</Text></View>
              <View style={styles.adFreePill}><Text style={styles.adFreePillText}>FREE POST</Text></View>
              <Text style={styles.adTitle}>{title}</Text>
              <Text style={styles.adMeta}>{meta}</Text>
              <Text style={styles.adCta}>View / Post  →</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.freeNotice}>
          <Text style={styles.freeNoticeIcon}>✦</Text>
          <View style={styles.freeNoticeCopy}>
            <Text style={styles.freeNoticeTitle}>अभी विज्ञापन पोस्ट करना निःशुल्क है</Text>
            <Text style={styles.freeNoticeText}>समाज के व्यवसाय और सेवाओं को ज्यादा लोगों तक पहुँचाइए।</Text>
          </View>
        </View>

        <View style={styles.quoteCard}>
          <Text style={styles.quote}>“ सशक्त समाज • खुशहाल परिवार • उज्ज्वल भविष्य ”</Text>
          <Text style={styles.thread}>⌁──────── 🪡 ────────⌁</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { paddingBottom: 28 },
  header: { height: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: C.paper },
  brandMark: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF0D5', borderWidth: 1, borderColor: '#F2D39D', alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: C.maroon, fontSize: 20, fontWeight: '900' },
  brandCopy: { flex: 1, marginLeft: 10 },
  brand: { color: C.maroonDark, fontSize: 19, fontWeight: '900', fontFamily: 'serif' },
  brandSub: { color: C.maroon, fontSize: 9.5, marginTop: 2, fontWeight: '600' },
  bell: { color: C.maroon, fontSize: 24 },
  guruCard: { height: 210, marginHorizontal: 14, marginTop: 8, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFF2D9', borderWidth: 1, borderColor: '#F0D6A7', flexDirection: 'row', alignItems: 'flex-end', padding: 16 },
  templeLine: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 62, backgroundColor: '#F6D8A5', opacity: 0.42 },
  guruPlaceholder: { width: 112, height: 160, borderRadius: 56, backgroundColor: '#F6C46A', borderWidth: 3, borderColor: '#FFF6E5', alignItems: 'center', justifyContent: 'center' },
  guruMonogram: { color: C.maroon, fontWeight: '900', fontSize: 23 },
  guruCopy: { flex: 1, alignSelf: 'stretch', paddingTop: 26, paddingLeft: 14 },
  guruTitle: { color: C.maroonDark, fontSize: 15, fontWeight: '900' },
  guruSubtitle: { color: '#9B6551', fontSize: 11, marginTop: 7 },
  script: { color: C.maroon, fontFamily: 'serif', fontStyle: 'italic', fontSize: 24, textAlign: 'center', marginTop: 28, lineHeight: 28 },
  matrimonyCard: { margin: 14, marginBottom: 12, backgroundColor: C.paper, borderRadius: 18, borderWidth: 1, borderColor: C.line, padding: 14 },
  matchTopRow: { flexDirection: 'row', alignItems: 'center' },
  matchIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF0E3', alignItems: 'center', justifyContent: 'center' },
  matchIconText: { color: '#D9342B', fontSize: 25 },
  matchCopy: { flex: 1, paddingLeft: 12 },
  matchTitle: { color: C.text, fontSize: 14, fontWeight: '900', lineHeight: 20 },
  matchSub: { color: C.muted, fontSize: 10, marginTop: 4 },
  cta: { marginTop: 12, backgroundColor: C.maroon, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  ctaText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 8 },
  quickCard: { width: '48.8%', backgroundColor: C.paper, borderRadius: 14, borderWidth: 1, borderColor: C.line, paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center' },
  quickIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF2E4', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickIconText: { color: C.maroon, fontSize: 18, fontWeight: '900' },
  quickTitle: { color: C.text, fontSize: 10.5, fontWeight: '800', textAlign: 'center' },
  quickHindi: { color: C.muted, fontSize: 8.5, marginTop: 2, textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 22, marginBottom: 10 },
  sectionTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
  viewAll: { color: C.maroon, fontSize: 11, fontWeight: '800' },
  profileRow: { paddingHorizontal: 14, gap: 9 },
  profileCard: { width: 122, backgroundColor: C.paper, borderRadius: 12, borderWidth: 1, borderColor: C.line, overflow: 'hidden', paddingBottom: 10 },
  photoPlaceholder: { height: 115, backgroundColor: '#E9D8C2', alignItems: 'center', justifyContent: 'flex-end' },
  personIcon: { fontSize: 64 },
  verified: { alignSelf: 'flex-start', backgroundColor: '#E7F5EA', borderRadius: 6, marginLeft: 7, marginTop: -10, paddingHorizontal: 5, paddingVertical: 3 },
  verifiedText: { color: C.green, fontSize: 8, fontWeight: '900' },
  profileName: { color: C.text, fontSize: 12, fontWeight: '900', marginHorizontal: 8, marginTop: 7 },
  profileMeta: { color: C.muted, fontSize: 9, marginHorizontal: 8, marginTop: 2 },
  adsHeader: { marginTop: 24, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  adsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  adsSubtitle: { color: C.muted, fontSize: 10, marginTop: 4, maxWidth: 220 },
  freeBadge: { backgroundColor: '#E7F5EA', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 4 },
  freeBadgeText: { color: C.green, fontSize: 8, fontWeight: '900' },
  postAdButton: { backgroundColor: C.maroon, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 9 },
  postAdButtonText: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  adsRow: { paddingHorizontal: 14, paddingTop: 12, gap: 10 },
  adCard: { width: 160, minHeight: 152, backgroundColor: C.paper, borderRadius: 14, borderWidth: 1, borderColor: C.line, padding: 12 },
  adIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#FFF0DA', alignItems: 'center', justifyContent: 'center' },
  adIconText: { color: C.maroon, fontSize: 21, fontWeight: '900' },
  adFreePill: { position: 'absolute', top: 12, right: 10, backgroundColor: '#E7F5EA', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  adFreePillText: { color: C.green, fontSize: 7.5, fontWeight: '900' },
  adTitle: { color: C.text, fontSize: 12, fontWeight: '900', marginTop: 10 },
  adMeta: { color: C.muted, fontSize: 9, marginTop: 4, lineHeight: 13 },
  adCta: { color: C.maroon, fontSize: 9.5, fontWeight: '900', marginTop: 10 },
  freeNotice: { marginHorizontal: 14, marginTop: 12, backgroundColor: '#FFF2D9', borderWidth: 1, borderColor: '#F0D6A7', borderRadius: 14, padding: 13, flexDirection: 'row', alignItems: 'center' },
  freeNoticeIcon: { color: C.gold, fontSize: 22, marginRight: 11 },
  freeNoticeCopy: { flex: 1 },
  freeNoticeTitle: { color: C.maroonDark, fontSize: 12, fontWeight: '900' },
  freeNoticeText: { color: C.muted, fontSize: 9.5, marginTop: 3, lineHeight: 14 },
  quoteCard: { margin: 14, marginTop: 22, backgroundColor: '#FFF0DA', borderRadius: 16, borderWidth: 1, borderColor: '#EFCF9D', padding: 18, alignItems: 'center' },
  quote: { color: C.maroon, fontSize: 15, fontWeight: '800', textAlign: 'center', lineHeight: 23 },
  thread: { color: C.gold, marginTop: 10, fontSize: 13 },
});
