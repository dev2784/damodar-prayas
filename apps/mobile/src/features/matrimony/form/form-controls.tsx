import { useState, type ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SymbolView } from 'expo-symbols';
import { C, styles } from '@/styles/matrimony-form.styles';

export function ChoiceRow<T extends string>({
  items,
  value,
  onChange,
  disabled,
}: {
  items: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.choiceRow}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <Pressable
            key={item.value}
            disabled={disabled}
            onPress={() => onChange(item.value)}
            style={[
              styles.choice,
              active && styles.choiceActive,
              disabled && styles.choiceDisabled,
            ]}
          >
            <Text style={[styles.choiceText, active && styles.choiceTextActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  required,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  multiline?: boolean;
  required?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#A69A94"
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function parseFormDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatFormDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DateField({
  label,
  value,
  onChange,
  maximumDate,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maximumDate?: Date;
  required?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const selectedDate = parseFormDate(value) ?? maximumDate ?? new Date();

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <Pressable style={[styles.input, styles.dateInput]} onPress={() => setShowPicker(true)}>
        <Text style={value ? styles.dateText : styles.datePlaceholder}>
          {value ? selectedDate.toLocaleDateString('hi-IN') : 'जन्मतिथि चुनें'}
        </Text>
        <SymbolView
          name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
          tintColor={C.maroon}
          size={19}
        />
      </Pressable>
      {showPicker ? (
        <DateTimePicker
          value={selectedDate}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowPicker(false);
            if (event.type === 'set' && date) onChange(formatFormDate(date));
          }}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          accentColor={C.maroon}
        />
      ) : null}
    </View>
  );
}

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}
