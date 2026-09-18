import type { AppLanguage } from '@/config/app';

const messages = {
  hi: {
    home: 'होम',
    matrimony: 'मैट्रिमोनी',
    community: 'समाज',
    committee: 'समिति',
    profile: 'प्रोफाइल',
    settings: 'सेटिंग्स',
    language: 'भाषा',
    languageHint: 'ऐप की भाषा चुनें',
    hindi: 'हिन्दी',
    english: 'English',
    changePassword: 'पासवर्ड बदलें',
    notifications: 'सूचनाएँ',
    account: 'अकाउंट',
  },
  en: {
    home: 'Home',
    matrimony: 'Matrimony',
    community: 'Community',
    committee: 'Committee',
    profile: 'Profile',
    settings: 'Settings',
    language: 'Language',
    languageHint: 'Choose the app language',
    hindi: 'हिन्दी',
    english: 'English',
    changePassword: 'Change password',
    notifications: 'Notifications',
    account: 'Account',
  },
} as const;

export type TranslationKey = keyof typeof messages.hi;

export function translate(language: AppLanguage, key: TranslationKey) {
  return messages[language][key];
}
