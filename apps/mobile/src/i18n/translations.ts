import type { AppLanguage } from '@/config/app';

export const translations = {
  hi: {
    appName: 'दमोदर प्रयास',
    subtitle: 'दर्जी समाज कम्युनिटी एवं मैट्रिमोनी',
    tagline: 'रिश्तों से समाज तक',
    home: 'होम',
    matrimony: 'मैट्रिमोनी',
    community: 'समाज',
    committees: 'समितियाँ',
    profile: 'प्रोफ़ाइल',
  },
  en: {
    appName: 'Damodar Prayas',
    subtitle: 'Darzi Samaj Community & Matrimony',
    tagline: 'From relationships to community',
    home: 'Home',
    matrimony: 'Matrimony',
    community: 'Community',
    committees: 'Committees',
    profile: 'Profile',
  },
} as const;

export type TranslationKey = keyof typeof translations.hi;

export function translate(language: AppLanguage, key: TranslationKey) {
  return translations[language][key];
}
