import { C, styles } from '@/styles/community-submit.styles';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CitySelect, StateSelect, DateSelect, todayInIndia } from '@/features/community/selectors';
import { useLanguageText } from '@/hooks/use-language-text';

import { uploadContentBanner, type ContentUploadableFile } from '@/services/content-media';
import {
  type CommunityPostCategory,
  useSubmitCommunityPostMutation,
} from '@/services/community-api';
import { useAppSelector } from '@/store/hooks';

type SupportedCategory = Extract<
  CommunityPostCategory,
  'NEWS' | 'EVENT' | 'ADVERTISEMENT' | 'OBITUARY'
>;
type ObituaryType = 'DEATH_NOTICE' | 'UTHAWNA' | 'CHAUTHA' | 'TRIBUTE' | 'OTHER';
const obituaryOptions: { value: ObituaryType; label: string }[] = [
  { value: 'DEATH_NOTICE', label: 'निधन सूचना' },
  { value: 'UTHAWNA', label: 'उठावना' },
  { value: 'CHAUTHA', label: 'चौथा' },
  { value: 'TRIBUTE', label: 'श्रद्धांजलि सभा' },
  { value: 'OTHER', label: 'अन्य' },
];

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
  const { text, apiLanguage } = useLanguageText();
  const [cityId, setCityId] = useState('');
  const [postDate, setPostDate] = useState(todayInIndia);
  const params = useLocalSearchParams<{ category?: string | string[] }>();
  const rawCategory = Array.isArray(params.category) ? params.category[0] : params.category;
  const category: SupportedCategory =
    rawCategory === 'EVENT'
      ? 'EVENT'
      : rawCategory === 'ADVERTISEMENT'
        ? 'ADVERTISEMENT'
        : rawCategory === 'OBITUARY'
          ? 'OBITUARY'
          : 'NEWS';

  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [submitPost, { isLoading: isSubmitting }] = useSubmitCommunityPostMutation();
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [obituaryType, setObituaryType] = useState<ObituaryType>('DEATH_NOTICE');
  const [deceasedName, setDeceasedName] = useState('');
  const [deathDate, setDeathDate] = useState(todayInIndia);
  const [eventTime, setEventTime] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [banner, setBanner] = useState<ContentUploadableFile | null>(null);
  const [uploading, setUploading] = useState(false);

  const label =
    category === 'EVENT'
      ? 'कार्यक्रम'
      : category === 'ADVERTISEMENT'
        ? 'विज्ञापन'
        : category === 'OBITUARY'
          ? 'शोक सूचना'
          : 'समाचार';
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

    if (category === 'OBITUARY' && !deceasedName.trim()) {
      Alert.alert(
        text('नाम भरें', 'Enter name'),
        text('दिवंगत व्यक्ति का नाम भरें।', 'Enter the deceased person’s name.'),
      );
      return;
    }

    if (!cityId) {
      Alert.alert(
        text('शहर चुनें', 'Select city'),
        text('कृपया सूची से अपना शहर चुनें।', 'Please select your city from the list.'),
      );
      return;
    }

    if (
      (category === 'EVENT' || (category === 'OBITUARY' && obituaryType !== 'DEATH_NOTICE')) &&
      !eventDate
    ) {
      Alert.alert(
        text('कार्यक्रम की तारीख', 'Event date'),
        text('कृपया तारीख चुनें।', 'Please select a date.'),
      );
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
        state: 'Madhya Pradesh',
        cityId,
        postDate:
          category === 'EVENT' || (category === 'OBITUARY' && obituaryType !== 'DEATH_NOTICE')
            ? eventDate
            : category === 'OBITUARY'
              ? deathDate || postDate
              : postDate,
        bannerUrl: uploaded?.url ?? null,
        bannerStorageKey: uploaded?.storageKey ?? null,
        contactName: optionalText(contactName),
        contactPhone: optionalText(contactPhone),
        location: optionalText(location),
        eventDate:
          category === 'EVENT' || (category === 'OBITUARY' && obituaryType !== 'DEATH_NOTICE')
            ? new Date(`${eventDate.trim()}T12:00:00+05:30`).toISOString()
            : null,
        obituaryType: category === 'OBITUARY' ? obituaryType : null,
        deceasedName: category === 'OBITUARY' ? deceasedName.trim() : null,
        deathDate:
          category === 'OBITUARY' && deathDate.trim()
            ? new Date(`${deathDate.trim()}T12:00:00+05:30`).toISOString()
            : null,
        eventTime: category === 'OBITUARY' ? optionalText(eventTime) : null,
        translations: [
          {
            language: apiLanguage,
            title: title.trim(),
            details: details.trim(),
          },
        ],
      }).unwrap();

      Alert.alert(
        'समीक्षा के लिए भेज दिया',
        `${label} अभी सार्वजनिक नहीं होगा। Admin approval के बाद ही ऐप में दिखाई देगा।`,
        [
          {
            text: 'ठीक है',
            onPress: () => router.replace({ pathname: '/community', params: { category } }),
          },
        ],
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
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={C.maroon}
              size={20}
            />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>नई जानकारी जोड़ें</Text>
            <Text style={styles.title}>{label} भेजें</Text>
          </View>
        </View>

        <View style={styles.approvalNote}>
          <SymbolView
            name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
            tintColor={C.green}
            size={22}
          />
          <Text style={styles.approvalText}>
            सबमिट करने के बाद यह approval में जाएगा। स्वीकृति से पहले public feed में नहीं दिखेगा।
          </Text>
        </View>

        <View style={styles.card}>
          {category === 'OBITUARY' ? (
            <>
              <Text style={styles.label}>सूचना का प्रकार *</Text>
              <View style={styles.optionWrap}>
                {obituaryOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    style={[
                      styles.optionChip,
                      obituaryType === option.value && styles.optionChipActive,
                    ]}
                    onPress={() => setObituaryType(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        obituaryType === option.value && styles.optionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.label}>दिवंगत व्यक्ति का नाम *</Text>
              <TextInput
                value={deceasedName}
                onChangeText={setDeceasedName}
                style={styles.input}
                placeholder="स्व. श्री / श्रीमती का नाम"
                placeholderTextColor="#A49890"
              />
              <Text style={styles.label}>{text('निधन दिनांक *', 'Date of death *')}</Text>
              <DateSelect value={deathDate} onChange={setDeathDate} />
              {obituaryType !== 'DEATH_NOTICE' ? (
                <>
                  <Text style={styles.label}>{text('समारोह की तारीख *', 'Event date *')}</Text>
                  <DateSelect value={eventDate} onChange={setEventDate} />
                  <Text style={styles.label}>कार्यक्रम समय</Text>
                  <TextInput
                    value={eventTime}
                    onChangeText={setEventTime}
                    style={styles.input}
                    placeholder="जैसे शाम 4:00 बजे"
                    placeholderTextColor="#A49890"
                  />
                </>
              ) : null}
            </>
          ) : null}

          <Text style={styles.label}>शीर्षक *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder={`${label} का शीर्षक`}
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>विवरण *</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
            placeholder="पूरी जानकारी लिखें"
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>Banner image</Text>
          <Pressable style={styles.imagePicker} onPress={() => void pickBanner()}>
            {banner ? (
              <Image source={{ uri: banner.uri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <SymbolView
                  name={{ ios: 'photo.fill', android: 'image', web: 'image' }}
                  tintColor={C.gold}
                  size={34}
                />
                <Text style={styles.imageText}>इमेज चुनें</Text>
              </View>
            )}
          </Pressable>

          {category === 'EVENT' ? (
            <>
              <Text style={styles.label}>{text('समारोह की तारीख *', 'Event date *')}</Text>
              <DateSelect value={eventDate} onChange={setEventDate} />
            </>
          ) : null}

          <Text style={styles.label}>{text('राज्य *', 'State *')}</Text>
          <StateSelect />
          <Text style={styles.label}>{text('शहर *', 'City *')}</Text>
          <CitySelect value={cityId} onChange={setCityId} />
          {category === 'NEWS' || category === 'ADVERTISEMENT' ? (
            <>
              <Text style={styles.label}>{text('तारीख *', 'Date *')}</Text>
              <DateSelect value={postDate} onChange={setPostDate} />
            </>
          ) : null}
          <Text style={styles.label}>
            {text('पता / आयोजन स्थल (वैकल्पिक)', 'Address / venue (optional)')}
          </Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={styles.input}
            placeholder={text('मोहल्ला, हॉल या पूरा पता', 'Area, hall or full address')}
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>संपर्क नाम</Text>
          <TextInput
            value={contactName}
            onChangeText={setContactName}
            style={styles.input}
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>संपर्क मोबाइल</Text>
          <TextInput
            value={contactPhone}
            onChangeText={setContactPhone}
            style={styles.input}
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
            keyboardType="phone-pad"
          />
        </View>

        <Pressable
          disabled={busy}
          style={[styles.submitButton, busy && styles.disabled]}
          onPress={() => void submit()}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Approval के लिए भेजें</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
