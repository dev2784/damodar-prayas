import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  cream: '#FFF8ED',
  maroon: '#6E1F2A',
  saffron: '#D99A2B',
  card: '#FFFDF8',
  text: '#2E2522',
  muted: '#7F706A',
  border: '#EADCCB',
};

const sections = [
  ['💍', 'मैट्रिमोनी खोजें', 'समाज में योग्य रिश्ते देखें'],
  ['📰', 'समाज समाचार', 'नई घोषणाएँ और अपडेट'],
  ['📅', 'आगामी कार्यक्रम', 'समाज के कार्यक्रम और निमंत्रण'],
  ['🤝', 'सहायता / अनुरोध', 'समुदाय से सहयोग पाएँ'],
  ['📣', 'विज्ञापन', 'समाज से जुड़े उपयोगी विज्ञापन'],
  ['🏛️', 'हमारी समितियाँ', 'समिति और पदाधिकारियों की जानकारी'],
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.blessingBadge}>
            <Text style={styles.blessing}>🙏 जय गुरु टेकचंद महाराज</Text>
          </View>
          <Text style={styles.title}>Damodar Prayas</Text>
          <Text style={styles.subtitle}>Darzi Samaj Community & Matrimony</Text>
          <Text style={styles.tagline}>रिश्तों से समाज तक</Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.searchEyebrow}>MATRIMONY</Text>
          <Text style={styles.searchTitle}>अपने समाज में रिश्ता खोजें</Text>
          <Text style={styles.searchText}>प्रोफाइल, शहर और समाज श्रेणी के आधार पर खोजें</Text>
          <View style={styles.searchButton}>
            <Text style={styles.searchButtonText}>मैट्रिमोनी खोजें</Text>
          </View>
        </View>

        <Text style={styles.sectionHeading}>समाज एक नज़र में</Text>
        <View style={styles.grid}>
          {sections.map(([icon, title, description]) => (
            <View style={styles.card} key={title}>
              <Text style={styles.icon}>{icon}</Text>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardText}>{description}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.cream },
  content: { padding: 18, paddingBottom: 32 },
  hero: { alignItems: 'center', paddingVertical: 18 },
  blessingBadge: {
    borderWidth: 1,
    borderColor: '#E7C98F',
    backgroundColor: '#FFF3D8',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 14,
  },
  blessing: { color: COLORS.maroon, fontSize: 14, fontWeight: '800' },
  title: { color: COLORS.maroon, fontSize: 30, fontWeight: '900' },
  subtitle: { color: COLORS.text, marginTop: 5, fontSize: 13, fontWeight: '600' },
  tagline: { color: COLORS.saffron, marginTop: 7, fontSize: 17, fontWeight: '800' },
  searchCard: {
    backgroundColor: COLORS.maroon,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  searchEyebrow: { color: '#FFD78A', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  searchTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginTop: 8 },
  searchText: { color: '#F7E9E5', fontSize: 13, lineHeight: 20, marginTop: 7 },
  searchButton: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.saffron,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 11,
    marginTop: 16,
  },
  searchButtonText: { color: '#2E2114', fontWeight: '900' },
  sectionHeading: { color: COLORS.text, fontSize: 19, fontWeight: '900', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    width: '48%',
    minHeight: 145,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 15,
  },
  icon: { fontSize: 25, marginBottom: 10 },
  cardTitle: { color: COLORS.maroon, fontSize: 15, fontWeight: '900' },
  cardText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, marginTop: 5 },
});
