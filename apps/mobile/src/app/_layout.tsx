import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { AppProvider } from '@/providers/app-provider';

export default function RootLayout() {
  return (
    <AppProvider>
      <StatusBar style="dark" />
      <AppTabs />
    </AppProvider>
  );
}
