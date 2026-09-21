import type { ComponentProps } from 'react';
import { COLORS, createTabStyles } from '@/styles/app-tabs.styles';
import type { ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { translate } from '@/lib/i18n';
import { useAppSelector } from '@/store/hooks';

function tabIcon(name: ComponentProps<typeof SymbolView>['name']) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <SymbolView name={name} tintColor={color} size={focused ? 29 : 27} />;
  };
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const language = useAppSelector((state) => state.preferences.language);
  const styles = createTabStyles(insets.bottom);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        sceneStyle: styles.scene,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: translate(language, 'home'),
          tabBarIcon: tabIcon({ ios: 'house.fill', android: 'home', web: 'home' }),
        }}
      />
      <Tabs.Screen
        name="matrimony"
        options={{
          title: translate(language, 'matrimony'),
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
          title: translate(language, 'community'),
          tabBarIcon: tabIcon({ ios: 'person.3.fill', android: 'groups', web: 'groups' }),
        }}
      />
      <Tabs.Screen
        name="samiti"
        options={{
          title: translate(language, 'committee'),
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
          title: translate(language, 'profile'),
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
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="faq" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="auth" options={{ href: null }} />
    </Tabs>
  );
}
