import { View, Text } from 'react-native';
import { Field, Section, ChoiceRow, DateField } from './form-controls';
import { styles } from '@/styles/matrimony-form.styles';
import type { FormState, UpdateForm } from './form-model';
import { profileForChoices, genderChoices, maritalChoices } from './form-choices';

export function BasicDetailsSection({
  form,
  update,
  profileId,
}: {
  form: FormState;
  update: UpdateForm;
  profileId?: string;
}) {
  return (
    <Section title="1. प्रोफाइल की बेसिक जानकारी">
      <Text style={styles.inlineLabel}>प्रोफाइल किसके लिए है?</Text>
      <ChoiceRow
        items={profileForChoices}
        value={form.profileFor}
        onChange={(value) => update('profileFor', value)}
        disabled={Boolean(profileId)}
      />

      <Text style={styles.inlineLabel}>लिंग</Text>
      <ChoiceRow
        items={genderChoices}
        value={form.gender}
        onChange={(value) => update('gender', value)}
      />

      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="पहला नाम"
            value={form.firstName}
            onChangeText={(value) => update('firstName', value)}
            required
          />
        </View>
        <View style={styles.col}>
          <Field
            label="उपनाम"
            value={form.lastName}
            onChangeText={(value) => update('lastName', value)}
            required
          />
        </View>
      </View>
      <Field
        label="मध्य नाम"
        value={form.middleName}
        onChangeText={(value) => update('middleName', value)}
      />
      <DateField
        label="जन्मतिथि"
        value={form.dateOfBirth}
        onChange={(value) => update('dateOfBirth', value)}
        maximumDate={
          new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate())
        }
        required
      />
      <Field
        label="ऊंचाई (सेमी)"
        value={form.heightCm}
        onChangeText={(value) => update('heightCm', value)}
        placeholder="जैसे 170"
        keyboardType="numeric"
      />

      <Text style={styles.inlineLabel}>वैवाहिक स्थिति</Text>
      <ChoiceRow
        items={maritalChoices}
        value={form.maritalStatus}
        onChange={(value) => update('maritalStatus', value)}
      />
    </Section>
  );
}
