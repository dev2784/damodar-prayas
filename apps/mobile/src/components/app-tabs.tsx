import { Tabs } from 'expo-router';

const COLORS = {
  cream: '#FFF8ED',
  maroon: '#6E1F2A',
  saffron: '#D99A2B',
  muted: '#8C7A72',
};

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.maroon,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: '#FFFDF8',
          borderTopColor: '#EADCCB',
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        sceneStyle: {
          backgroundColor: COLORS.cream,
        },
      }}>
      <Tabs.Screen name="index" options={{ title: 'होम' }} />
      <Tabs.Screen name="matrimony" options={{ title: 'मैट्रिमोनी' }} />
      <Tabs.Screen name="community" options={{ title: 'समाज' }} />
      <Tabs.Screen name="samiti" options={{ title: 'समिति' }} />
      <Tabs.Screen name="profile" options={{ title: 'प्रोफाइल' }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
