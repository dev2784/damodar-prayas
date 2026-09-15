import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setAccessToken } from '@/features/auth/auth-slice';
import { clearAccessToken } from '@/lib/auth-storage';
import { api } from '@/services/api';
import { useGetMeQuery } from '@/services/auth-api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

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
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const { data, isLoading } = useGetMeQuery(undefined, { skip: !accessToken });
  const user = data?.user;

  async function logout() {
    await clearAccessToken();
    dispatch(setAccessToken(null));
    dispatch(api.util.resetApiState());
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>DAMODAR PRAYAS ACCOUNT</Text>
        <Text style={styles.title}>मेरा प्रोफाइल</Text>
        <Text style={styles.subtitle}>समाज, मैट्रिमोनी और अकाउंट सेटिंग्स एक जगह।</Text>

        {!hydrated || (accessToken && isLoading) ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={C.maroon} />
            <Text style={styles.loadingText}>अकाउंट लोड हो रहा है...</Text>
          </View>
        ) : accessToken ? (
          <View style={styles.accountCard}>
            <View style={styles.accountTop}>
              <View style={styles.accountIconVerified}>
                <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} tintColor={C.maroon} size={42} />
              </View>
              <View style={styles.accountCopy}>
                <Text style={styles.accountTitle}>{[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'समाज सदस्य'}</Text>
                <Text style={styles.accountPhone}>{user?.phone || 'लॉगिन सक्रिय है'}</Text>
              </View>
              <View style={styles.statusPill}>
                <SymbolView name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} tintColor={C.green} size={14} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>

            <View style={styles.accountDivider} />
            <Text style={styles.accountHint}>अब आप मैट्रिमोनी प्रोफाइल बना, सेव और approval के लिए भेज सकते हैं।</Text>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <View style={styles.guestIcon}>
              <SymbolView name={{ ios: 'person.badge.key.fill', android: 'login', web: 'login' }} tintColor={C.maroon} size={34} />
            </View>
            <Text style={styles.guestTitle}>अपना Damodar Prayas अकाउंट शुरू करें</Text>
            <Text style={styles.guestText}>लॉगिन के बाद private matrimony draft, shortlist और आगे की community सुविधाएँ आपके अकाउंट से जुड़ेंगी।</Text>

            <View style={styles.authActions}>
              <Pressable style={styles.loginButton} onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })}>
                <Text style={styles.loginText}>लॉगिन</Text>
              </Pressable>
              <Pressable style={styles.registerButton} onPress={() => router.push({ pathname: '/auth', params: { mode: 'register' } })}>
                <Text style={styles.registerText}>नया अकाउंट बनाएँ</Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>मेरी सुविधाएँ</Text>

        <Pressable
          style={styles.menuCard}
          onPress={() => accessToken
            ? router.push('/my-matrimony')
            : router.push({ pathname: '/auth', params: { mode: 'register', next: '/my-matrimony' } })}>
          <View style={styles.menuIcon}>
            <SymbolView name={{ ios: 'person.crop.circle.badge.heart', android: 'person_search', web: 'person_search' }} tintColor={C.maroon} size={27} />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitle}>मेरे मैट्रिमोनी प्रोफाइल</Text>
            <Text style={styles.menuText}>{accessToken ? 'ड्राफ्ट बनाएँ, एडिट करें और स्वीकृति के लिए भेजें' : 'पहले अकाउंट बनाएँ, फिर matrimony profile शुरू करें'}</Text>
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

        {accessToken ? (
          <Pressable style={styles.logoutButton} onPress={logout}>
            <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} tintColor={C.maroon} size={18} />
            <Text style={styles.logoutText}>लॉगआउट</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { padding: 18, paddingBottom: 110 },
  eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: C.maroonDark, fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 5 },
  subtitle: { color: C.muted, fontSize: 12.5, lineHeight: 19, marginTop: 5 },

  loadingCard: { minHeight: 100, marginTop: 18, borderRadius: 17, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { color: C.muted, fontSize: 10.5, fontWeight: '700' },

  accountCard: { marginTop: 18, padding: 14, borderRadius: 17, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  accountTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  accountIconVerified: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' },
  accountCopy: { flex: 1 },
  accountTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  accountPhone: { color: C.muted, fontSize: 10.5, marginTop: 3 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 11, backgroundColor: '#EAF8F0', paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { color: C.green, fontSize: 8.5, fontWeight: '900' },
  accountDivider: { height: 1, backgroundColor: '#EEE3D9', marginVertical: 11 },
  accountHint: { color: C.muted, fontSize: 10.5, lineHeight: 16 },

  guestCard: { marginTop: 18, padding: 16, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, alignItems: 'center' },
  guestIcon: { width: 58, height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' },
  guestTitle: { color: C.maroonDark, fontSize: 16, fontWeight: '900', textAlign: 'center', marginTop: 11 },
  guestText: { color: C.muted, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  authActions: { width: '100%', gap: 8, marginTop: 14 },
  loginButton: { minHeight: 46, borderRadius: 13, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  registerButton: { minHeight: 45, borderRadius: 13, borderWidth: 1, borderColor: '#DDBDB6', backgroundColor: '#FFF8F5', alignItems: 'center', justifyContent: 'center' },
  registerText: { color: C.maroon, fontSize: 12, fontWeight: '900' },

  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '900', marginTop: 22, marginBottom: 9 },
  menuCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, marginBottom: 9 },
  menuCardMuted: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, backgroundColor: '#F8F4EF', borderWidth: 1, borderColor: '#E9E0D8' },
  menuIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' },
  menuIconMuted: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEE8E2' },
  menuCopy: { flex: 1 },
  menuTitle: { color: C.maroonDark, fontSize: 13, fontWeight: '900' },
  menuTitleMuted: { color: '#605650', fontSize: 13, fontWeight: '900' },
  menuText: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },

  logoutButton: { minHeight: 46, marginTop: 18, borderRadius: 13, borderWidth: 1, borderColor: '#E6C6C0', backgroundColor: '#FFF8F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  logoutText: { color: C.maroon, fontSize: 11.5, fontWeight: '900' },
});
