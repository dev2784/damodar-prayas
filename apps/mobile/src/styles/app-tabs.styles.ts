import { StyleSheet } from 'react-native';

export const COLORS = {
  cream: '#FFF8ED',
  maroon: '#A30D1E',
  muted: '#FFFFFF',
  gold: '#F7C84B',
};

export function createTabStyles(bottomInset: number) {
  return StyleSheet.create({
    bar: {
      backgroundColor: '#8F0E22',
      borderTopColor: '#A52A3B',
      // Reserve system navigation space without reducing the menu's content height.
      height: 76 + bottomInset,
      paddingTop: 8,
      paddingBottom: 8 + bottomInset,
      shadowColor: '#3D0710',
      shadowOpacity: 0.22,
      shadowRadius: 12,
      elevation: 10,
    },
    label: { fontSize: 11, fontWeight: '800', marginTop: 2 },
    scene: { backgroundColor: COLORS.cream },
  });
}
