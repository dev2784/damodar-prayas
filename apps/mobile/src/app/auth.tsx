import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { setAccessToken } from '@/features/auth/auth-slice';
import { saveAccessToken } from '@/lib/auth-storage';
import { api } from '@/services/api';
import { useLoginMutation, useRegisterMutation } from '@/services/auth-api';
import { useAppDispatch } from '@/store/hooks';

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
  red: '#B42318',
};

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
  if (data?.error === 'ACCOUNT_EXISTS') return 'इस मोबाइल नंबर से अकाउंट पहले से बना हुआ है। लॉगिन करें।';
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
  const params = useLocalSearchParams<{ next?: string | string[]; mode?: string | string[] }>();
  const nextParam = Array.isArray(params.next) ? params.next[0] : params.next;
  const initialMode = (Array.isArray(params.mode) ? params.mode[0] : params.mode) === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<Mode>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const dispatch = useAppDispatch();
  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const busy = loggingIn || registering;

  function destination() {
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

  async function submit() {
    const normalizedPhone = normalizePhone(phone);

    if (!/^\+?[1-9]\d{7,14}$/.test(normalizedPhone)) {
      Alert.alert('मोबाइल नंबर जाँचें', '10 अंकों का भारतीय मोबाइल नंबर या country code सहित नंबर भरें।');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      Alert.alert('पासवर्ड मजबूत रखें', 'कम से कम 8 अक्षर रखें और उसमें एक letter और एक number जरूर हो।');
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
      Alert.alert(mode === 'register' ? 'अकाउंट नहीं बन पाया' : 'लॉगिन नहीं हुआ', errorMessage(error));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>DAMODAR PRAYAS</Text>
            <Text style={styles.title}>समाज से जुड़ें</Text>
            <Text style={styles.subtitle}>एक अकाउंट से community और matrimony दोनों सुविधाएँ।</Text>
          </View>
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <SymbolView name={{ ios: 'lock.shield.fill', android: 'shield', web: 'shield' }} tintColor={C.green} size={25} />
          </View>
          <View style={styles.trustCopy}>
            <Text style={styles.trustTitle}>आपकी जानकारी निजी रखी जाएगी</Text>
            <Text style={styles.trustText}>मोबाइल नंबर और संपर्क विवरण public matrimony listing में सीधे नहीं दिखेंगे।</Text>
          </View>
        </View>

        <View style={styles.authCard}>
          <View style={styles.segment}>
            <Pressable style={[styles.segmentButton, mode === 'login' && styles.segmentActive]} onPress={() => setMode('login')}>
              <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>लॉगिन</Text>
            </Pressable>
            <Pressable style={[styles.segmentButton, mode === 'register' && styles.segmentActive]} onPress={() => setMode('register')}>
              <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>नया अकाउंट</Text>
            </Pressable>
          </View>

          <Text style={styles.formTitle}>{mode === 'login' ? 'वापस स्वागत है' : 'अपना अकाउंट बनाएँ'}</Text>
          <Text style={styles.formSubtitle}>
            {mode === 'login'
              ? 'अपने मोबाइल नंबर और पासवर्ड से लॉगिन करें।'
              : 'पहले basic account बनाएँ, फिर matrimony profile अलग से भरें।'}
          </Text>

          {mode === 'register' ? (
            <>
              <View style={styles.twoCol}>
                <View style={styles.col}><Field label="पहला नाम" value={firstName} onChangeText={setFirstName} autoCapitalize="words" /></View>
                <View style={styles.col}><Field label="उपनाम" value={lastName} onChangeText={setLastName} autoCapitalize="words" /></View>
              </View>
              <Field label="ईमेल (वैकल्पिक)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="name@example.com" />
            </>
          ) : null}

          <Field label="मोबाइल नंबर" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="9876543210" />
          <Field label="पासवर्ड" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" placeholder="कम से कम 8 अक्षर" />

          {mode === 'register' ? (
            <Field label="पासवर्ड दोबारा" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoCapitalize="none" />
          ) : null}

          <Pressable disabled={busy} style={[styles.submitButton, busy && styles.disabled]} onPress={submit}>
            {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
              <>
                <Text style={styles.submitText}>{mode === 'login' ? 'लॉगिन करें' : 'अकाउंट बनाएँ'}</Text>
                <SymbolView name={{ ios: 'arrow.right.circle.fill', android: 'arrow_forward', web: 'arrow_forward' }} tintColor="#FFFFFF" size={19} />
              </>
            )}
          </Pressable>

          <Text style={styles.helperText}>भारतीय 10 digit नंबर डालने पर +91 अपने आप जोड़ा जाएगा।</Text>
        </View>

        <View style={styles.otpNote}>
          <SymbolView name={{ ios: 'message.fill', android: 'sms', web: 'sms' }} tintColor={C.gold} size={18} />
          <Text style={styles.otpText}>OTP verification अगला security upgrade रहेगा। अभी account login password से काम करेगा।</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { padding: 17, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginBottom: 15 },
  backButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  headerCopy: { flex: 1, paddingTop: 1 },
  eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.15 },
  title: { color: C.maroonDark, fontSize: 27, lineHeight: 33, fontWeight: '900', marginTop: 3 },
  subtitle: { color: C.muted, fontSize: 11.5, lineHeight: 18, marginTop: 3 },

  trustCard: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 13, borderRadius: 16, backgroundColor: '#F2FBF6', borderWidth: 1, borderColor: '#D0ECDD', marginBottom: 12 },
  trustIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E2F6EA' },
  trustCopy: { flex: 1 },
  trustTitle: { color: '#145B43', fontSize: 11.5, fontWeight: '900' },
  trustText: { color: '#4C7566', fontSize: 9.8, lineHeight: 15, marginTop: 2 },

  authCard: { padding: 15, borderRadius: 19, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  segment: { flexDirection: 'row', backgroundColor: '#F6EEE7', padding: 4, borderRadius: 13, marginBottom: 17 },
  segmentButton: { flex: 1, minHeight: 39, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: C.maroon },
  segmentText: { color: '#776A64', fontSize: 11, fontWeight: '900' },
  segmentTextActive: { color: '#FFFFFF' },
  formTitle: { color: C.text, fontSize: 18, fontWeight: '900' },
  formSubtitle: { color: C.muted, fontSize: 10.5, lineHeight: 16, marginTop: 4, marginBottom: 14 },
  fieldBlock: { marginBottom: 11 },
  label: { color: C.text, fontSize: 10.5, fontWeight: '900', marginBottom: 5 },
  input: { minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: '#DED1C6', backgroundColor: '#FFFCF8', paddingHorizontal: 12, color: C.text, fontSize: 12 },
  twoCol: { flexDirection: 'row', gap: 9 },
  col: { flex: 1, minWidth: 0 },
  submitButton: { minHeight: 50, borderRadius: 14, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 3 },
  disabled: { opacity: 0.55 },
  submitText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' },
  helperText: { color: C.muted, fontSize: 9.2, lineHeight: 14, textAlign: 'center', marginTop: 9 },

  otpNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginTop: 12, borderRadius: 14, backgroundColor: '#FFF5E8', borderWidth: 1, borderColor: '#F0D8B1' },
  otpText: { flex: 1, color: '#796445', fontSize: 9.8, lineHeight: 15 },
});
