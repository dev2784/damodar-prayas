import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View, type ViewToken } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ONBOARDING_KEY = 'damodar_prayas_onboarding_completed_v1';

const { width } = Dimensions.get('window');
const slides = [
  require('../../assets/images/onboarding/ca1.png'),
  require('../../assets/images/onboarding/ca2.png'),
  require('../../assets/images/onboarding/ca3.png'),
  require('../../assets/images/onboarding/ca4.png'),
  require('../../assets/images/onboarding/ca5.png'),
  require('../../assets/images/onboarding/ca6.png'),
];

export default function OnboardingScreen() {
  const ref = useRef<FlatList<(typeof slides)[number]>>(null);
  const [index, setIndex] = useState(0);

  async function done() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/');
  }

  const next = () => {
    if (index === slides.length - 1) {
      void done();
      return;
    }
    ref.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  const viewability = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<(typeof slides)[number]>[] }) => {
      const visibleIndex = viewableItems[0]?.index;
      if (visibleIndex != null) setIndex(visibleIndex);
    },
  ).current;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      <FlatList
        ref={ref}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `onboarding-${i + 1}`}
        onViewableItemsChanged={viewability}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image source={item} style={styles.image} contentFit="contain" transition={0} />
          </View>
        )}
      />

      <Pressable style={styles.skipHitbox} onPress={() => void done()} accessibilityLabel="Skip onboarding" />

      <View style={styles.bottomControls} pointerEvents="box-none">
        <Pressable
          style={styles.backHitbox}
          onPress={() => index > 0 && ref.current?.scrollToIndex({ index: index - 1, animated: true })}
          disabled={index === 0}
          accessibilityLabel="Previous slide"
        />
        <Pressable
          style={styles.nextHitbox}
          onPress={next}
          accessibilityLabel={index === slides.length - 1 ? 'Start app' : 'Next slide'}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF9EE' },
  slide: { width, flex: 1, backgroundColor: '#FFF9EE', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  skipHitbox: { position: 'absolute', top: 44, right: 12, width: 110, height: 70 },
  bottomControls: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, flexDirection: 'row', justifyContent: 'space-between' },
  backHitbox: { width: '34%', height: '100%' },
  nextHitbox: { width: '40%', height: '100%' },
});
