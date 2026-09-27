import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLanguageText } from '@/hooks/use-language-text';
import { useGetCommunityLocationsQuery } from '@/services/community-api';

export function todayInIndia() {
  return new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
}

export function CitySelect({
  value,
  onChange,
  optional = false,
}: {
  value: string;
  onChange: (id: string) => void;
  optional?: boolean;
}) {
  const { text } = useLanguageText();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useGetCommunityLocationsQuery();
  const selected = data?.cities.find((city) => city.id === value);
  const cities =
    data?.cities.filter((city) =>
      `${city.name} ${city.district}`.toLowerCase().includes(search.trim().toLowerCase()),
    ) ?? [];
  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={s.field}
        onPress={() => {
          setSearch('');
          setOpen(true);
        }}
      >
        <Text style={s.value}>
          {selected
            ? `${selected.name} · ${selected.district}`
            : optional
              ? text('सभी शहर', 'All cities')
              : text('शहर चुनें *', 'Select city *')}{' '}
          ▾
        </Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={s.modal}>
          <View style={s.row}>
            <Text style={s.heading}>{text('शहर चुनें', 'Select city')}</Text>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={s.action}>
              <Text style={s.value}>{text('बंद करें', 'Close')}</Text>
            </Pressable>
          </View>
          <Text style={s.hint}>
            {text('मध्य प्रदेश · शहर / जिला खोजें', 'Madhya Pradesh · Search city / district')}
          </Text>
          <TextInput
            style={s.field}
            value={search}
            onChangeText={setSearch}
            placeholder={text('शहर या जिला (English में)', 'City or district')}
            autoCorrect={false}
          />
          {isLoading ? (
            <ActivityIndicator />
          ) : isError ? (
            <Pressable style={s.action} onPress={() => void refetch()}>
              <Text>
                {text('शहर लोड नहीं हुए · फिर कोशिश करें', 'Could not load cities · Retry')}
              </Text>
            </Pressable>
          ) : (
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={cities}
              keyExtractor={(city) => city.id}
              ListHeaderComponent={
                optional ? (
                  <Pressable
                    style={s.option}
                    onPress={() => {
                      onChange('');
                      setOpen(false);
                    }}
                  >
                    <Text style={s.value}>{text('सभी शहर', 'All cities')}</Text>
                  </Pressable>
                ) : null
              }
              ListEmptyComponent={
                <Text style={s.hint}>{text('कोई शहर नहीं मिला', 'No city found')}</Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.id === value }}
                  style={s.option}
                  onPress={() => {
                    onChange(item.id);
                    setOpen(false);
                  }}
                >
                  <Text style={s.value}>
                    {item.name}
                    {item.id === value ? ' ✓' : ''}
                  </Text>
                  <Text style={s.hint}>{item.district}</Text>
                </Pressable>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </>
  );
}

export function StateSelect() {
  const { text } = useLanguageText();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable accessibilityRole="button" style={s.field} onPress={() => setOpen(!open)}>
        <Text style={s.value}>{text('मध्य प्रदेश', 'Madhya Pradesh')} ▾</Text>
      </Pressable>
      {open ? (
        <Pressable style={s.option} onPress={() => setOpen(false)}>
          <Text style={s.value}>✓ {text('मध्य प्रदेश', 'Madhya Pradesh')}</Text>
          <Text style={s.hint}>
            {text('अभी केवल मध्य प्रदेश उपलब्ध है', 'Currently available in Madhya Pradesh')}
          </Text>
        </Pressable>
      ) : null}
    </>
  );
}

export function DateSelect({
  value,
  onChange,
  optional = false,
}: {
  value: string;
  onChange: (day: string) => void;
  optional?: boolean;
}) {
  const { text } = useLanguageText();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || todayInIndia());
  const date = new Date(`${draft}T12:00:00`);
  function localDay(day: Date) {
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  }
  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={s.field}
        onPress={() => {
          setDraft(value || todayInIndia());
          setOpen(true);
        }}
      >
        <Text style={s.value}>
          {value
            ? value.split('-').reverse().join('/')
            : optional
              ? text('सभी तारीखें', 'All dates')
              : text('तारीख चुनें *', 'Select date *')}{' '}
          ▾
        </Text>
      </Pressable>
      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={date}
          mode="date"
          onChange={(event, day) => {
            setOpen(false);
            if (event.type === 'set' && day) onChange(localDay(day));
          }}
        />
      ) : null}
      <Modal
        visible={open && Platform.OS !== 'android'}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={s.overlay}>
          <View style={s.dialog}>
            <Text style={s.heading}>{text('तारीख चुनें', 'Select date')}</Text>
            {Platform.OS === 'web' ? (
              <input
                aria-label={text('तारीख', 'Date')}
                type="date"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                style={{ padding: 16, fontSize: 18 }}
              />
            ) : (
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={(_event, day) => {
                  if (day) setDraft(localDay(day));
                }}
              />
            )}
            <View style={s.row}>
              <Pressable style={s.action} onPress={() => setOpen(false)}>
                <Text>{text('रद्द करें', 'Cancel')}</Text>
              </Pressable>
              <Pressable
                disabled={!/^\d{4}-\d{2}-\d{2}$/.test(draft)}
                style={s.action}
                onPress={() => {
                  onChange(draft);
                  setOpen(false);
                }}
              >
                <Text style={s.value}>{text('चुनें', 'Apply')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export const selectorStyles = StyleSheet.create({
  group: {
    backgroundColor: '#FFFDF8',
    borderColor: '#E9DECD',
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  label: { color: '#6B5750', fontSize: 14, marginTop: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  hint: { color: '#78685E', fontSize: 13 },
});
const s = StyleSheet.create({
  field: {
    minHeight: 48,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4D5C4',
    borderRadius: 12,
    backgroundColor: '#FFFCF7',
    justifyContent: 'center',
    marginVertical: 4,
    color: '#3C2724',
  },
  value: { color: '#8E1528', fontSize: 16, fontWeight: '600' },
  hint: { color: '#78685E', fontSize: 13, marginVertical: 4 },
  heading: { color: '#8E1528', fontSize: 20, fontWeight: '700' },
  modal: { flex: 1, padding: 20, backgroundColor: '#FFFCF7' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  action: { padding: 14, minHeight: 48 },
  option: { paddingVertical: 14, borderBottomColor: '#E9DECD', borderBottomWidth: 1 },
  overlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 },
  dialog: { backgroundColor: '#FFFDF8', padding: 16, borderRadius: 20, gap: 12 },
});
