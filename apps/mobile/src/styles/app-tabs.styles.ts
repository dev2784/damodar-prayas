import { StyleSheet } from 'react-native';

export const COLORS = {
  cream: '#FFF8ED',
  maroon: '#8F1428',
  muted: '#FFF6EB',
  gold: '#F4D38A',
};

export function createTabStyles(bottomInset: number) {
  return StyleSheet.create({
    // Keep this in normal layout flow: every screen reserves the full menu height,
    // so its last card/button stays reachable without per-screen padding changes.
    bar: {
      backgroundColor: COLORS.maroon,
      borderColor: '#D7AE62',
      borderWidth: 1,
      borderTopWidth: 1,
      borderTopColor: '#D7AE62',
      borderRadius: 28,
      marginHorizontal: 12,
      marginTop: 14,
      marginBottom: Math.max(bottomInset, 12),
      height: 80,
      paddingTop: 6,
      paddingBottom: 9,
      shadowColor: '#3D0710',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.23,
      shadowRadius: 12,
      elevation: 10,
      overflow: 'visible',
    },
    item: { overflow: 'visible', paddingHorizontal: 0 },
    label: { fontSize: 11, fontWeight: '700', marginTop: 3 },
    scene: { backgroundColor: COLORS.cream },
  });
}
