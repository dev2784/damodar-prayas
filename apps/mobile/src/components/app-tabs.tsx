import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

const COLORS = {
  cream: '#FFF8ED',
  maroon: '#A30D1E',
  muted: '#667085',
};

const tabIcon = (name: { ios: any; android: any; web: any }) =>
  ({ color, focused }: { color: string; focused: boolean }) => (
    <SymbolView name={name} tintColor={color} size={focused ? 29 : 27} />
  );

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.maroon,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E9DED0',
          height: 76,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: '#5E3820',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 2,
        },
        sceneStyle: {
          backgroundColor: COLORS.cream,
        },
      }}>
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
          tabBarIcon: tabIcon({ ios: 'person.crop.circle.badge.heart', android: 'person_search', web: 'person_search' }),
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
          tabBarIcon: tabIcon({ ios: 'building.columns.fill', android: 'storefront', web: 'storefront' }),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'प्रोफाइल',
          tabBarIcon: tabIcon({ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
      <Tabs.Screen name="matrimony-profile" options={{ href: null }} />
      <Tabs.Screen name="my-matrimony" options={{ href: null }} />
      <Tabs.Screen name="matrimony-form" options={{ href: null }} />
    </Tabs>
  );
}
