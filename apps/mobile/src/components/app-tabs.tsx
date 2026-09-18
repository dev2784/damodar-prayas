import type { ComponentProps } from 'react';
import { COLORS, createTabStyles } from '@/styles/app-tabs.styles';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function tabIcon(name: ComponentProps<typeof SymbolView>['name']) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <SymbolView name={name} tintColor={color} size={focused ? 29 : 27} />;
  };
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const styles = createTabStyles(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.maroon,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'होम',
          tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home', web: 'home' }),
        }}
      />
      <Tabs.Screen
        name="matrimony"
        options={{
          title: 'मैट्रिमोनी',
          tabBarIcon: tabIcon({
            ios: 'heart.circle.fill',
            android: 'person_search',
            web: 'person_search',
          }),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'समाज',
          tabBarIcon: tabIcon({ ios: 'person.3.fill', android: 'groups', web: 'groups' }),
        }}
      />
      <Tabs.Screen
        name="samiti"
        options={{
          title: 'समिति',
          tabBarIcon: tabIcon({
            ios: 'building.columns.fill',
            android: 'storefront',
            web: 'storefront',
          }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'प्रोफाइल',
          tabBarIcon: tabIcon({ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }),
        }}
      />
      <Tabs.Screen name="community-post" options={{ href: null }} />
      <Tabs.Screen name="community-submit" options={{ href: null }} />
      <Tabs.Screen name="samiti-submit" options={{ href: null }} />
      <Tabs.Screen name="samiti-detail" options={{ href: null }} />
      <Tabs.Screen name="matrimony-profile" options={{ href: null }} />
      <Tabs.Screen name="my-matrimony" options={{ href: null }} />
      <Tabs.Screen name="matrimony-form" options={{ href: null }} />
      <Tabs.Screen name="matrimony-shortlist" options={{ href: null }} />
      <Tabs.Screen name="matrimony-interests" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
      <Tabs.Screen name="auth" options={{ href: null }} />
    </Tabs>
  );
}
