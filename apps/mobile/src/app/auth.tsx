import { C, styles } from '@/styles/auth.styles';
import { useState } from 'react';
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
import { useLoginMutation, useRegisterMutation } from '@/services/auth-api';
import { useAppDispatch } from '@/store/hooks';

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
  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const [register, { isLoading: registering }] = useRegisterMutation();
  const busy = loggingIn || registering;

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

  async function submit() {
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
            <Text style={styles.title}>समाज से जुड़ें</Text>
            <Text style={styles.subtitle}>एक अकाउंट से community और matrimony दोनों सुविधाएँ।</Text>
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
            <Text style={styles.trustTitle}>आपकी जानकारी निजी रखी जाएगी</Text>
            <Text style={styles.trustText}>
              मोबाइल नंबर और संपर्क विवरण public matrimony listing में सीधे नहीं दिखेंगे।
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
                लॉगिन
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segmentButton, mode === 'register' && styles.segmentActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>
                नया अकाउंट
              </Text>
            </Pressable>
          </View>

          <Text style={styles.formTitle}>
            {mode === 'login' ? 'वापस स्वागत है' : 'अपना अकाउंट बनाएँ'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'login'
              ? 'अपने मोबाइल नंबर और पासवर्ड से लॉगिन करें।'
              : 'पहले basic account बनाएँ, फिर matrimony profile अलग से भरें।'}
          </Text>

          {mode === 'register' ? (
            <>
              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Field
                    label="पहला नाम"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.col}>
                  <Field
                    label="उपनाम"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <Field
                label="ईमेल (वैकल्पिक)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="name@example.com"
              />
            </>
          ) : null}

          <Field
            label="मोबाइल नंबर"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="9876543210"
          />
          <Field
            label="पासवर्ड"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            placeholder="कम से कम 8 अक्षर"
          />

          {mode === 'register' ? (
            <Field
              label="पासवर्ड दोबारा"
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
                  {mode === 'login' ? 'लॉगिन करें' : 'अकाउंट बनाएँ'}
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

          <Text style={styles.helperText}>
            भारतीय 10 digit नंबर डालने पर +91 अपने आप जोड़ा जाएगा।
          </Text>
        </View>

        <View style={styles.otpNote}>
          <SymbolView
            name={{ ios: 'message.fill', android: 'sms', web: 'sms' }}
            tintColor={C.gold}
            size={18}
          />
          <Text style={styles.otpText}>
            OTP verification अगला security upgrade रहेगा। अभी account login password से काम करेगा।
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
