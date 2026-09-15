from pathlib import Path
import re

# Home: show incoming pending-interest count on the existing notification bell.
p = Path('apps/mobile/src/app/index.tsx')
s = p.read_text()

import_anchor = "import { SafeAreaView } from 'react-native-safe-area-context';\n"
imports = "import { SafeAreaView } from 'react-native-safe-area-context';\n\nimport { useGetIncomingInterestsQuery } from '@/services/interaction-api';\nimport { useAppSelector } from '@/store/hooks';\n"
if "useGetIncomingInterestsQuery" not in s:
    if import_anchor not in s:
        raise SystemExit('home import anchor not found')
    s = s.replace(import_anchor, imports, 1)

home_marker = "export default function HomeScreen() {\n  return ("
home_replacement = """export default function HomeScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data: incomingInterests } = useGetIncomingInterestsQuery(undefined, { skip: !accessToken });
  const pendingInterestCount = incomingInterests?.items.filter((item) => item.status === 'PENDING').length ?? 0;

  return ("""
if home_replacement not in s:
    if home_marker not in s:
        raise SystemExit('HomeScreen marker not found')
    s = s.replace(home_marker, home_replacement, 1)

bell_old = "          <View style={styles.headerIcon}><Icon name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} color={C.maroon} size={21} /></View>"
bell_new = """          <Pressable
            style={styles.headerIcon}
            onPress={() => router.push('/matrimony-interests')}
            accessibilityRole="button"
            accessibilityLabel={pendingInterestCount > 0 ? `${pendingInterestCount} matrimony interest requests` : 'Notifications'}>
            <Icon name={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }} color={C.maroon} size={21} />
            {pendingInterestCount > 0 ? (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{pendingInterestCount > 99 ? '99+' : pendingInterestCount}</Text>
              </View>
            ) : null}
          </Pressable>"""
if bell_new not in s:
    if bell_old not in s:
        raise SystemExit('bell marker not found')
    s = s.replace(bell_old, bell_new, 1)

style_old = "  headerIcon: { width: 37, height: 37, borderRadius: 18.5, backgroundColor: '#FFF7E8', alignItems: 'center', justifyContent: 'center', marginLeft: 5 },"
style_new = """  headerIcon: { width: 37, height: 37, borderRadius: 18.5, backgroundColor: '#FFF7E8', alignItems: 'center', justifyContent: 'center', marginLeft: 5, position: 'relative' },
  notificationBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: C.maroon, borderWidth: 2, borderColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 8.5, fontWeight: '900', lineHeight: 11 },"""
if "notificationBadge:" not in s:
    if style_old not in s:
        raise SystemExit('headerIcon style marker not found')
    s = s.replace(style_old, style_new, 1)

p.write_text(s)

# My Matrimony: remove the Shortlist / Interest shortcut row.
p = Path('apps/mobile/src/app/my-matrimony.tsx')
s = p.read_text()
start = s.find('      <View style={styles.interactionRow}>')
if start != -1:
    end_marker = '      {isLoading ?'
    end = s.find(end_marker, start)
    if end == -1:
        raise SystemExit('interaction row end marker not found')
    s = s[:start] + s[end:]

for style_name in ('interactionRow', 'interactionCard', 'interactionTitle', 'interactionText'):
    s = re.sub(rf"\n\s*{style_name}: \{{[^\n]*\}},", '', s)

p.write_text(s)
