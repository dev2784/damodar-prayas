import { C, styles } from '@/styles/auth.styles';
import { useState } from 'react';
import Constants from 'expo-constants';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setAccessToken } from '@/features/auth/auth-slice';
import { saveAccessToken } from '@/lib/auth-storage';
import { isValidNewPassword } from '@/lib/password';
import { api } from '@/services/api';
import { useLoginMutation, useRegisterMutation, useGoogleLoginMutation, useGoogleRegisterMutation } from '@/services/auth-api';
import { useAppDispatch } from '@/store/hooks';
import { useLanguageText } from '@/hooks/use-language-text';

type Mode = 'login' | 'register';

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return trimmed;
}

function errorMessage(error: unknown) {
  if (typeof error !== 'object' || !error || !('data' in error)) {
    return 'कुछ गलत हुआ। कृपया दोबारा कोशिश करें।';
  }

  const data = (error as { data?: { message?: string; error?: string } }).data;
  if (data?.error === 'ACCOUNT_EXISTS')
    return 'इस मोबाइल नंबर से अकाउंट पहले से बना हुआ है। लॉगिन करें।';
  if (data?.error === 'INVALID_CREDENTIALS') return 'मोबाइल नंबर या पासवर्ड सही नहीं है।';
  return data?.message || 'कुछ गलत हुआ। कृपया दोबारा कोशिश करें।';
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'words';
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A79A94"
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={styles.input}
      />
    </View>
  );
}

