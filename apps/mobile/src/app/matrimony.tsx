import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatrimonyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>MATRIMONY</Text>
        <Text style={styles.title}>मैट्रिमोनी</Text>
        <Text style={styles.text}>Darzi Samaj के verified matrimony profiles यहाँ दिखाई देंगे।</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF8ED' },
  content: { flex: 1, padding: 22 },
  eyebrow: { color: '#D99A2B', fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: '#6E1F2A', fontSize: 30, fontWeight: '900', marginTop: 6 },
  text: { color: '#6F625C', fontSize: 15, lineHeight: 23, marginTop: 10 },
});
