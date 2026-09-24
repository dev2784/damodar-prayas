import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAppDispatch } from '@/store/hooks';
import { setAccessToken } from '@/features/auth/auth-slice';
import { saveAccessToken } from '@/lib/auth-storage';
import { api } from '@/services/api';
import { useSendOtpMutation, useVerifyOtpMutation } from '@/services/auth-api';
import { useLanguageText } from '@/hooks/use-language-text';

declare const require: (moduleName: string) => unknown;
type Msg91Widget = {
  initializeWidget: (widgetId: string, tokenAuth: string) => void;
  sendOTP: (data: { identifier: string }) => Promise<unknown>;
  retryOTP: (data: { reqId: string; retryChannel: number }) => Promise<unknown>;
  verifyOTP: (data: { reqId: string; otp: string }) => Promise<unknown>;
};
const { OTPWidget } = require('@msg91comm/sendotp-react-native') as { OTPWidget: Msg91Widget };
const widgetToken = process.env.EXPO_PUBLIC_MSG91_WIDGET_TOKEN ?? '';
const countryCode = process.env.EXPO_PUBLIC_MSG91_COUNTRY_CODE ?? '91';

function assertMsg91Success(value: unknown, action: string): Record<string, unknown> {
  if (!value || typeof value !== 'object') throw new Error(`MSG91 ${action} returned an invalid response.`);
  const payload = value as Record<string, unknown>;
  if (String(payload.type ?? '').toLowerCase() !== 'success') {
    const reason = findString(payload, ['error', 'message', 'description']);
    throw new Error(reason ? `MSG91 ${action} failed: ${reason}` : `MSG91 ${action} failed. Check widget configuration and MSG91 delivery logs.`);
  }
  return payload;
}

function findString(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  for (const key of keys) if (typeof record[key] === 'string') return record[key] as string;
  for (const key of ['data', 'message', 'result']) {
    const nested = findString(record[key], keys);
    if (nested) return nested;
  }
  return null;
}

function otpErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : null;
    if (typeof data?.message === 'string') return data.message;
    if (typeof data?.error === 'string') return data.error;
    if (typeof record.error === 'string') return record.error;
    if (typeof record.status === 'number') return `OTP request failed (HTTP ${record.status}).`;
  }
  return fallback;
}

function findAccessToken(value: unknown, allowMessageFallback = false): string | null {
  const token = findString(value, ['access-token', 'accessToken', 'access_token']);
  if (token && token.length >= 20) return token;
  if (allowMessageFallback && value && typeof value === 'object') {
    const message = (value as Record<string, unknown>).message;
    if (typeof message === 'string' && message.length >= 20) return message;
  }
  return null;
}

function digitsOnly(value: string) { return value.replace(/\D/g, ''); }
function msg91Identifier(phone: string) {
  const digits = digitsOnly(phone);
  return phone.trim().startsWith('+') || digits.startsWith(countryCode) ? digits : `${countryCode}${digits}`;
}

