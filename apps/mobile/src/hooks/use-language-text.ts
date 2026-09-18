import { useAppSelector } from '@/store/hooks';

export function useLanguageText() {
  const language = useAppSelector((state) => state.preferences.language);
  return {
    language,
    text: (hi: string, en: string) => (language === 'hi' ? hi : en),
    apiLanguage: language === 'hi' ? ('HI' as const) : ('EN' as const),
  };
}