export default function AuthScreen() {
  const { text } = useLanguageText();
  const params = useLocalSearchParams<{ next?: string | string[]; mode?: string | string[] }>();
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const initialMode =
    (Array.isArray(params.mode) ? params.mode[0] : params.mode) === 'register'
      ? 'register'
      : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useAppDispatch();
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [googleLogin] = useGoogleLoginMutation();
  const [googleRegister] = useGoogleRegisterMutation();
  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const busy = loggingIn || registering || googleBusy;

  function destination() {
    if (nextParam === '/change-password') return '/change-password' as const;
    if (nextParam === '/matrimony-form') return '/matrimony-form' as const;
    if (nextParam === '/my-matrimony') return '/my-matrimony' as const;
    return '/profile' as const;
  }

  async function completeAuth(accessToken: string) {
    await saveAccessToken(accessToken);
    dispatch(setAccessToken(accessToken));
    dispatch(api.util.invalidateTags(['Me', 'Matrimony']));
    router.replace(destination());
  }

  async function signInWithGoogle() {
    if (Constants.appOwnership === 'expo') {
      Alert.alert(text('नई APK जरूरी है', 'New APK required'), text('Google Login Expo Go में नहीं चलेगा। Preview APK इस्तेमाल करें।', 'Google Sign-In requires a preview APK, not Expo Go.'));
      return;
    }
    setGoogleBusy(true);
    try {
      const { GoogleSignin, isSuccessResponse } = await import('@react-native-google-signin/google-signin');
      GoogleSignin.configure({ webClientId: '151769542887-313fspli1cj3m2628v1un0l8nvrijio0.apps.googleusercontent.com' });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return;
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('Google did not return an ID token.');
      try {
        const result = await googleLogin({ idToken }).unwrap();
        await completeAuth(result.accessToken);
      } catch (error) {
        const data = (error as { data?: { error?: string } })?.data;
        if (data?.error === 'GOOGLE_REGISTRATION_REQUIRED') {
          setGoogleToken(idToken);
          setGoogleEmail(response.data.user.email || null);
          setFirstName(response.data.user.givenName || '');
          setLastName(response.data.user.familyName || '');
          setMode('register');
        } else {
          Alert.alert(text('Google Login नहीं हुआ', 'Google sign-in failed'), errorMessage(error));
        }
      }
    } catch (error) {
      Alert.alert(text('Google Login नहीं हुआ', 'Google sign-in failed'), error instanceof Error ? error.message : text('फिर कोशिश करें।', 'Please try again.'));
    } finally { setGoogleBusy(false); }
  }

  async function submitGoogleRegistration() {
    if (!googleToken) return;
    const normalized = normalizePhone(phone);
    if (!/^\+?[1-9]\d{7,14}$/.test(normalized) || !firstName.trim() || !lastName.trim()) {
      Alert.alert(text('जानकारी पूरी करें', 'Complete details'), text('सही मोबाइल नंबर और पूरा नाम भरें।', 'Enter a valid mobile number and full name.'));
      return;
    }
    setGoogleBusy(true);
    try {
      const result = await googleRegister({ idToken: googleToken, phone: normalized, firstName: firstName.trim(), lastName: lastName.trim() }).unwrap();
      setGoogleToken(null);
      setGoogleEmail(null);
      await completeAuth(result.accessToken);
    } catch (error) { Alert.alert(text('अकाउंट नहीं बन पाया', 'Registration failed'), errorMessage(error)); }
    finally { setGoogleBusy(false); }
  }

  async function submit() {
    if (googleToken) return submitGoogleRegistration();
    const normalizedPhone = normalizePhone(phone);

    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
      Alert.alert(
        'मोबाइल नंबर जाँचें',
        '10 अंकों का भारतीय मोबाइल नंबर या country code सहित नंबर भरें।',
      );
      return;
    }

    if (mode === 'register' && !isValidNewPassword(password)) {
      Alert.alert(
        'पासवर्ड मजबूत रखें',
        'कम से कम 8 अक्षर रखें और उसमें एक letter और एक number जरूर हो।',
      );
      return;
    }

    try {
      if (mode === 'register') {
        if (!firstName.trim() || !lastName.trim()) {
          Alert.alert('नाम जरूरी है', 'पहला नाम और उपनाम भरें।');
          return;
        }
        if (password !== confirmPassword) {
          Alert.alert('पासवर्ड मैच नहीं हुआ', 'दोनों पासवर्ड एक जैसे भरें।');
          return;
        }

        const result = await register({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: normalizedPhone,
          email: email.trim() || null,
          password,
        }).unwrap();
        await completeAuth(result.accessToken);
        return;
      }

      const result = await login({ phone: normalizedPhone, password }).unwrap();
      await completeAuth(result.accessToken);
    } catch (error) {
      Alert.alert(
        mode === 'register' ? 'अकाउंट नहीं बन पाया' : 'लॉगिन नहीं हुआ',
        errorMessage(error),
      );
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={C.maroon}
              size={22}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DAMODAR PRAYAS</Text>
            <Text style={styles.title}>{text('समाज से जुड़ें', 'Join the community')}</Text>
            <Text style={styles.subtitle}>{text('एक अकाउंट से community और matrimony दोनों सुविधाएँ।', 'One account for both community and matrimony features.')}</Text>
          </View>
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <SymbolView
              name={{ ios: 'lock.shield.fill', android: 'shield', web: 'shield' }}
              tintColor={C.green}
              size={25}
            />
          </View>
          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>{text('आपकी जानकारी निजी रखी जाएगी', 'Your information will remain private')}</Text>
            <Text style={styles.trustText}>
              {text('मोबाइल नंबर और संपर्क विवरण public matrimony listing में सीधे नहीं दिखेंगे।', 'Your mobile number and contact details will not be shown directly in public matrimony listings.')}
            </Text>
          </View>
        </View>

        <View style={styles.authCard}>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentButton, mode === 'login' && styles.segmentActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
                {text('लॉगिन', 'Login')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, mode === 'register' && styles.segmentActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>
                {text('नया अकाउंट', 'New account')}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.formTitle}>
            {mode === 'login' ? text('वापस स्वागत है', 'Welcome back') : text('अपना अकाउंट बनाएँ', 'Create your account')}
          </Text>
          {googleToken ? <Text style={styles.formSubtitle}>{text('Google account चुना गया है। मोबाइल नंबर और नाम भरकर registration पूरा करें। मौजूदा अकाउंट है तो पहले पुराने तरीके से login करके Google link करें।', 'Google account selected. Enter your name and mobile number. If you already have an account, log in normally first and link Google.')}</Text> : null}
          <Text style={styles.formSubtitle}>
            {mode === 'login'
              ? text('अपने मोबाइल नंबर और पासवर्ड से लॉगिन करें।', 'Log in with your mobile number and password.')
              : text('पहले basic account बनाएँ, फिर matrimony profile अलग से भरें।', 'Create a basic account first, then fill your matrimony profile separately.')}
          </Text>

          {mode === 'register' ? (
            <>
              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Field
                    label={text('पहला नाम', 'First name')}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.col}>
                  <Field
                    label={text('उपनाम', 'Last name')}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              {googleToken ? (
                <View style={styles.fieldBlock}>
                  <Text style={styles.label}>{text('Google ईमेल (स्वतः प्राप्त)', 'Google email (automatic)')}</Text>
                  <Text style={styles.formSubtitle}>{googleEmail || text('Google से ईमेल उपलब्ध नहीं है', 'Google did not provide an email')}</Text>
                </View>
              ) : (
                <Field
                  label={text('ईमेल (वैकल्पिक)', 'Email (optional)')}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="name@example.com"
                />
              )}
            </>
          ) : null}

          <Field
            label={text('मोबाइल नंबर', 'Mobile number')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="9876543210"
          />
          {!googleToken ? <Field
            label={text('पासवर्ड', 'Password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder={text('कम से कम 8 अक्षर', 'At least 8 characters')}
          /> : null}

          {mode === 'register' && !googleToken ? (
            <Field
              label={text('पासवर्ड दोबारा', 'Confirm password')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          ) : null}

          <Pressable
            disabled={busy}
            style={[styles.submitButton, busy && styles.disabled]}
            onPress={submit}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitText}>
                  {googleToken ? text('Google Registration पूरा करें', 'Complete Google registration') : mode === 'login' ? text('लॉगिन करें', 'Login') : text('अकाउंट बनाएँ', 'Create account')}
                </Text>
                <SymbolView
                  name={{
                    ios: 'arrow.right.circle.fill',
                    android: 'arrow_forward',
                    web: 'arrow_forward',
                  }}
                  tintColor="#FFFFFF"
                  size={19}
                />
              </>
            )}
          </Pressable>

          {googleToken ? <Pressable onPress={() => { setGoogleToken(null); setGoogleEmail(null); setMode('login'); }}><Text style={styles.helperText}>{text('पुराने अकाउंट से लॉगिन करें', 'Sign in with existing account')}</Text></Pressable> : null}
          <View style={{ marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: C.line }}>
            <Pressable disabled={busy} onPress={() => void signInWithGoogle()} style={{ minHeight: 48, borderWidth: 1, borderColor: C.line, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
              {googleBusy ? <ActivityIndicator /> : <Text style={{ color: C.text, fontWeight: '800' }}>{text('Google से जारी रखें', 'Continue with Google')}</Text>}
            </Pressable>
          </View>
          <Text style={styles.helperText}>
            {text('भारतीय 10 digit नंबर डालने पर +91 अपने आप जोड़ा जाएगा।', '+91 will be added automatically for a 10-digit Indian number.')}
          </Text>
        </View>

        <View style={styles.otpNote}>
          <SymbolView
            name={{ ios: 'message.fill', android: 'sms', web: 'sms' }}
            tintColor={C.gold}
            size={18}
          />
          <Text style={styles.otpText}>
            {text('OTP verification अगला security upgrade रहेगा। अभी account login password से काम करेगा।', 'OTP verification will be a future security upgrade. For now, login works with a password.')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
