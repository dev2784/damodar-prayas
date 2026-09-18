import { StyleSheet } from 'react-native';

export const COLORS = {
  cream: '#FFF8ED',
  maroon: '#A30D1E',
  muted: '#667085',
};

export function createTabStyles(bottomInset: number) {
  return StyleSheet.create({
    bar: {
      backgroundColor: '#FFFFFF',
      borderTopColor: '#E9DED0',
      // Reserve system navigation space without reducing the menu's content height.
      height: 76 + bottomInset,
      paddingTop: 8,
      paddingBottom: 8 + bottomInset,
      shadowColor: '#5E3820',
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 10,
    },
    label: { fontSize: 11, fontWeight: '800', marginTop: 2 },
    scene: { backgroundColor: COLORS.cream },
  });
}
