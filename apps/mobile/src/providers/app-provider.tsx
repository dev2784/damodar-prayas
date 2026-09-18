import { useEffect, type PropsWithChildren } from 'react';
import { Provider } from 'react-redux';

import { setAccessToken, setAuthHydrated } from '@/features/auth/auth-slice';
import {
  loadStoredLanguage,
  setLanguage,
  setPreferencesHydrated,
} from '@/features/preferences/preferences-slice';
import { getAccessToken } from '@/lib/auth-storage';
import { store } from '@/store/store';
import { DEFAULT_LANGUAGE } from '@/config/app';

function Bootstrapper({ children }: PropsWithChildren) {
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const [token, language] = await Promise.allSettled([getAccessToken(), loadStoredLanguage()]);

      if (!active) return;

      // Storage failures must not leave the app stuck waiting for hydration.
      store.dispatch(setAccessToken(token.status === 'fulfilled' ? token.value : null));
      store.dispatch(setAuthHydrated(true));
      store.dispatch(
        setLanguage(language.status === 'fulfilled' ? language.value : DEFAULT_LANGUAGE),
      );
      store.dispatch(setPreferencesHydrated(true));
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return children;
}

export function AppProvider({ children }: PropsWithChildren) {
  return (
    <Provider store={store}>
      <Bootstrapper>{children}</Bootstrapper>
    </Provider>
  );
}
