import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRegisterPushTokenMutation } from '@/services/push-api';

import type { AppLanguage } from '@/config/app';
import { persistLanguage, setLanguage } from '@/features/preferences/preferences-slice';
import { translate } from '@/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const C = { maroon: '#7A1024', gold: '#C99A3D', paper: '#FFF9EF', ink: '#2F2020', muted: '#7B6865' };

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.preferences.language);
  const [saving, setSaving] = useState(false);
  const [pushStatus, setPushStatus] = useState('Not tested');
  const [testingPush, setTestingPush] = useState(false);
  const [registerPushToken] = useRegisterPushTokenMutation();

  async function testPushSetup() {
    setTestingPush(true);
    const lines: string[] = [];
    try {
      lines.push(`Physical device: ${Device.isDevice ? 'YES' : 'NO'}`);
      const Notifications = await import('expo-notifications');
      let permission = (await Notifications.getPermissionsAsync()).status;
      if (permission !== 'granted') permission = (await Notifications.requestPermissionsAsync()).status;
      lines.push(`Permission: ${permission}`);
      const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      lines.push(`EAS project ID: ${projectId ? 'FOUND' : 'MISSING'}`);
      if (!projectId) throw new Error('EAS projectId missing');
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      lines.push(`Expo token: ${token ? 'GENERATED' : 'FAILED'}`);
      await registerPushToken({ token, platform: Platform.OS }).unwrap();
      lines.push('Backend registration: SUCCESS');
    } catch (error) {
      const message = error instanceof Error ? error.message : JSON.stringify(error);
      lines.push(`ERROR: ${message}`);
    } finally {
      setPushStatus(lines.join('\n'));
      setTestingPush(false);
    }
  }

  async function chooseLanguage(next: AppLanguage) {
    if (next === language || saving) return;
    setSaving(true);
    dispatch(setLanguage(next));
    try {
      await persistLanguage(next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
        <Text style={styles.title}>{translate(language, 'settings')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{translate(language, 'language')} / Language</Text>
        <Text style={styles.hint}>{translate(language, 'languageHint')}</Text>
        <View style={styles.options}>
          {([
            ['hi', 'हिन्दी'],
            ['en', 'English'],
          ] as const).map(([value, label]) => {
            const selected = language === value;
            return (
              <Pressable
                key={value}
                onPress={() => void chooseLanguage(value)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{label}</Text>
                <Text style={[styles.check, selected && styles.checkSelected]}>{selected ? '✓' : ''}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Pressable style={styles.helpCard} onPress={() => router.push('/faq')}>
        <View style={styles.helpCopy}>
          <Text style={styles.label}>{language === 'hi' ? 'सहायता और सवाल' : 'Help & FAQ'}</Text>
          <Text style={styles.hint}>{language === 'hi' ? 'ऐप इस्तेमाल करने, प्रोफाइल, मैट्रिमोनी और समाज सुविधाओं की जानकारी' : 'Help with profiles, matrimony, community features and using the app'}</Text>
        </View>
        <Text style={styles.helpArrow}>›</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.label}>Push Notification Diagnostics</Text>
        <Text style={styles.hint}>Checks permission, Expo token and backend registration.</Text>
        <Pressable disabled={testingPush} onPress={() => void testPushSetup()} style={styles.testButton}>
          <Text style={styles.testButtonText}>{testingPush ? 'Testing...' : 'Test Push Setup'}</Text>
        </Pressable>
        <Text selectable style={styles.diagnostic}>{pushStatus}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper, paddingHorizontal: 18 },
  header: { height: 68, flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5E9DC' },
  backText: { fontSize: 32, lineHeight: 34, color: C.maroon },
  title: { fontSize: 24, fontWeight: '900', color: C.maroon },
  card: { marginTop: 12, padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEDFCF' },
  label: { fontSize: 18, fontWeight: '800', color: C.ink },
  hint: { marginTop: 4, fontSize: 13, color: C.muted },
  options: { marginTop: 18, gap: 10 },
  option: { minHeight: 54, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1, borderColor: '#E8D8C8', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionSelected: { borderColor: C.gold, backgroundColor: '#FFF6E3' },
  optionText: { fontSize: 16, fontWeight: '700', color: C.ink },
  optionTextSelected: { color: C.maroon },
  check: { fontSize: 18, color: 'transparent' },
  checkSelected: { color: C.maroon },
  helpCard: { marginTop: 12, padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEDFCF', flexDirection: 'row', alignItems: 'center' },
  helpCopy: { flex: 1, paddingRight: 12 },
  helpArrow: { fontSize: 28, color: C.gold },
  testButton: { marginTop: 16, minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: C.maroon },
  testButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  diagnostic: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#F8F2EA', color: C.ink, fontSize: 13, lineHeight: 20 },
});
