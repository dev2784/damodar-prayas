import { C, styles } from '@/styles/profile.styles';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setAccessToken } from '@/features/auth/auth-slice';
import { clearAccessToken } from '@/lib/auth-storage';
import { api } from '@/services/api';
import { useGetMeQuery } from '@/services/auth-api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useLanguageText } from '@/hooks/use-language-text';
import { useUnregisterPushTokenMutation } from '@/services/push-api';
import Constants from 'expo-constants';
import { useGoogleLinkMutation } from '@/services/auth-api';
import * as Device from 'expo-device';
import { useGetAccountDeleteRequestQuery, useRequestAccountDeletionMutation } from '@/services/account-api';

export default function ProfileScreen() {
  const { text } = useLanguageText();
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const { data, isLoading } = useGetMeQuery(undefined, { skip: !accessToken });
  const user = data?.user;
  const [linkGoogle, { isLoading: linkingGoogle }] = useGoogleLinkMutation();
  async function connectGoogle() {
    if (Constants.appOwnership === 'expo') { Alert.alert('Google Sign-In', text('Preview APK में उपलब्ध है।', 'Available in preview APK.')); return; }
    try {
      const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: '151769542887-313fspli1cj3m2628v1un0l8nvrijio0.apps.googleusercontent.com' });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response) || !response.data.idToken) return;
      await linkGoogle({ idToken: response.data.idToken }).unwrap();
      Alert.alert(text('Google जुड़ गया', 'Google linked'), text('अब आप Google से भी लॉगिन कर सकते हैं।', 'You can now sign in with Google.'));
    } catch { Alert.alert(text('Google नहीं जुड़ा', 'Could not link Google'), text('यह Google account किसी अन्य सदस्य से जुड़ा हो सकता है।', 'This Google account may already be linked to another member.')); }
  }
  const [unregisterPushToken] = useUnregisterPushTokenMutation();
  const { data: deleteRequestData } = useGetAccountDeleteRequestQuery(undefined, { skip: !accessToken });
  const [requestAccountDeletion, { isLoading: requestingDeletion }] = useRequestAccountDeletionMutation();

  function confirmAccountDeletionRequest() {
    if (deleteRequestData?.request?.status === 'PENDING') {
      Alert.alert(text('अनुरोध पहले से भेजा गया है', 'Request already sent'), text('आपका account deletion request admin review में है।', 'Your account deletion request is under admin review.'));
      return;
    }
    Alert.alert(
      text('Account delete request भेजें?', 'Request account deletion?'),
      text('Admin review के बाद आपका Damodar Prayas account और उससे जुड़ी personal जानकारी हटाई जाएगी।', 'After admin review, your Damodar Prayas account and associated personal information will be removed.'),
      [
        { text: text('रद्द करें', 'Cancel'), style: 'cancel' },
        {
          text: text('Request भेजें', 'Send request'),
          style: 'destructive',
          onPress: () => void requestAccountDeletion({}).unwrap()
            .then(() => Alert.alert(text('Request भेज दी गई', 'Request sent'), text('Admin आपके अनुरोध की समीक्षा करेगा।', 'An admin will review your request.')))
            .catch(() => Alert.alert(text('Request नहीं भेजी गई', 'Request failed'), text('कृपया दोबारा कोशिश करें।', 'Please try again.'))),
        },
      ],
    );
  }

  async function logout() {
    if (Device.isDevice && Constants.appOwnership !== 'expo') {
      try {
        const Notifications = await import('expo-notifications');
        const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
        if (projectId) {
          const permission = await Notifications.getPermissionsAsync();
          if (permission.status === 'granted') {
            const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
            await unregisterPushToken({ token }).unwrap();
          }
        }
      } catch {
        // Logout must still succeed if notification cleanup is unavailable.
      }
    }
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
        {accessToken ? <Pressable disabled={linkingGoogle} style={styles.menuCard} onPress={() => void connectGoogle()}><View style={styles.menuCopy}><Text style={styles.menuTitle}>{text('Google अकाउंट लिंक करें', 'Link Google account')}</Text><Text style={styles.menuText}>{text('पुराने अकाउंट से Google Login सुरक्षित रूप से जोड़ें।', 'Securely connect Google to your existing account.')}</Text></View></Pressable> : null}
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
          <Pressable
            style={styles.deleteRequestButton}
            onPress={confirmAccountDeletionRequest}
            disabled={requestingDeletion}
          >
            <Text style={styles.deleteRequestText}>
              {deleteRequestData?.request?.status === 'PENDING'
                ? text('Account delete request pending', 'Account delete request pending')
                : requestingDeletion
                  ? text('Request भेज रहे हैं...', 'Sending request...')
                  : text('Account delete request', 'Account deletion request')}
            </Text>
          </Pressable>
        ) : null}
        {accessToken ? (
          <Pressable style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>{text('लॉगआउट', 'Logout')}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
