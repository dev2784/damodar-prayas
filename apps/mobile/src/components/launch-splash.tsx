import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useAppSelector } from '@/store/hooks';

const ARTWORK = require('../../assets/images/launch-artwork.webp');
export const LAUNCH_BACKGROUND = '#570B13';

// Android's system splash is icon-sized. Hand off to the full-screen artwork
// only after its first frame is actually displayed, without exposing the tabs.
if (Platform.OS !== 'web') {
  void SplashScreen.preventAutoHideAsync().catch(() => {});
}

export function LaunchSplash({ onFinish }: { onFinish: () => void }) {
  const authReady = useAppSelector((state) => state.auth.hydrated);
  const preferencesReady = useAppSelector((state) => state.preferences.hydrated);
  const [laidOut, setLaidOut] = useState(false);
  const [displayed, setDisplayed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [minimumElapsed, setMinimumElapsed] = useState(false);
  const [deadlineElapsed, setDeadlineElapsed] = useState(false);
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Local image/storage failures must never trap the user on the splash.
    const deadline = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => {});
      setDeadlineElapsed(true);
    }, 6000);
    return () => clearTimeout(deadline);
  }, []);

  useEffect(() => {
    if (!laidOut || (!displayed && !failed)) return;
    void SplashScreen.hideAsync().catch(() => {});
    // Brief brand reveal, independent of network requests.
    const minimum = setTimeout(() => setMinimumElapsed(true), failed ? 0 : 900);
    return () => clearTimeout(minimum);
  }, [laidOut, displayed, failed]);

  useEffect(() => {
    if (!deadlineElapsed && !(authReady && preferencesReady && minimumElapsed)) return;
    const fade = Animated.timing(opacity, {
      toValue: 0,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    });
    fade.start(({ finished }) => {
      if (finished) onFinish();
    });
    return () => fade.stop();
  }, [authReady, preferencesReady, minimumElapsed, deadlineElapsed, opacity, onFinish]);

  return (
    <Animated.View
      onLayout={() => setLaidOut(true)}
      style={[styles.overlay, { opacity }]}
      accessibilityViewIsModal
      accessibilityLabel="दामोदर प्रयास — रिश्तों से समाज तक"
    >
      <Image
        source={ARTWORK}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
        contentFit="cover"
        blurRadius={24}
        accessible={false}
        transition={0}
      />
      <Image
        source={ARTWORK}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        contentPosition="center"
        transition={0}
        onDisplay={() => setDisplayed(true)}
        onError={() => setFailed(true)}
        accessible={false}
      />
      {failed ? (
        <View style={styles.fallback}>
          <Text style={styles.title}>दामोदर प्रयास</Text>
          <Text style={styles.tagline}>रिश्तों से समाज तक</Text>
        </View>
      ) : null}
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1000,
    elevation: 1000,
    backgroundColor: LAUNCH_BACKGROUND,
  },
  backdrop: { opacity: 0.5 },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: LAUNCH_BACKGROUND,
  },
  title: { color: '#F5D58B', fontSize: 34, fontWeight: '700' },
  tagline: { color: '#F6E5BC', fontSize: 18, marginTop: 12 },
});
