import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { DEFAULT_LANGUAGE, type AppLanguage } from '@/config/app';

const LANGUAGE_KEY = 'damodar_prayas_language';

export type PreferencesState = {
  language: AppLanguage;
  hydrated: boolean;
};

const initialState: PreferencesState = {
  language: DEFAULT_LANGUAGE,
  hydrated: false,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<AppLanguage>) {
      state.language = action.payload;
    },
    setPreferencesHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
  },
});

export const { setLanguage, setPreferencesHydrated } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;

export async function loadStoredLanguage(): Promise<AppLanguage> {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  return value === 'en' || value === 'hi' ? value : DEFAULT_LANGUAGE;
}

export async function persistLanguage(language: AppLanguage) {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
}
