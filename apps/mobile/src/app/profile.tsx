import { C, styles } from '@/styles/profile.styles';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAccessToken } from '@/features/auth/auth-slice';
import { clearAccessToken } from '@/lib/auth-storage';
import { api } from '@/services/api';
import { useGetMeQuery } from '@/services/auth-api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function ProfileScreen() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
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
                <SymbolView
                  name={{
                    ios: 'person.crop.circle.fill',
                    android: 'account_circle',
                    web: 'account_circle',
                  }}
                  tintColor={C.maroon}
                  size={42}
                />
              </View>
              <View style={styles.accountCopy}>
                <Text style={styles.accountTitle}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'समाज सदस्य'}
                </Text>
                <Text style={styles.accountPhone}>{user?.phone || 'लॉगिन सक्रिय है'}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.accountDivider} />
            <Text style={styles.accountHint}>
              आपके account से जुड़ी matrimony profiles यहाँ उपलब्ध रहेंगी।
            </Text>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>अपना Damodar Prayas अकाउंट शुरू करें</Text>
            <Text style={styles.guestText}>
              लॉगिन के बाद matrimony और community सुविधाएँ आपके account से जुड़ेंगी।
            </Text>
            <View style={styles.authActions}>
              <Pressable
                style={styles.loginButton}
                onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })}
              >
                <Text style={styles.loginText}>लॉगिन</Text>
              </Pressable>
              <Pressable
                style={styles.registerButton}
                onPress={() => router.push({ pathname: '/auth', params: { mode: 'register' } })}
              >
                <Text style={styles.registerText}>नया अकाउंट बनाएँ</Text>
              </Pressable>
            </View>
          </View>
        )}
        <Text style={styles.sectionTitle}>मेरी सुविधाएँ</Text>
        <Pressable
          style={styles.menuCard}
          onPress={() =>
            accessToken
              ? router.push('/my-matrimony')
              : router.push({
                  pathname: '/auth',
                  params: { mode: 'register', next: '/my-matrimony' },
                })
          }
        >
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitle}>मेरे मैट्रिमोनी प्रोफाइल</Text>
            <Text style={styles.menuText}>
              {accessToken
                ? 'मेरे account से जुड़ी matrimony profiles देखें और manage करें'
                : 'पहले account बनाएँ, फिर matrimony profile शुरू करें'}
            </Text>
          </View>
          <Text>›</Text>
        </Pressable>
        {accessToken ? (
          <Pressable style={styles.menuCard} onPress={() => router.push('/change-password')}>
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>Password बदलें</Text>
              <Text style={styles.menuText}>
                Temporary या current password को अपने private password से बदलें
              </Text>
            </View>
            <Text>›</Text>
          </Pressable>
        ) : null}
        <View style={styles.menuCardMuted}>
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitleMuted}>समाज सदस्य प्रोफाइल</Text>
            <Text style={styles.menuText}>अगले चरण में personal/community profile details</Text>
          </View>
        </View>
        {accessToken ? (
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>लॉगआउट</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
