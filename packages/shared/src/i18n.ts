export const darziCategoryLabels = {
  JUNA_GUJARATI: {
    hi: 'जूना गुजराती दर्जी समाज',
    en: 'Juna Gujarati Darzi Samaj',
  },
  PIPA: {
    hi: 'पीपा दर्जी समाज',
    en: 'Pipa Darzi Samaj',
  },
  NAMDEV: {
    hi: 'नामदेव दर्जी समाज',
    en: 'Namdev Darzi Samaj',
  },
} as const;

export const appLabels = {
  hi: {
    home: 'होम',
    matrimony: 'विवाह',
    community: 'समाज',
    committees: 'समितियाँ',
    profile: 'प्रोफ़ाइल',
    news: 'समाचार',
    events: 'कार्यक्रम / आमंत्रण',
    advertisement: 'विज्ञापन',
    request: 'सहायता / अनुरोध',
    gratitude: 'आभार',
    wishes: 'शुभकामनाएँ',
  },
  en: {
    home: 'Home',
    matrimony: 'Matrimony',
    community: 'Community',
    committees: 'Committees',
    profile: 'Profile',
    news: 'News',
    events: 'Events / Invitations',
    advertisement: 'Advertisement',
    request: 'Help / Request',
    gratitude: 'Gratitude',
    wishes: 'Wishes',
  },
} as const;

export type AppLanguage = keyof typeof appLabels;
