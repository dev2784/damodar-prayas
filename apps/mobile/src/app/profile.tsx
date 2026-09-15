import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppSelector } from '@/store/hooks';

const C = {
  bg: '#FFF8ED',
  paper: '#FFFFFF',
  maroon: '#A30D1E',
  maroonDark: '#77101B',
  gold: '#D99A2B',
  text: '#2A211D',
  muted: '#736660',
  line: '#E8DCCF',
  green: '#16865C',
};

export default function ProfileScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>DAMODAR PRAYAS ACCOUNT</Text>
        <Text style={styles.title}>मेरा प्रोफाइल</Text>
        <Text style={styles.subtitle}>समाज, मैट्रिमोनी और अकाउंट सेटिंग्स एक जगह।</Text>

        <View style={styles.accountCard}>
          <View style={styles.accountIcon}>
            <SymbolView
              name={{ ios: accessToken ? 'checkmark.shield.fill' : 'person.badge.key.fill', android: accessToken ? 'verified_user' : 'login', web: accessToken ? 'verified_user' : 'login' }}
              tintColor={accessToken ? C.green : C.maroon}
              size={32}
            />
          </View>
          <View style={styles.accountCopy}>
            <Text style={styles.accountTitle}>{accessToken ? 'अकाउंट सत्यापित है' : 'लॉगिन अभी बाकी है'}</Text>
            <Text style={styles.accountText}>
              {accessToken
                ? 'आप निजी मैट्रिमोनी ड्राफ्ट और सुरक्षित सुविधाएँ इस्तेमाल कर सकते हैं।'
                : 'OTP लॉगिन कनेक्ट होने के बाद निजी प्रोफाइल सेव और सबमिट किए जा सकेंगे।'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>मेरी सुविधाएँ</Text>

        <Pressable style={styles.menuCard} onPress={() => router.push('/my-matrimony')}>
          <View style={styles.menuIcon}>
            <SymbolView name={{ ios: 'person.crop.circle.badge.heart', android: 'person_search', web: 'person_search' }} tintColor={C.maroon} size={27} />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitle}>मेरे मैट्रिमोनी प्रोफाइल</Text>
            <Text style={styles.menuText}>ड्राफ्ट बनाएँ, एडिट करें और स्वीकृति के लिए भेजें</Text>
          </View>
          <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor="#A88E81" size={20} />
        </Pressable>

        <View style={styles.menuCardMuted}>
          <View style={styles.menuIconMuted}>
            <SymbolView name={{ ios: 'person.text.rectangle', android: 'badge', web: 'badge' }} tintColor="#8B7F78" size={26} />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitleMuted}>समाज सदस्य प्रोफाइल</Text>
            <Text style={styles.menuText}>अगले चरण में personal/community profile details</Text>
          </View>
        </View>

        {!accessToken ? (
          <View style={styles.nextStepBox}>
            <Text style={styles.nextStepTitle}>अगला तकनीकी चरण</Text>
            <Text style={styles.nextStepText}>फोन OTP authentication जोड़ना है। उसके बाद यही मैट्रिमोनी create/edit/submit flow पूरी तरह live हो जाएगा।</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { flex: 1, padding: 18 },
  eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: C.maroonDark, fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 5 },
  subtitle: { color: C.muted, fontSize: 12.5, lineHeight: 19, marginTop: 5 },

  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 14, borderRadius: 17, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  accountIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF1EA' },
  accountCopy: { flex: 1 },
  accountTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  accountText: { color: C.muted, fontSize: 10.5, lineHeight: 16, marginTop: 3 },

  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '900', marginTop: 22, marginBottom: 9 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, marginBottom: 9 },
  menuCardMuted: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, backgroundColor: '#F8F4EF', borderWidth: 1, borderColor: '#E9E0D8' },
  menuIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' },
  menuIconMuted: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE8E2' },
  menuCopy: { flex: 1 },
  menuTitle: { color: C.maroonDark, fontSize: 13, fontWeight: '900' },
  menuTitleMuted: { color: '#605650', fontSize: 13, fontWeight: '900' },
  menuText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },

  nextStepBox: { marginTop: 18, padding: 13, borderRadius: 14, backgroundColor: '#FFF5E8', borderWidth: 1, borderColor: '#F0D8B1' },
  nextStepTitle: { color: '#8A5A12', fontSize: 11, fontWeight: '900' },
  nextStepText: { color: '#7D6848', fontSize: 10.5, lineHeight: 16, marginTop: 3 },
});
