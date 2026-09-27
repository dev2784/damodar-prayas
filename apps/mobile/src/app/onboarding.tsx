import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewToken,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ONBOARDING_KEY = 'damodar_prayas_onboarding_completed_v1';

const slides = [
  {
    image: require('../../assets/images/onboarding/ca1.png'),
    label: 'दामोदर प्रयास — रिश्तों से समाज तक',
  },
  {
    image: require('../../assets/images/onboarding/ca2.png'),
    label: 'मैट्रिमोनी — अपने जीवनसाथी की खोज',
  },
  {
    image: require('../../assets/images/onboarding/ca3.png'),
    label: 'समाज से जुड़े रहें — समाचार और कार्यक्रम',
  },
  {
    image: require('../../assets/images/onboarding/ca4.png'),
    label: 'अपना प्रोफाइल प्रबंधित करें',
  },
  { image: require('../../assets/images/onboarding/ca5.png'), label: 'अपना योगदान दें' },
  { image: require('../../assets/images/onboarding/ca6.png'), label: 'एकजुट समाज, उज्ज्वल भविष्य' },
];

// Source posters are 941 × 1672. Clip only their outer status bar and
// illustrated navigation; keep the artwork and phone illustrations intact.
const viewabilityConfig = { itemVisiblePercentThreshold: 60 };
const ART_WIDTH = 941;
const ART_HEIGHT = 1672;
const ART_TOP = 52;
const ART_BOTTOM = 1520;

export default function OnboardingScreen() {
  const ref = useRef<FlatList<(typeof slides)[number]>>(null);
  const finishing = useRef(false);
  const [saving, setSaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const scale = width / ART_WIDTH;

  async function done() {
    if (finishing.current) return;
    finishing.current = true;
    setSaving(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
      router.replace('/');
    } catch {
      Alert.alert('दोबारा कोशिश करें', 'परिचय पूरा होने की जानकारी सेव नहीं हुई।');
    } finally {
      finishing.current = false;
      setSaving(false);
    }
  }

  function goTo(nextIndex: number) {
    ref.current?.scrollToIndex({ index: nextIndex, animated: true });
  }

  const viewability = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken<(typeof slides)[number]>[] }) => {
      const visibleIndex = viewableItems[0]?.index;
      if (visibleIndex != null) setIndex(visibleIndex);
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.pager} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <FlatList
            key={width}
            ref={ref}
            data={slides}
            horizontal
            pagingEnabled
            initialScrollIndex={index}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => `onboarding-${i + 1}`}
            onViewableItemsChanged={viewability}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={({ item }) => (
              <ScrollView style={{ width }} contentContainerStyle={styles.slide} bounces={false}>
                <View style={{ width, height: (ART_BOTTOM - ART_TOP) * scale, overflow: 'hidden' }}>
                  <Image
                    source={item.image}
                    accessibilityLabel={item.label}
                    accessible
                    style={{
                      position: 'absolute',
                      top: -ART_TOP * scale,
                      width,
                      height: ART_HEIGHT * scale,
                    }}
                    contentFit="fill"
                    transition={0}
                  />
                  {/* Replace the baked-in Skip text at its artwork coordinates
                      with a visible, accessible control that scales with the art. */}
                  <Pressable
                    style={[
                      styles.skip,
                      {
                        top: 14 * scale,
                        right: 25 * scale,
                        width: 130 * scale,
                        minHeight: Math.max(44, 65 * scale),
                      },
                    ]}
                    onPress={() => void done()}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="परिचय छोड़ें"
                  >
                    <Text style={styles.skipText}>छोड़ें</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}
          />
        ) : null}
      </View>
      <View style={styles.controls}>
        <Pressable
          style={styles.back}
          onPress={() => (index > 0 ? goTo(index - 1) : void done())}
          disabled={saving}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>{index > 0 ? '← पीछे' : 'छोड़ें'}</Text>
        </Pressable>
        <View
          style={styles.dots}
          accessible
          accessibilityLabel={`परिचय ${index + 1} / ${slides.length}`}
        >
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.activeDot]} />
          ))}
        </View>
        <Pressable
          style={styles.next}
          disabled={saving}
          onPress={() => (index === slides.length - 1 ? void done() : goTo(index + 1))}
          accessibilityRole="button"
        >
          <Text style={styles.nextText}>
            {saving ? 'रुकें…' : index === slides.length - 1 ? 'शुरू करें →' : 'आगे →'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9EE' },
  pager: { flex: 1 },
  slide: { flexGrow: 1, alignItems: 'center' },
  skip: {
    position: 'absolute',
    backgroundColor: '#FFF9EE',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  skipText: { color: '#800D20', fontSize: 17, fontWeight: '700' },
  controls: {
    backgroundColor: '#800D20',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { minHeight: 48, minWidth: 58, justifyContent: 'center' },
  backText: { color: '#FFF9EE', fontSize: 16 },
  dots: { flexDirection: 'row', gap: 6, flexShrink: 1 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#BD737C' },
  activeDot: { backgroundColor: '#FFD46C' },
  next: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 28,
    backgroundColor: '#FFF9EE',
    justifyContent: 'center',
  },
  nextText: { color: '#800D20', fontSize: 17, fontWeight: '700' },
});
