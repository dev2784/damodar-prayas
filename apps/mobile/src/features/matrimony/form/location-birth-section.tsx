import { View, Text } from 'react-native';
import { Field, Section, ChoiceRow } from './form-controls';
import { styles } from '@/styles/matrimony-form.styles';
import type { FormState, UpdateForm } from './form-model';

export function LocationBirthSection({ form, update }: { form: FormState; update: UpdateForm }) {
  return (
    <Section
      title="3. समाज, जन्म और स्थान"
      subtitle="शहर के साथ गाँव और कस्बा भी लिख सकते हैं। पूरा पता private रहेगा।"
    >
      <Field label="गोत्र" value={form.gotra} onChangeText={(value) => update('gotra', value)} />
      <Text style={styles.inlineLabel}>मांगलिक</Text>
      <ChoiceRow
        items={[
          { label: 'हाँ', value: 'YES' as const },
          { label: 'नहीं', value: 'NO' as const },
          { label: 'पता नहीं', value: 'UNKNOWN' as const },
        ]}
        value={form.manglik}
        onChange={(value) => update('manglik', value)}
      />
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="जन्म समय"
            value={form.birthTime}
            onChangeText={(value) => update('birthTime', value)}
            placeholder="जैसे 07:30 AM"
          />
        </View>
        <View style={styles.col}>
          <Field
            label="जन्म स्थान"
            value={form.birthPlace}
            onChangeText={(value) => update('birthPlace', value)}
          />
        </View>
      </View>
      <Field
        label="वर्तमान शहर / गाँव / कस्बा"
        value={form.currentCity}
        onChangeText={(value) => update('currentCity', value)}
        placeholder="जैसे इंदौर / राऊ / ग्राम ..."
      />
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="जिला"
            value={form.district}
            onChangeText={(value) => update('district', value)}
          />
        </View>
        <View style={styles.col}>
          <Field
            label="राज्य"
            value={form.state}
            onChangeText={(value) => update('state', value)}
          />
        </View>
      </View>
      <View style={styles.twoCol}>
        <View style={styles.col}>
          <Field
            label="पिन कोड"
            value={form.postalCode}
            onChangeText={(value) => update('postalCode', value)}
            placeholder="6 अंक"
            keyboardType="numeric"
          />
        </View>
        <View style={styles.col}>
          <Field
            label="देश"
            value={form.country}
            onChangeText={(value) => update('country', value)}
          />
        </View>
      </View>
      <Field
        label="पूरा पता"
        value={form.fullAddress}
        onChangeText={(value) => update('fullAddress', value)}
        placeholder="मोहल्ला / वार्ड / ग्राम, पोस्ट, तहसील आदि"
        multiline
      />
      <Field
        label="मूल गाँव / शहर"
        value={form.nativePlace}
        onChangeText={(value) => update('nativePlace', value)}
      />
    </Section>
  );
}
