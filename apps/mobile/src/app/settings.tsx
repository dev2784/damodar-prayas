import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import type { AppLanguage } from '@/config/app';
import { persistLanguage, setLanguage } from '@/features/preferences/preferences-slice';
import { translate } from '@/lib/i18n';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const C = { maroon: '#7A1024', gold: '#C99A3D', paper: '#FFF9EF', ink: '#2F2020', muted: '#7B6865' };

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.preferences.language);
  const [saving, setSaving] = useState(false);

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
});
