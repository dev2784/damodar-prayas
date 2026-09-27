import { Field, Section } from './form-controls';
import type { FormState, UpdateForm } from './form-model';

export function ContactWorkSection({ form, update }: { form: FormState; update: UpdateForm }) {
  return (
    <Section
      title="2. संपर्क, शिक्षा और काम"
      subtitle="संपर्क जानकारी सार्वजनिक लिस्ट में नहीं दिखाई जाएगी।"
    >
      <Field
        label="मोबाइल नंबर"
        value={form.contactPhone}
        onChangeText={(value) => update('contactPhone', value)}
        placeholder="+91..."
        keyboardType="phone-pad"
      />
      <Field
        label="ईमेल"
        value={form.contactEmail}
        onChangeText={(value) => update('contactEmail', value)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Field
        label="शिक्षा"
        value={form.education}
        onChangeText={(value) => update('education', value)}
        placeholder="जैसे B.Tech, MBA"
      />
      <Field
        label="पेशा"
        value={form.occupation}
        onChangeText={(value) => update('occupation', value)}
        placeholder="जैसे Software Engineer"
      />
      <Field
        label="कंपनी / व्यवसाय"
        value={form.companyOrBusiness}
        onChangeText={(value) => update('companyOrBusiness', value)}
      />
      <Field
        label="वार्षिक आय (₹)"
        value={form.annualIncome}
        onChangeText={(value) => update('annualIncome', value)}
        keyboardType="numeric"
      />
    </Section>
  );
}
