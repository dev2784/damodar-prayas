import { StyleSheet } from 'react-native';

export const C = {
  bg: '#FFF8ED',
  paper: '#FFFFFF',
  maroon: '#A30D1E',
  text: '#2A211D',
  muted: '#736660',
  line: '#E8DCCF',
};

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  wrap: { padding: 18 },
  back: { color: C.maroon, fontWeight: '800', marginBottom: 16 },
  title: { fontSize: 27, fontWeight: '900', color: C.text },
  sub: { fontSize: 12, color: C.muted, lineHeight: 18, marginTop: 6, marginBottom: 18 },
  card: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 17,
    padding: 16,
  },
  label: { fontSize: 12, fontWeight: '800', color: C.text, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    paddingHorizontal: 13,
    minHeight: 46,
    backgroundColor: '#FFFDF9',
  },
  hint: { fontSize: 10.5, color: C.muted, marginTop: 9 },
  button: {
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: C.maroon,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '900' },
});
