import { svgImage } from '@/lib/svg-image';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLanguageText } from '@/hooks/use-language-text';

const MAROON = '#790D21';
const GOLD = '#BF8B37';
// Small vector illustrations stay sharp on every screen; labels remain live translated text.
const svg = (body: string, viewBox = '0 0 64 64') => svgImage(body, viewBox);
const paths = {
  news: '<path d="M15 13h38v42H15zM15 22H8v29a4 4 0 0 0 4 4h7M23 22h13v12H23zM42 23h4m-4 9h4M23 42h23M23 48h23"/>',
  ads: '<path d="m12 29 31-13 8 34-33-1zM12 29l-5 2 4 17 7 1M21 49l5 11h9l-7-12M53 23q9 8 5 19M49 28q5 5 3 11"/>',
  event:
    '<rect x="10" y="15" width="44" height="42" rx="4"/><path d="M21 9v13M43 9v13M10 29h44"/><path d="m32 35 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#BF8B37" stroke="#BF8B37" stroke-width="1"/>',
  lotus:
    '<path d="M32 53C17 40 21 24 32 12c11 12 15 28 0 41ZM32 53C13 52 8 39 9 26c8 1 12 5 16 10M32 53c19-1 24-14 23-27-8 1-12 5-16 10M18 48 4 39c1 15 15 21 28 17 13 4 27-2 28-17l-14 9"/>',
  committee:
    '<path d="m5 22 27-15 27 15H5ZM10 28h44M10 53h44M6 59h52M16 28v25M24 28v25M40 28v25M48 28v25"/>',
};
const icons = Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [
    key,
    svg(
      `<g stroke="${MAROON}" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round">${path}</g>`,
    ),
  ]),
);
const ornament = svg(
  '<path d="M1 16h25m-8 0 7-7 7 7-7 7-7-7Zm13 0c14-15-4-20-3-11 1 5 8 3 10 11-2 8-9 6-10 11-1 9 17 4 3-11Z" stroke="#BF8B37" stroke-width="1.5" stroke-linecap="round"/>',
  '0 0 44 32',
);
const petals = Array.from(
  { length: 8 },
  (_, i) => `<path d="M60 60Q35 33 60 7Q85 33 60 60Z" transform="rotate(${i * 45} 60 60)"/>`,
).join('');
const flower = svg(
  `<g stroke="${GOLD}" stroke-width="1.5">${petals}<circle cx="60" cy="60" r="11"/></g>`,
  '0 0 120 120',
);
const waves = svg(
  '<path d="M0 0C60 76 120 55 185 75S260 118 360 102V140H0Z" fill="#EDC66C"/><path d="M0 35C70 92 129 68 190 94S285 123 360 117V140H0Z" fill="#790D21"/><path d="M0 58C72 104 150 88 211 118" stroke="#AD3C40" stroke-width="1"/>',
  '0 0 360 140',
);
const actions = [
  {
    category: 'NEWS',
    hi: 'समाचार',
    en: 'News',
    hintHi: 'समाज की ताज़ा खबरें',
    hintEn: 'Latest community news',
    icon: 'news',
    bg: '#FCEEEB',
    badge: '#F9DED9',
    border: '#F3DEDA',
  },
  {
    category: 'ADVERTISEMENT',
    hi: 'विज्ञापन',
    en: 'Ads',
    hintHi: 'व्यापार और सेवाएँ',
    hintEn: 'Businesses and services',
    icon: 'ads',
    bg: '#FCF4E4',
    badge: '#FAEACA',
    border: '#F2E6CD',
  },
  {
    category: 'EVENT',
    hi: 'समारोह',
    en: 'Events',
    hintHi: 'आने वाले आयोजन',
    hintEn: 'Upcoming events',
    icon: 'event',
    bg: '#F1F6EA',
    badge: '#E4EED9',
    border: '#E5EDDC',
  },
  {
    category: 'OBITUARY',
    hi: 'शोक संदेश',
    en: 'Obituaries',
    hintHi: 'श्रद्धांजलि और शोक सूचना',
    hintEn: 'Tributes and notices',
    icon: 'lotus',
    bg: '#F0EFF1',
    badge: '#E3E2E6',
    border: '#E4E2E7',
  },
] as const;

