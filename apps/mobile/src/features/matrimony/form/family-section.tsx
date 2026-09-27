import { View } from 'react-native';
import { Field, Section } from './form-controls';
import { styles } from '@/styles/matrimony-form.styles';
import type { FormState, UpdateForm } from './form-model';

export function FamilySection({ form, update }: { form: FormState; update: UpdateForm }) {
  return (
    <Section title="4. परिवार और परिचय">
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="पिता का नाम"
            value={form.fatherName}
            onChangeText={(value) => update('fatherName', value)}
          />
        </View>
        <View style={styles.col}>
          <Field
            label="पिता का व्यवसाय"
            value={form.fatherOccupation}
            onChangeText={(value) => update('fatherOccupation', value)}
          />
        </View>
      </View>
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="माता का नाम"
            value={form.motherName}
            onChangeText={(value) => update('motherName', value)}
          />
        </View>
        <View style={styles.col}>
          <Field
            label="माता का व्यवसाय"
            value={form.motherOccupation}
            onChangeText={(value) => update('motherOccupation', value)}
          />
        </View>
      </View>
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="भाई"
            value={form.brothers}
            onChangeText={(value) => update('brothers', value)}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Field
            label="बहनें"
            value={form.sisters}
            onChangeText={(value) => update('sisters', value)}
            keyboardType="numeric"
          />
        </View>
      </View>
      <Field
        label="परिवार के बारे में"
        value={form.familyDetails}
        onChangeText={(value) => update('familyDetails', value)}
        multiline
      />
      <Field
        label="अपने बारे में"
        value={form.about}
        onChangeText={(value) => update('about', value)}
        multiline
      />
    </Section>
  );
}
