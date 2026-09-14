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

function Bootstrapper({ children }: PropsWithChildren) {
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const [token, language] = await Promise.all([
        getAccessToken(),
        loadStoredLanguage(),
      ]);

      if (!active) return;

      store.dispatch(setAccessToken(token));
      store.dispatch(setAuthHydrated(true));
      store.dispatch(setLanguage(language));
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