export function CommunityShortcuts() {
  const { text } = useLanguageText();
  return (
    <View style={s.section}>
      <View style={s.headingRow}>
        <View style={s.rule} />
        <Image accessible={false} source={ornament} style={s.ornament} />
        <Text accessibilityRole="header" style={s.heading}>
          {text('समाज से जुड़ें', 'Connect with community')}
        </Text>
        <Image accessible={false} source={ornament} style={[s.ornament, s.mirror]} />
        <View style={s.rule} />
      </View>
      <View style={s.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.category}
            accessibilityRole="button"
            accessibilityLabel={text(action.hi, action.en)}
            accessibilityHint={text(action.hintHi, action.hintEn)}
            onPress={() =>
              router.push({ pathname: '/community', params: { category: action.category } })
            }
            style={({ pressed }) => [
              s.card,
              { backgroundColor: action.bg, borderColor: action.border },
              pressed && s.pressed,
            ]}
          >
            <Image pointerEvents="none" accessible={false} source={flower} style={s.flower} />
            <View style={[s.badge, { backgroundColor: action.badge }]}>
              <Image
                accessible={false}
                source={icons[action.icon]}
                style={s.icon}
                contentFit="contain"
              />
            </View>
            <View style={s.labelRow}>
              <Text style={s.label}>{text(action.hi, action.en)}</Text>
              <Text accessible={false} style={s.arrow}>
                ›
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={text('समितियाँ', 'Committees')}
        onPress={() => router.push('/samiti')}
        style={({ pressed }) => [s.committee, pressed && s.pressed]}
      >
        <Image pointerEvents="none" accessible={false} source={flower} style={s.bannerFlower} />
        <View style={s.committeeBadge}>
          <Image accessible={false} source={icons.committee} style={s.committeeIcon} />
        </View>
        <Image
          pointerEvents="none"
          accessible={false}
          source={waves}
          contentFit="fill"
          style={s.waves}
        />
        <View style={s.copy}>
          <Text style={s.committeeTitle}>{text('समितियाँ', 'Committees')}</Text>
          <Text style={s.subtitle}>
            {text('अपने क्षेत्र की समिति से जुड़ें', 'Connect with your local committee')}
          </Text>
        </View>
        <Text accessible={false} style={s.arrow}>
          ›
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginHorizontal: 14, marginTop: 26 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  rule: { height: 1, backgroundColor: '#D7B578', flex: 1, minWidth: 8 },
  ornament: { width: 26, height: 22 },
  mirror: { transform: [{ scaleX: -1 }] },
  heading: {
    color: MAROON,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: '72%',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: {
    flexBasis: '45%',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 134,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    overflow: 'hidden',
  },
  flower: { position: 'absolute', width: 88, height: 88, right: -41, top: 15, opacity: 0.16 },
  badge: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: { width: 43, height: 43 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 'auto' },
  label: { flex: 1, color: MAROON, fontSize: 21, fontWeight: '700' },
  arrow: { color: GOLD, fontSize: 30, lineHeight: 36 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
  committee: {
    marginTop: 20,
    minHeight: 140,
    borderWidth: 1.5,
    borderColor: '#D8AB5A',
    borderRadius: 20,
    backgroundColor: '#FFF4E3',
    padding: 16,
    paddingBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  committeeBadge: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: '#FAE6BF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  committeeIcon: { width: 65, height: 65 },
  bannerFlower: {
    position: 'absolute',
    right: -22,
    top: -28,
    width: 105,
    height: 105,
    opacity: 0.18,
  },
  waves: { position: 'absolute', bottom: -1, left: 0, width: '72%', height: 60 },
  copy: { flex: 1, minWidth: 0 },
  committeeTitle: { color: MAROON, fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#655D55', fontSize: 14, lineHeight: 21, marginTop: 5 },
});