export default function OtpScreen() {
  const { text } = useLanguageText();
  const params = useLocalSearchParams<{ phone?: string; next?: string }>();
  const phone = '8839817483'; // Temporary static number for OTP testing; remove after verification.
  const next = Array.isArray(params.next) ? params.next[0] : params.next;
  const [code, setCode] = useState('');
  const [requestId, setRequestId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);
  const [otpLength, setOtpLength] = useState(4);
  const [otpExpiryMinutes, setOtpExpiryMinutes] = useState(5);
  const [retries, setRetries] = useState(0);
  const [busy, setBusy] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const input = useRef<TextInput>(null);
  const started = useRef(false);
  const widgetReady = useRef(false);
  const dispatch = useAppDispatch();
  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();

  useEffect(() => {
    if (seconds <= 0 && expiresInSeconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((remaining) => Math.max(0, remaining - 1));
      setExpiresInSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds, expiresInSeconds]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;
    const start = async () => {
      if (!phone || !widgetToken) {
        setInitializing(false);
        Alert.alert(text('OTP उपलब्ध नहीं है', 'OTP is not configured'), text('MSG91 widget की सेटिंग उपलब्ध नहीं हैं।', 'MSG91 widget settings are missing from this app build.'));
        return;
      }
      try {
        await sendCode(false);
      } catch (error) {
        Alert.alert(text('OTP नहीं भेजा जा सका', 'Could not send OTP'), otpErrorMessage(error, text('फिर कोशिश करें।', 'Please try again.')));
      } finally { if (active) setInitializing(false); }
    };
    void start();
    return () => { active = false; };
    // Send once when this route opens; phone is fixed for the route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode(isRetry: boolean) {
    if (!phone) return;
    setBusy(true);
    try {
      const settings = await sendOtp({ phone }).unwrap();
      setOtpLength(settings.otpLength);
      setOtpExpiryMinutes(settings.otpExpiryMinutes);
      if (isRetry) {
        if (!requestId) throw new Error('OTP request has expired. Go back and sign in again.');
        const result = await OTPWidget.retryOTP({ reqId: requestId, retryChannel: 11 });
        assertMsg91Success(result, 'resend');
        setRetries((count) => count + 1);
      } else {
        if (!widgetReady.current) {
          OTPWidget.initializeWidget(settings.widgetId, widgetToken);
          widgetReady.current = true;
        }
        const result = assertMsg91Success(await OTPWidget.sendOTP({ identifier: msg91Identifier(phone) }), 'send');
        const immediateToken = findAccessToken(result);
        const id = findString(result, ['reqId', 'requestId', 'request_id', 'message']);
        if (immediateToken) await finishVerification(immediateToken);
        else if (id) setRequestId(id);
        else throw new Error('MSG91 did not return an OTP request ID.');
        setRetries(0);
        setCode('');
      }
      setSeconds(settings.resendSeconds);
      if (!isRetry) setExpiresInSeconds(settings.otpExpiryMinutes * 60);
    } finally { setBusy(false); }
  }

  async function finishVerification(accessToken: string) {
    if (accessToken.length < 20) throw new Error('MSG91 did not return a valid verification access token.');
    const result = await verifyOtp({ phone, accessToken }).unwrap();
    await saveAccessToken(result.accessToken);
    dispatch(setAccessToken(result.accessToken));
    dispatch(api.util.invalidateTags(['Me', 'Matrimony']));
    const target = next === '/change-password' || next === '/matrimony-form' || next === '/my-matrimony' ? next : '/profile';
    router.replace(target as '/profile');
  }

  async function submitCode() {
    if (code.length !== otpLength || !requestId) return;
    setBusy(true);
    try {
      const result = assertMsg91Success(await OTPWidget.verifyOTP({ reqId: requestId, otp: code }), 'verification');
      const accessToken = findAccessToken(result, true);
      if (!accessToken) throw new Error('MSG91 verified the code but did not return a valid access token.');
      await finishVerification(accessToken);
    } catch (error) {
      Alert.alert(text('OTP सही नहीं है', 'OTP verification failed'), otpErrorMessage(error, text('सही कोड दर्ज करें।', 'Check the code and try again.')));
    } finally { setBusy(false); }
  }

  async function resend() {
    if (busy || seconds > 0 || (retries >= 2 && expiresInSeconds > 0)) return;
    try { await sendCode(retries < 2 && expiresInSeconds > 0 && !!requestId); }
    catch (error) { Alert.alert(text('OTP फिर से नहीं भेजा जा सका', 'Could not resend OTP'), otpErrorMessage(error, text('कुछ गलत हुआ।', 'Something went wrong.'))); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FDF7E9' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Pressable onPress={() => router.back()} style={{ alignSelf: 'flex-start', paddingVertical: 14 }}><Text style={{ color: '#6B2028', fontWeight: '700' }}>{text('← वापस', '← Back')}</Text></Pressable>
        <Text style={{ color: '#6B2028', fontSize: 12, fontWeight: '800', letterSpacing: 1.6 }}>DAMODAR PRAYAS</Text>
        <Text style={{ color: '#302321', fontSize: 28, fontWeight: '800', marginTop: 12 }}>{text('मोबाइल की पुष्टि करें', 'Verify your phone')}</Text>
        <Text style={{ color: '#756863', fontSize: 15, lineHeight: 22, marginTop: 8 }}>{text(`${phone} पर भेजा गया ${otpLength} अंकों का कोड दर्ज करें।`, `Enter the ${otpLength}-digit code sent to ${phone}. It expires in ${otpExpiryMinutes} minutes.`)}</Text>
        <Pressable onPress={() => input.current?.focus()} style={{ flexDirection: 'row', gap: 12, marginTop: 30, marginBottom: 24 }}>
          {Array.from({ length: otpLength }, (_, index) => <View key={index} style={{ width: 58, height: 62, borderWidth: 1, borderColor: code.length === index ? '#6B2028' : '#D9CCC2', borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 24, fontWeight: '700', color: '#302321' }}>{code[index] ?? ''}</Text></View>)}
          <TextInput ref={input} value={code} onChangeText={(value) => setCode(digitsOnly(value).slice(0, otpLength))} keyboardType="number-pad" maxLength={otpLength} autoFocus autoComplete="sms-otp" textContentType="oneTimeCode" accessibilityLabel={text(`${otpLength} अंकों का OTP`, `${otpLength}-digit OTP`)} style={{ position: 'absolute', opacity: 0.02, width: otpLength * 70, height: 62 }} />
        </Pressable>
        <Pressable disabled={busy || initializing || code.length !== otpLength} onPress={() => void submitCode()} style={{ minHeight: 52, borderRadius: 12, backgroundColor: busy || initializing || code.length !== otpLength ? '#B89D98' : '#6B2028', alignItems: 'center', justifyContent: 'center' }}>
          {busy || initializing ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800' }}>{text('पुष्टि करें', 'Verify phone')}</Text>}
        </Pressable>
        <Pressable disabled={busy || seconds > 0 || retries >= 2} onPress={() => void resend()} style={{ alignSelf: 'center', padding: 18 }}>
          <Text style={{ color: seconds > 0 || (retries >= 2 && expiresInSeconds > 0) ? '#9A8E88' : '#6B2028', fontWeight: '700' }}>{seconds > 0 ? text(`${seconds} सेकंड में फिर भेजें`, `Resend in ${seconds}s`) : retries >= 2 && expiresInSeconds > 0 ? text('कोड समाप्त होने के बाद फिर भेजें', `Send a new code in ${Math.ceil(expiresInSeconds / 60)}m`) : text('OTP फिर भेजें', 'Resend OTP')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
