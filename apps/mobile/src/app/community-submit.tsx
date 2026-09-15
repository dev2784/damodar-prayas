import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { uploadContentBanner, type ContentUploadableFile } from '@/services/content-media';
import {
  type CommunityPostCategory,
  useSubmitCommunityPostMutation,
} from '@/services/community-api';
import { useAppSelector } from '@/store/hooks';

const C = {
  bg: '#FFF8ED',
  paper: '#FFFDF9',
  maroon: '#A30D1E',
  maroonDark: '#74101B',
  gold: '#D99A2B',
  text: '#251B18',
  muted: '#776A64',
  line: '#E9D8C5',
  green: '#168458',
};

type SupportedCategory = Extract<CommunityPostCategory, 'NEWS' | 'EVENT' | 'ADVERTISEMENT'>;

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function fileNameFromUri(uri: string) {
  const raw = uri.split('/').pop();
  return raw && raw.includes('.') ? raw : `banner-${Date.now()}.jpg`;
}

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data;
    return data?.message || data?.error || 'कृपया जानकारी जाँचकर दोबारा कोशिश करें।';
  }
  return 'कृपया जानकारी जाँचकर दोबारा कोशिश करें।';
}

export default function CommunitySubmitScreen() {
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const category: SupportedCategory = rawCategory === 'EVENT'
    ? 'EVENT'
    : rawCategory === 'ADVERTISEMENT'
      ? 'ADVERTISEMENT'
      : 'NEWS';

  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [submitPost, { isLoading: isSubmitting }] = useSubmitCommunityPostMutation();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [banner, setBanner] = useState<ContentUploadableFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const label = category === 'EVENT' ? 'कार्यक्रम' : category === 'ADVERTISEMENT' ? 'विज्ञापन' : 'समाचार';
  const busy = isSubmitting || uploading;

  async function pickBanner() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const type = asset.mimeType || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      Alert.alert('इमेज फॉर्मेट', 'कृपया JPG, PNG या WEBP इमेज चुनें।');
      return;
    }

    setBanner({
      uri: asset.uri,
      name: asset.fileName || fileNameFromUri(asset.uri),
      type,
    });
  }

  async function submit() {
    if (!accessToken) {
      Alert.alert('लॉगिन जरूरी है', 'कुछ जोड़ने के लिए पहले लॉगिन करें।');
      router.push('/auth');
      return;
    }

    if (!title.trim() || !details.trim()) {
      Alert.alert('जरूरी जानकारी बाकी है', 'शीर्षक और विवरण भरना जरूरी है।');
      return;
    }

    if (category === 'EVENT' && !/^\d{4}-\d{2}-\d{2}$/.test(eventDate.trim())) {
      Alert.alert('कार्यक्रम की तारीख', 'तारीख YYYY-MM-DD में भरें, जैसे 2026-10-05।');
      return;
    }

    if (contactPhone.trim() && !/^\+?[1-9]\d{7,14}$/.test(contactPhone.trim())) {
      Alert.alert('मोबाइल नंबर जाँचें', 'कृपया सही मोबाइल नंबर भरें।');
      return;
    }

    try {
      let uploaded: { url: string; storageKey: string } | null = null;
      if (banner) {
        setUploading(true);
        const result = await uploadContentBanner({ file: banner, accessToken });
        uploaded = result.media;
        setUploading(false);
      }

      await submitPost({
        category,
        bannerUrl: uploaded?.url ?? null,
        bannerStorageKey: uploaded?.storageKey ?? null,
        contactName: optionalText(contactName),
        contactPhone: optionalText(contactPhone),
        location: optionalText(location),
        eventDate: category === 'EVENT' ? new Date(`${eventDate.trim()}T12:00:00+05:30`).toISOString() : null,
        translations: [
          {
            language: 'HI',
            title: title.trim(),
            details: details.trim(),
          },
        ],
      }).unwrap();

      Alert.alert(
        'समीक्षा के लिए भेज दिया',
        `${label} अभी सार्वजनिक नहीं होगा। Admin approval के बाद ही ऐप में दिखाई देगा।`,
        [{ text: 'ठीक है', onPress: () => router.replace('/community') }],
      );
    } catch (error) {
      setUploading(false);
      Alert.alert('सबमिट नहीं हुआ', errorMessage(error));
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={20} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>नई जानकारी जोड़ें</Text>
            <Text style={styles.title}>{label} भेजें</Text>
          </View>
        </View>

        <View style={styles.approvalNote}>
          <SymbolView name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }} tintColor={C.green} size={22} />
          <Text style={styles.approvalText}>सबमिट करने के बाद यह approval में जाएगा। स्वीकृति से पहले public feed में नहीं दिखेगा।</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>शीर्षक *</Text>
          <TextInput value={title} onChangeText={setTitle} style={styles.input} placeholder={`${label} का शीर्षक`} placeholderTextColor="#A49890" />

          <Text style={styles.label}>विवरण *</Text>
          <TextInput value={details} onChangeText={setDetails} style={[styles.input, styles.multiline]} multiline textAlignVertical="top" placeholder="पूरी जानकारी लिखें" placeholderTextColor="#A49890" />

          <Text style={styles.label}>Banner image</Text>
          <Pressable style={styles.imagePicker} onPress={() => void pickBanner()}>
            {banner ? (
              <Image source={{ uri: banner.uri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <SymbolView name={{ ios: 'photo.fill', android: 'image', web: 'image' }} tintColor={C.gold} size={34} />
                <Text style={styles.imageText}>इमेज चुनें</Text>
              </View>
            )}
          </Pressable>

          {category === 'EVENT' ? (
            <>
              <Text style={styles.label}>कार्यक्रम तारीख *</Text>
              <TextInput value={eventDate} onChangeText={setEventDate} style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#A49890" keyboardType="numbers-and-punctuation" />
            </>
          ) : null}

          <Text style={styles.label}>स्थान</Text>
          <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholder="शहर / स्थान" placeholderTextColor="#A49890" />

          <Text style={styles.label}>संपर्क नाम</Text>
          <TextInput value={contactName} onChangeText={setContactName} style={styles.input} placeholder="वैकल्पिक" placeholderTextColor="#A49890" />

          <Text style={styles.label}>संपर्क मोबाइल</Text>
          <TextInput value={contactPhone} onChangeText={setContactPhone} style={styles.input} placeholder="वैकल्पिक" placeholderTextColor="#A49890" keyboardType="phone-pad" />
        </View>

        <Pressable disabled={busy} style={[styles.submitButton, busy && styles.disabled]} onPress={() => void submit()}>
          {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Approval के लिए भेजें</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 120 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  backButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1 },
  eyebrow: { color: C.gold, fontSize: 9.5, fontWeight: '900', letterSpacing: 1 },
  title: { color: C.maroonDark, fontSize: 25, fontWeight: '900', marginTop: 2 },
  approvalNote: { flexDirection: 'row', gap: 9, borderRadius: 15, backgroundColor: '#EFFAF4', borderWidth: 1, borderColor: '#CDE9D9', padding: 12, marginBottom: 14 },
  approvalText: { flex: 1, color: '#35664F', fontSize: 10.5, lineHeight: 16, fontWeight: '700' },
  card: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14 },
  label: { color: C.text, fontSize: 10.5, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  input: { minHeight: 47, borderRadius: 12, borderWidth: 1, borderColor: C.line, backgroundColor: '#FFFFFF', paddingHorizontal: 12, color: C.text, fontSize: 12 },
  multiline: { minHeight: 120, paddingTop: 12 },
  imagePicker: { overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: C.line, backgroundColor: '#FFF7ED' },
  preview: { width: '100%', aspectRatio: 1.9 },
  imagePlaceholder: { aspectRatio: 1.9, alignItems: 'center', justifyContent: 'center', gap: 7 },
  imageText: { color: C.maroon, fontSize: 10.5, fontWeight: '900' },
  submitButton: { marginTop: 16, minHeight: 50, borderRadius: 14, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' },
  disabled: { opacity: 0.6 },
});
