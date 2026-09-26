import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguageText } from '@/hooks/use-language-text';
import { useAppSelector } from '@/store/hooks';
import { type SupportCategory, useSendSupportMessageMutation } from '@/services/support-api';

export default function SupportScreen() {
  const { text } = useLanguageText();
  const token = useAppSelector((state) => state.auth.accessToken);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [category, setCategory] = useState<SupportCategory>('FEEDBACK');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [ticketId, setTicketId] = useState('');
  const sending = useRef(false);
  const [send, { isLoading }] = useSendSupportMessageMutation();
  const login = () =>
    router.push({ pathname: '/auth', params: { mode: 'login', next: '/support' } });

  async function submit() {
    if (sending.current) return;
    if (!token) {
      login();
      return;
    }
    if (subject.trim().length < 3 || message.trim().length < 10) {
      setError(
        text(
          'विषय कम से कम 3 और संदेश कम से कम 10 अक्षरों में लिखें।',
          'Enter at least 3 characters for the subject and 10 for the message.',
        ),
      );
      return;
    }
    sending.current = true;
    setError('');
    try {
      const result = await send({
        category,
        subject: subject.trim(),
        message: message.trim(),
      }).unwrap();
      setTicketId(result.ticket.id);
      setSubject('');
      setMessage('');
    } catch (err) {
      if (typeof err === 'object' && err && 'status' in err && err.status === 401) {
        setError(
          text(
            'लॉगिन समाप्त हो गया है। फिर से लॉगिन करें; आपका संदेश यहीं रहेगा।',
            'Your session expired. Log in again; your message will stay here.',
          ),
        );
        login();
      } else
        setError(
          text(
            'संदेश नहीं भेजा जा सका। आपकी जानकारी सुरक्षित है, फिर कोशिश करें।',
            'Could not send your message. Your draft is still here; please retry.',
          ),
        );
    } finally {
      sending.current = false;
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          <Pressable accessibilityRole="button" style={s.back} onPress={() => router.back()}>
            <Text style={s.link}>{text('← वापस', '← Back')}</Text>
          </Pressable>
          <Text style={s.eyebrow}>DAMODAR PRAYAS</Text>
          <Text style={s.title}>{text('सहायता और संपर्क', 'Help & contact')}</Text>
          <Text style={s.subtitle}>
            {text(
              'आपकी बात हमारे लिए ज़रूरी है। सुझाव, शिकायत या कोई सवाल हमें भेजें।',
              'Share your feedback, a complaint or a question with our team.',
            )}
          </Text>
          {!hydrated ? (
            <ActivityIndicator color="#97152A" />
          ) : ticketId ? (
            <View style={s.card}>
              <Text style={s.title}>{text('संदेश भेज दिया गया', 'Message sent')}</Text>
              <Text style={s.subtitle}>
                {text(
                  'हमारी टीम आपके संदेश की समीक्षा करेगी। ज़रूरत पड़ने पर आपके अकाउंट के संपर्क विवरण से संपर्क करेगी।',
                  'Our team will review your message and can contact you using your account details if needed.',
                )}
              </Text>
              <Text selectable style={s.note}>
                {text('संदर्भ नंबर', 'Reference')}: {ticketId}
              </Text>
              <Pressable
                accessibilityRole="button"
                style={s.button}
                onPress={() => setTicketId('')}
              >
                <Text style={s.buttonText}>
                  {text('एक और संदेश भेजें', 'Send another message')}
                </Text>
              </Pressable>
            </View>
          ) : !token ? (
            <View style={s.card}>
              <Text style={s.heading}>
                {text('संदेश भेजने के लिए लॉगिन करें', 'Log in to send a message')}
              </Text>
              <Text style={s.note}>
                {text(
                  'नाम और मोबाइल दोबारा भरने की ज़रूरत नहीं है। आपकी अकाउंट जानकारी संदेश के साथ टीम को दिखाई देगी।',
                  'No need to enter your name or phone again. Your account details will be visible to our team with your message.',
                )}
              </Text>
              <Pressable accessibilityRole="button" style={s.button} onPress={login}>
                <Text style={s.buttonText}>{text('लॉगिन करें', 'Log in')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={s.card}>
              <Text style={s.note}>
                {text(
                  'यह संदेश केवल प्रशासन को दिखेगा। नाम, मोबाइल और ईमेल आपके अकाउंट से लिए जाएँगे।',
                  'Only the administration can see this message. Your name, phone and email come from your account.',
                )}
              </Text>
              <Text style={s.label}>
                {text('आप क्या भेजना चाहते हैं?', 'What would you like to send?')}
              </Text>
              <View style={s.chips}>
                {(
                  [
                    ['FEEDBACK', 'सुझाव', 'Feedback'],
                    ['COMPLAINT', 'शिकायत', 'Complaint'],
                    ['CONTACT', 'संपर्क / सवाल', 'Contact / question'],
                  ] as const
                ).map(([value, hi, en]) => (
                  <Pressable
                    key={value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === value }}
                    disabled={isLoading}
                    style={[s.chip, category === value && s.selected]}
                    onPress={() => setCategory(value)}
                  >
                    <Text style={category === value ? s.buttonText : s.link}>{text(hi, en)}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={s.label}>{text('विषय *', 'Subject *')}</Text>
              <TextInput
                accessibilityLabel={text('विषय', 'Subject')}
                style={s.input}
                value={subject}
                onChangeText={setSubject}
                editable={!isLoading}
                maxLength={120}
                placeholder={text('संक्षेप में बताइए', 'Briefly describe the topic')}
                placeholderTextColor="#8B7970"
              />
              <Text style={s.label}>{text('आपका संदेश *', 'Your message *')}</Text>
              <TextInput
                accessibilityLabel={text('आपका संदेश', 'Your message')}
                style={[s.input, s.message]}
                value={message}
                onChangeText={setMessage}
                editable={!isLoading}
                maxLength={4000}
                multiline
                textAlignVertical="top"
                placeholder={text('अपनी बात विस्तार से लिखें…', 'Tell us more…')}
                placeholderTextColor="#8B7970"
              />
              <Text style={s.counter}>{message.length}/4000</Text>
              {error ? (
                <Text accessibilityRole="alert" style={s.error}>
                  {error}
                </Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={isLoading}
                style={[s.button, isLoading && { opacity: 0.6 }]}
                onPress={() => void submit()}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={s.buttonText}>{text('संदेश भेजें →', 'Send message →')}</Text>
                )}
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFF8EF' },
  content: { padding: 22, paddingBottom: 48, gap: 16 },
  back: { alignSelf: 'flex-start', paddingVertical: 12, paddingRight: 24 },
  link: { color: '#97152A', fontSize: 15, fontWeight: '600' },
  eyebrow: { color: '#9C7135', fontSize: 12, letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: '700', color: '#871428' },
  subtitle: { fontSize: 16, lineHeight: 25, color: '#716257' },
  heading: { fontSize: 21, color: '#871428', fontWeight: '700' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EBDECF',
    padding: 18,
    gap: 12,
  },
  note: { color: '#706356', fontSize: 14, lineHeight: 22 },
  label: { fontSize: 16, fontWeight: '600', color: '#3C2722', marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#DBBBAE', borderRadius: 12, padding: 12, minHeight: 46 },
  selected: { backgroundColor: '#97152A', borderColor: '#97152A' },
  input: {
    borderWidth: 1,
    borderColor: '#E0D2C3',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#33241F',
    minHeight: 50,
  },
  message: { minHeight: 170 },
  counter: { textAlign: 'right', color: '#827469', fontSize: 12 },
  error: { color: '#AE1125', lineHeight: 22 },
  button: {
    backgroundColor: '#97152A',
    padding: 16,
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: 'white', fontWeight: '600', fontSize: 15 },
});
