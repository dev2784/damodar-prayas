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
import { useLanguageText } from '@/hooks/use-language-text';

export default function ProfileScreen() {
  const { text } = useLanguageText();
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
        <Text style={styles.title}>{text('मेरा प्रोफाइल', 'My profile')}</Text>
        <Text style={styles.subtitle}>{text('समाज, मैट्रिमोनी और अकाउंट सेटिंग्स एक जगह।', 'Community, matrimony and account settings in one place.')}</Text>
        {!hydrated || (accessToken && isLoading) ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={C.maroon} />
            <Text style={styles.loadingText}>{text('अकाउंट लोड हो रहा है...', 'Loading account...')}</Text>
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
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || text('समाज सदस्य', 'Community member')}
                </Text>
                <Text style={styles.accountPhone}>{user?.phone || text('लॉगिन सक्रिय है', 'Login active')}</Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <View style={styles.accountDivider} />
            <Text style={styles.accountHint}>
              {text('आपके account से जुड़ी matrimony profiles यहाँ उपलब्ध रहेंगी।', 'Matrimony profiles linked to your account will be available here.')}
            </Text>
          </View>
        ) : (
          <View style={styles.guestCard}>
            <Text style={styles.guestTitle}>{text('अपना Damodar Prayas अकाउंट शुरू करें', 'Start your Damodar Prayas account')}</Text>
            <Text style={styles.guestText}>
              {text('लॉगिन के बाद matrimony और community सुविधाएँ आपके account से जुड़ेंगी।', 'After login, matrimony and community features will be linked to your account.')}
            </Text>
            <View style={styles.authActions}>
              <Pressable
                style={styles.loginButton}
                onPress={() => router.push({ pathname: '/auth', params: { mode: 'login' } })}
              >
                <Text style={styles.loginText}>{text('लॉगिन', 'Login')}</Text>
              </Pressable>
              <Pressable
                style={styles.registerButton}
                onPress={() => router.push({ pathname: '/auth', params: { mode: 'register' } })}
              >
                <Text style={styles.registerText}>{text('नया अकाउंट बनाएँ', 'Create account')}</Text>
              </Pressable>
            </View>
          </View>
        )}
        <Text style={styles.sectionTitle}>{text('मेरी सुविधाएँ', 'My services')}</Text>
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
            <Text style={styles.menuTitle}>{text('मेरे मैट्रिमोनी प्रोफाइल', 'My matrimony profiles')}</Text>
            <Text style={styles.menuText}>
              {accessToken
                ? text('मेरे account से जुड़ी matrimony profiles देखें और manage करें', 'View and manage matrimony profiles linked to my account')
                : 'पहले account बनाएँ, फिर matrimony profile शुरू करें'}
            </Text>
          </View>
          <Text>›</Text>
        </Pressable>
        {accessToken ? (
          <Pressable style={styles.menuCard} onPress={() => router.push('/change-password')}>
            <View style={styles.menuCopy}>
              <Text style={styles.menuTitle}>{text('Password बदलें', 'Change password')}</Text>
              <Text style={styles.menuText}>
                {text('Temporary या current password को अपने private password से बदलें', 'Replace your temporary or current password with a private password')}
              </Text>
            </View>
            <Text>›</Text>
          </Pressable>
        ) : null}
        <View style={styles.menuCardMuted}>
          <View style={styles.menuCopy}>
            <Text style={styles.menuTitleMuted}>{text('समाज सदस्य प्रोफाइल', 'Community member profile')}</Text>
            <Text style={styles.menuText}>अगले चरण में personal/community profile details</Text>
          </View>
        </View>
        {accessToken ? (
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>{text('लॉगआउट', 'Logout')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
