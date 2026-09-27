import { useCallback, useState } from 'react';
import { Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import AppTabs from '@/components/app-tabs';
import { AppProvider } from '@/providers/app-provider';
import { PushNotifications } from '@/components/push-notifications';
import { LaunchSplash, LAUNCH_BACKGROUND } from '@/components/launch-splash';

export default function RootLayout() {
  const [launchVisible, setLaunchVisible] = useState(Platform.OS !== 'web');
  const finishLaunch = useCallback(() => setLaunchVisible(false), []);
  return (
    <AppProvider>
      <View style={{ flex: 1, backgroundColor: launchVisible ? LAUNCH_BACKGROUND : '#FFF8ED' }}>
        <StatusBar hidden={launchVisible} style={launchVisible ? 'light' : 'dark'} />
        <PushNotifications />
        <View
          style={{ flex: 1 }}
          accessibilityElementsHidden={launchVisible}
          importantForAccessibility={launchVisible ? 'no-hide-descendants' : 'auto'}
        >
          <AppTabs />
        </View>
        {launchVisible ? <LaunchSplash onFinish={finishLaunch} /> : null}
      </View>
    </AppProvider>
  );
}
