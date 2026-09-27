import type { ComponentProps } from 'react';
import { COLORS, createTabStyles } from '@/styles/app-tabs.styles';
import { View, StyleSheet, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { translate } from '@/lib/i18n';
import { useAppSelector } from '@/store/hooks';

function tabIcon(name: ComponentProps<typeof SymbolView>['name']) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View style={[iconStyles.circle, focused && iconStyles.selected]}>
        <SymbolView name={name} tintColor={focused ? COLORS.maroon : color} size={27} />
      </View>
    );
  };
}

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  const language = useAppSelector((state) => state.preferences.language);
  const styles = createTabStyles(insets.bottom);

  return (
    <Tabs
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
        tabBarLabelPosition: 'below-icon',
        tabBarHideOnKeyboard: true,
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
        name="community"
        options={{
          title: translate(language, 'community'),
          tabBarIcon: tabIcon({ ios: 'person.3.fill', android: 'groups', web: 'groups' }),
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
        name="samiti"
        options={{
          title: translate(language, 'committee'),
          tabBarIcon: tabIcon({
            ios: 'building.columns.fill',
            android: 'account_balance',
            web: 'account_balance',
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
      <Tabs.Screen name="support" options={{ href: null }} />
      <Tabs.Screen name="faq" options={{ href: null }} />
      <Tabs.Screen name="onboarding" options={{ href: null, tabBarStyle: { display: 'none' } }} />
      <Tabs.Screen name="auth" options={{ href: null }} />
    </Tabs>
  );
}

const iconStyles = StyleSheet.create({
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: {
    transform: [{ translateY: -10 }, { scale: 1.04 }],
    backgroundColor: '#FFF2D3',
    borderColor: '#E6B557',
    shadowColor: '#31050E',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 7,
  },
});
