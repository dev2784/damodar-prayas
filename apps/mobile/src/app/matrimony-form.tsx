import { C, styles } from '@/styles/matrimony-form.styles';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  uploadMatrimonyMediaFile,
  useDeleteMatrimonyKundaliMutation,
  useDeleteMatrimonyPhotoMutation,
  useSetPrimaryMatrimonyPhotoMutation,
} from '@/services/matrimony-media-api';
import {
  type MatrimonyCategory,
  type MatrimonyGender,
  type MatrimonyMaritalStatus,
  type MatrimonyOwnerProfile,
  type MatrimonyProfileFor,
  type MatrimonyProfileInput,
  useCreateMatrimonyProfileMutation,
  useGetMyMatrimonyProfilesQuery,
  useSubmitMatrimonyProfileMutation,
  useUpdateMatrimonyProfileMutation,
} from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

type ManglikChoice = 'YES' | 'NO' | 'UNKNOWN';

type FormState = {
  profileFor: MatrimonyProfileFor;
  category: MatrimonyCategory;
  gender: MatrimonyGender;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  heightCm: string;
  maritalStatus: MatrimonyMaritalStatus;
  contactPhone: string;
  contactEmail: string;
  education: string;
  occupation: string;
  companyOrBusiness: string;
  annualIncome: string;
  gotra: string;
  manglik: ManglikChoice;
  birthTime: string;
  birthPlace: string;
  currentCity: string;
  district: string;
  state: string;
  country: string;
  fullAddress: string;
  postalCode: string;
  nativePlace: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  brothers: string;
  sisters: string;
  familyDetails: string;
  about: string;
};

const initialForm: FormState = {
  profileFor: 'SELF',
  category: 'JUNA_GUJARATI',
  gender: 'MALE',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  heightCm: '',
  maritalStatus: 'NEVER_MARRIED',
  contactPhone: '',
  contactEmail: '',
  education: '',
  occupation: '',
  companyOrBusiness: '',
  annualIncome: '',
  gotra: '',
  manglik: 'UNKNOWN',
  birthTime: '',
  birthPlace: '',
  currentCity: '',
  district: '',
  state: '',
  country: 'India',
  fullAddress: '',
  postalCode: '',
  nativePlace: '',
  fatherName: '',
  fatherOccupation: '',
  motherName: '',
  motherOccupation: '',
  brothers: '0',
  sisters: '0',
  familyDetails: '',
  about: '',
};

const profileForChoices: { label: string; value: MatrimonyProfileFor }[] = [
  { label: 'स्वयं', value: 'SELF' },
  { label: 'पुत्र', value: 'SON' },
  { label: 'पुत्री', value: 'DAUGHTER' },
  { label: 'भाई', value: 'BROTHER' },
  { label: 'बहन', value: 'SISTER' },
  { label: 'रिश्तेदार', value: 'RELATIVE' },
];

/* Future community-category choices. Keep model/API compatibility, but hide selector for now.
const categoryChoices: { label: string; value: MatrimonyCategory }[] = [
  { label: 'जूना गुजराती', value: 'JUNA_GUJARATI' },
  { label: 'पीपा', value: 'PIPA' },
  { label: 'नामदेव', value: 'NAMDEV' },
];
*/

const genderChoices: { label: string; value: MatrimonyGender }[] = [
  { label: 'पुरुष', value: 'MALE' },
  { label: 'महिला', value: 'FEMALE' },
  { label: 'अन्य', value: 'OTHER' },
];

const maritalChoices: { label: string; value: MatrimonyMaritalStatus }[] = [
  { label: 'अविवाहित', value: 'NEVER_MARRIED' },
  { label: 'तलाकशुदा', value: 'DIVORCED' },
  { label: 'विधुर/विधवा', value: 'WIDOWED' },
  { label: 'अलग रह रहे', value: 'SEPARATED' },
];

const mediaStatusLabel = {
  PENDING: 'समीक्षा में',
  APPROVED: 'स्वीकृत',
  REJECTED: 'अस्वीकृत',
} as const;

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function fileNameFromUri(uri: string, fallback: string) {
  const last = uri.split('/').pop()?.split('?')[0];
  return last || fallback;
}

function requestErrorCode(error: unknown) {
  if (typeof error !== 'object' || !error || !('data' in error)) return '';
  const data = (error as { data?: { error?: string; message?: string } }).data;
  return data?.error || data?.message || '';
}

function mediaErrorMessage(error: unknown) {
  const code = requestErrorCode(error);
  if (code === 'MEDIA_PROVIDER_NOT_CONFIGURED') {
    return 'फोटो/कुंडली upload storage अभी server पर configure नहीं है। Cloudinary configure होते ही यही upload buttons काम करेंगे।';
  }
  if (code === 'PROFILE_PHOTO_LIMIT_REACHED') return 'अधिकतम 6 फोटो जोड़े जा सकते हैं।';
  if (code === 'KUNDALI_ALREADY_UPLOADED')
    return 'एक कुंडली पहले से जुड़ी है। नई जोड़ने से पहले पुरानी हटाएँ।';
  if (code === 'UNSUPPORTED_PHOTO_TYPE') return 'केवल JPG, PNG या WEBP फोटो चुनें।';
  if (code === 'UNSUPPORTED_KUNDALI_TYPE') return 'कुंडली PDF, JPG, PNG या WEBP में होनी चाहिए।';
  if (code === 'UPLOAD_NETWORK_ERROR')
    return 'Upload request server तक नहीं पहुँच पाई। इंटरनेट/API connection जाँचकर दोबारा कोशिश करें।';
  if (code) return `Upload fail हुआ: ${code}`;
  return 'Upload पूरा नहीं हुआ। कृपया दोबारा कोशिश करें।';
}

function profileToForm(profile: MatrimonyOwnerProfile): FormState {
  return {
    profileFor: profile.profileFor,
    category: profile.category,
    gender: profile.gender,
    firstName: profile.firstName ?? '',
    middleName: profile.middleName ?? '',
    lastName: profile.lastName ?? '',
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
    heightCm: profile.heightCm?.toString() ?? '',
    maritalStatus: profile.maritalStatus,
    contactPhone: profile.contactPhone ?? '',
    contactEmail: profile.contactEmail ?? '',
    education: profile.education ?? '',
    occupation: profile.occupation ?? '',
    companyOrBusiness: profile.companyOrBusiness ?? '',
    annualIncome: profile.annualIncome?.toString() ?? '',
    gotra: profile.gotra ?? '',
    manglik: profile.manglik === true ? 'YES' : profile.manglik === false ? 'NO' : 'UNKNOWN',
    birthTime: profile.birthTime ?? '',
    birthPlace: profile.birthPlace ?? '',
    currentCity: profile.currentCity ?? '',
    district: profile.district ?? '',
    state: profile.state ?? '',
    country: profile.country || 'India',
    fullAddress: profile.fullAddress ?? '',
    postalCode: profile.postalCode ?? '',
    nativePlace: profile.nativePlace ?? '',
    fatherName: profile.fatherName ?? '',
    fatherOccupation: profile.fatherOccupation ?? '',
    motherName: profile.motherName ?? '',
    motherOccupation: profile.motherOccupation ?? '',
    brothers: profile.brothers?.toString() ?? '0',
    sisters: profile.sisters?.toString() ?? '0',
    familyDetails: profile.familyDetails ?? '',
    about: profile.about ?? '',
  };
}

function ChoiceRow<T extends string>({
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

function Field({
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

function DateField({
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

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function MatrimonyFormScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; newProfile?: string | string[] }>();
  const profileId = Array.isArray(params.id) ? params.id[0] : params.id;
  const newProfileParam = Array.isArray(params.newProfile)
    ? params.newProfile[0]
    : params.newProfile;
  const forceNewProfile = newProfileParam === '1';
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [form, setForm] = useState<FormState>(initialForm);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  const {
    data: mineData,
    isLoading: isLoadingMine,
    refetch: refetchMine,
  } = useGetMyMatrimonyProfilesQuery(undefined, {
    skip: !accessToken,
  });
  const [createProfile, { isLoading: isCreating }] = useCreateMatrimonyProfileMutation();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateMatrimonyProfileMutation();
  const [submitProfile, { isLoading: isSubmitting }] = useSubmitMatrimonyProfileMutation();
  const [uploadingMedia, setUploadingMedia] = useState<'photo' | 'kundali' | null>(null);
  const [deletePhoto, { isLoading: isDeletingPhoto }] = useDeleteMatrimonyPhotoMutation();
  const [setPrimaryPhoto, { isLoading: isSettingPrimary }] = useSetPrimaryMatrimonyPhotoMutation();
  const [deleteKundali, { isLoading: isDeletingKundali }] = useDeleteMatrimonyKundaliMutation();

  const editingProfile = useMemo(
    () => mineData?.items.find((item) => item.id === profileId),
    [mineData?.items, profileId],
  );

  // Initialize each loaded profile once without overwriting in-progress edits on refetch.
  if (editingProfile && hydratedId !== editingProfile.id) {
    setForm(profileToForm(editingProfile));
    setHydratedId(editingProfile.id);
  } else if (!profileId && hydratedId !== null) {
    setForm(initialForm);
    setHydratedId(null);
  }

  useEffect(() => {
    if (!accessToken || profileId || forceNewProfile || isLoadingMine || !mineData) return;
    const resumable = mineData.items.find(
      (item) => item.status === 'DRAFT' || item.status === 'REJECTED',
    );
    if (resumable) {
      router.replace({ pathname: '/matrimony-form', params: { id: resumable.id } });
    }
  }, [accessToken, forceNewProfile, isLoadingMine, mineData, profileId]);

  const busy = isCreating || isUpdating || isSubmitting;
  const mediaBusy =
    uploadingMedia !== null || isDeletingPhoto || isSettingPrimary || isDeletingKundali;
  const editingApproved = editingProfile?.status === 'APPROVED';
  const editingLocked = Boolean(
    editingProfile && !['DRAFT', 'REJECTED', 'APPROVED'].includes(editingProfile.status),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth.trim()) {
      Alert.alert('जरूरी जानकारी बाकी है', 'नाम, उपनाम और जन्मतिथि भरना जरूरी है।');
      return false;
    }

    const dob = new Date(`${form.dateOfBirth}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) {
      Alert.alert('जन्मतिथि सही नहीं है', 'जन्मतिथि YYYY-MM-DD फॉर्मेट में भरें, जैसे 1998-05-21।');
      return false;
    }

    const today = new Date();
    const adultCutoff = new Date(
      Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()),
    );
    if (dob > adultCutoff) {
      Alert.alert('आयु सीमा', 'मैट्रिमोनी प्रोफाइल के लिए आयु कम से कम 18 वर्ष होनी चाहिए।');
      return false;
    }

    const height = numberOrNull(form.heightCm);
    if (height !== null && (height < 100 || height > 250)) {
      Alert.alert('ऊंचाई जाँचें', 'ऊंचाई सेंटीमीटर में 100 से 250 के बीच होनी चाहिए।');
      return false;
    }

    if (
      form.country.trim().toLowerCase() === 'india' &&
      form.postalCode.trim() &&
      !/^\d{6}$/.test(form.postalCode.trim())
    ) {
      Alert.alert('पिन कोड जाँचें', 'भारत के लिए 6 अंकों का पिन कोड भरें।');
      return false;
    }

    return true;
  }

  function buildPayload(): MatrimonyProfileInput {
    return {
      profileFor: form.profileFor,
      category: form.category,
      gender: form.gender,
      firstName: form.firstName.trim(),
      middleName: textOrNull(form.middleName),
      lastName: form.lastName.trim(),
      dateOfBirth: form.dateOfBirth.trim(),
      heightCm: numberOrNull(form.heightCm),
      maritalStatus: form.maritalStatus,
      contactPhone: textOrNull(form.contactPhone),
      contactEmail: textOrNull(form.contactEmail),
      education: textOrNull(form.education),
      occupation: textOrNull(form.occupation),
      companyOrBusiness: textOrNull(form.companyOrBusiness),
      annualIncome: numberOrNull(form.annualIncome),
      gotra: textOrNull(form.gotra),
      manglik: form.manglik === 'YES' ? true : form.manglik === 'NO' ? false : null,
      birthTime: textOrNull(form.birthTime),
      birthPlace: textOrNull(form.birthPlace),
      currentCity: textOrNull(form.currentCity),
      district: textOrNull(form.district),
      state: textOrNull(form.state),
      country: form.country.trim() || 'India',
      fullAddress: textOrNull(form.fullAddress),
      postalCode: textOrNull(form.postalCode),
      nativePlace: textOrNull(form.nativePlace),
      fatherName: textOrNull(form.fatherName),
      fatherOccupation: textOrNull(form.fatherOccupation),
      motherName: textOrNull(form.motherName),
      motherOccupation: textOrNull(form.motherOccupation),
      brothers: Math.max(0, Math.round(numberOrNull(form.brothers) ?? 0)),
      sisters: Math.max(0, Math.round(numberOrNull(form.sisters) ?? 0)),
      familyDetails: textOrNull(form.familyDetails),
      about: textOrNull(form.about),
    };
  }

  async function save(submitAfterSave: boolean) {
    if (!accessToken) {
      Alert.alert('लॉगिन जरूरी है', 'प्रोफाइल सेव करने से पहले अकाउंट में लॉगिन करें।');
      router.push('/profile');
      return;
    }

    if (editingLocked) {
      Alert.alert(
        'प्रोफाइल लॉक है',
        'यह प्रोफाइल अभी समीक्षा/स्वीकृति स्थिति में है और एडिट नहीं किया जा सकता।',
      );
      return;
    }

    if (!validate()) return;

    if (submitAfterSave && editingProfile && editingProfile.photos.length === 0) {
      Alert.alert(
        'फोटो जरूरी है',
        'समीक्षा के लिए भेजने से पहले कम से कम एक प्रोफाइल फोटो जोड़ें।',
      );
      return;
    }

    try {
      const payload = buildPayload();
      let savedId = profileId;

      if (profileId) {
        const { profileFor: _profileFor, ...body } = payload;
        const result = await updateProfile({ id: profileId, body }).unwrap();
        savedId = result.profile.id;
      } else {
        const result = await createProfile(payload).unwrap();
        savedId = result.profile.id;
      }

      if (submitAfterSave && savedId) {
        await submitProfile(savedId).unwrap();
        Alert.alert('प्रोफाइल भेज दिया', 'आपका प्रोफाइल अब समीक्षा के लिए भेज दिया गया है।', [
          { text: 'ठीक है', onPress: () => router.replace('/my-matrimony') },
        ]);
        return;
      }

      if (!profileId && savedId) {
        Alert.alert('ड्राफ्ट सेव हो गया', 'अब फोटो और कुंडली जोड़ सकते हैं।', [
          {
            text: 'आगे बढ़ें',
            onPress: () => router.replace({ pathname: '/matrimony-form', params: { id: savedId } }),
          },
        ]);
        return;
      }

      if (editingApproved) {
        Alert.alert(
          'बदलाव समीक्षा में भेज दिए',
          'स्वीकृत प्रोफाइल में बदलाव अब दोबारा समीक्षा के बाद सार्वजनिक होंगे।',
          [{ text: 'ठीक है', onPress: () => router.replace('/my-matrimony') }],
        );
        return;
      }

      Alert.alert('ड्राफ्ट अपडेट हो गया', 'आपकी जानकारी सेव हो गई है।');
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'data' in error
          ? String((error as { data?: { message?: string } }).data?.message ?? '')
          : '';
      Alert.alert('सेव नहीं हुआ', message || 'कृपया जानकारी जाँचकर दोबारा कोशिश करें।');
    }
  }

  async function pickAndUploadPhoto() {
    if (!profileId || editingLocked || !accessToken) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const type = asset.mimeType || 'image/jpeg';

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      Alert.alert('फोटो फॉर्मेट', 'कृपया JPG, PNG या WEBP फोटो चुनें।');
      return;
    }

    setUploadingMedia('photo');
    try {
      await uploadMatrimonyMediaFile({
        profileId,
        accessToken,
        kind: 'photo',
        file: {
          uri: asset.uri,
          name: asset.fileName || fileNameFromUri(asset.uri, `profile-${Date.now()}.jpg`),
          type,
        },
      });
      await refetchMine();
      Alert.alert('फोटो जुड़ गई', 'फोटो प्रोफाइल में जोड़ दी गई है।');
    } catch (error) {
      Alert.alert('फोटो अपलोड नहीं हुआ', mediaErrorMessage(error));
    } finally {
      setUploadingMedia(null);
    }
  }

  async function pickAndUploadKundali() {
    if (!profileId || editingLocked || !accessToken) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];

    setUploadingMedia('kundali');
    try {
      await uploadMatrimonyMediaFile({
        profileId,
        accessToken,
        kind: 'kundali',
        file: {
          uri: asset.uri,
          name: asset.name || fileNameFromUri(asset.uri, `kundali-${Date.now()}.pdf`),
          type: asset.mimeType || 'application/pdf',
        },
      });
      await refetchMine();
      Alert.alert('कुंडली जुड़ गई', 'कुंडली प्रोफाइल में जोड़ दी गई है।');
    } catch (error) {
      Alert.alert('कुंडली अपलोड नहीं हुई', mediaErrorMessage(error));
    } finally {
      setUploadingMedia(null);
    }
  }

  function confirmDeletePhoto(photoId: string) {
    if (!profileId || editingLocked) return;
    Alert.alert('फोटो हटाएँ?', 'यह फोटो प्रोफाइल से हट जाएगी।', [
      { text: 'रहने दें', style: 'cancel' },
      {
        text: 'हटाएँ',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePhoto({ profileId, photoId }).unwrap();
            await refetchMine();
          } catch (error) {
            Alert.alert('फोटो नहीं हटी', mediaErrorMessage(error));
          }
        },
      },
    ]);
  }

  async function makePrimary(photoId: string) {
    if (!profileId || editingLocked) return;
    try {
      await setPrimaryPhoto({ profileId, photoId }).unwrap();
      await refetchMine();
    } catch (error) {
      Alert.alert('मुख्य फोटो नहीं बदली', mediaErrorMessage(error));
    }
  }

  function confirmDeleteKundali(kundaliId: string) {
    if (!profileId || editingLocked) return;
    Alert.alert('कुंडली हटाएँ?', 'अपलोड की गई कुंडली प्रोफाइल से हट जाएगी।', [
      { text: 'रहने दें', style: 'cancel' },
      {
        text: 'हटाएँ',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteKundali({ profileId, kundaliId }).unwrap();
            await refetchMine();
          } catch (error) {
            Alert.alert('कुंडली नहीं हटी', mediaErrorMessage(error));
          }
        },
      },
    ]);
  }

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <SymbolView
            name={{ ios: 'person.badge.key.fill', android: 'login', web: 'login' }}
            tintColor={C.maroon}
            size={46}
          />
          <Text style={styles.centerTitle}>पहले लॉगिन करें</Text>
          <Text style={styles.centerText}>
            मैट्रिमोनी ड्राफ्ट निजी डेटा है, इसलिए इसे बनाने या एडिट करने के लिए लॉगिन जरूरी है।
          </Text>
          <Pressable style={styles.centerButton} onPress={() => router.replace('/profile')}>
            <Text style={styles.centerButtonText}>प्रोफाइल / लॉगिन</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (profileId && isLoadingMine && !editingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.centerTitle}>प्रोफाइल लोड हो रहा है...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileId && !isLoadingMine && !editingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>प्रोफाइल नहीं मिला</Text>
          <Text style={styles.centerText}>
            यह प्रोफाइल आपके अकाउंट से जुड़ा नहीं है या उपलब्ध नहीं है।
          </Text>
          <Pressable style={styles.centerButton} onPress={() => router.replace('/my-matrimony')}>
            <Text style={styles.centerButtonText}>मेरे प्रोफाइल पर जाएँ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={C.maroon}
              size={22}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MATRIMONY PROFILE</Text>
            <Text style={styles.title}>
              {profileId ? 'प्रोफाइल एडिट करें' : 'नया प्रोफाइल बनाएँ'}
            </Text>
          </View>
        </View>

        {editingLocked ? (
          <View style={styles.lockBanner}>
            <SymbolView
              name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
              tintColor={C.maroon}
              size={20}
            />
            <Text style={styles.lockText}>
              यह प्रोफाइल अभी एडिट नहीं किया जा सकता क्योंकि इसकी स्थिति {editingProfile?.status}{' '}
              है।
            </Text>
          </View>
        ) : null}

        <View style={styles.progressBanner}>
          <View style={styles.progressIcon}>
            <SymbolView
              name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }}
              tintColor={C.green}
              size={22}
            />
          </View>
          <View style={styles.progressCopy}>
            <Text style={styles.progressTitle}>
              {profileId ? 'जानकारी, फोटो और कुंडली पूरी करें' : 'पहले जरूरी जानकारी भरें'}
            </Text>
            <Text style={styles.progressText}>
              {profileId
                ? 'फोटो जोड़कर तैयार होने पर समीक्षा के लिए भेजें।'
                : 'पहले ड्राफ्ट सेव होगा, फिर इसी फॉर्म में फोटो और कुंडली जोड़ सकेंगे।'}
            </Text>
          </View>
        </View>

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

        <Section
          title="3. समाज, जन्म और स्थान"
          subtitle="शहर के साथ गाँव और कस्बा भी लिख सकते हैं। पूरा पता private रहेगा।"
        >
          <Field
            label="गोत्र"
            value={form.gotra}
            onChangeText={(value) => update('gotra', value)}
          />
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

        <Section
          title="5. फोटो और कुंडली"
          subtitle={
            profileId
              ? 'अधिकतम 6 फोटो जोड़ें। पहली फोटो अपने आप मुख्य फोटो बनती है। कुंडली optional है।'
              : 'इस सेक्शन को खोलने के लिए पहले ड्राफ्ट सेव करें।'
          }
        >
          {!profileId ? (
            <View style={styles.mediaLockedCard}>
              <SymbolView
                name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
                tintColor={C.amber}
                size={20}
              />
              <Text style={styles.mediaLockedText}>
                ड्राफ्ट सेव होते ही profile ID बनेगी, फिर फोटो और कुंडली upload कर पाएँगे।
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.mediaHeaderRow}>
                <Text style={styles.mediaTitle}>
                  प्रोफाइल फोटो ({editingProfile?.photos.length ?? 0}/6)
                </Text>
                {(editingProfile?.photos.length ?? 0) < 6 ? (
                  <Pressable
                    disabled={mediaBusy || editingLocked}
                    style={[
                      styles.mediaAddButton,
                      (mediaBusy || editingLocked) && styles.disabledButton,
                    ]}
                    onPress={pickAndUploadPhoto}
                  >
                    <SymbolView
                      name={{
                        ios: 'photo.badge.plus',
                        android: 'add_photo_alternate',
                        web: 'add_photo_alternate',
                      }}
                      tintColor="#FFFFFF"
                      size={16}
                    />
                    <Text style={styles.mediaAddText}>फोटो जोड़ें</Text>
                  </Pressable>
                ) : null}
              </View>

              {(editingProfile?.photos.length ?? 0) === 0 ? (
                <View style={styles.emptyMedia}>
                  <SymbolView
                    name={{
                      ios: 'photo.on.rectangle.angled',
                      android: 'photo_library',
                      web: 'photo_library',
                    }}
                    tintColor="#B69B8B"
                    size={30}
                  />
                  <Text style={styles.emptyMediaText}>
                    अभी कोई फोटो नहीं है। समीक्षा के लिए कम से कम 1 फोटो जरूरी होगी।
                  </Text>
                </View>
              ) : (
                <View style={styles.photoGrid}>
                  {editingProfile?.photos.map((photo) => (
                    <View key={photo.id} style={styles.photoCard}>
                      <Image
                        source={{ uri: photo.url }}
                        style={styles.photoImage}
                        contentFit="cover"
                      />
                      <View style={styles.photoInfo}>
                        <View style={styles.photoStatusRow}>
                          <Text style={styles.photoStatus}>{mediaStatusLabel[photo.status]}</Text>
                          {photo.isPrimary ? <Text style={styles.primaryPill}>मुख्य</Text> : null}
                        </View>
                        <View style={styles.photoActions}>
                          {!photo.isPrimary ? (
                            <Pressable
                              disabled={mediaBusy || editingLocked}
                              onPress={() => makePrimary(photo.id)}
                            >
                              <Text style={styles.photoActionText}>मुख्य बनाएँ</Text>
                            </Pressable>
                          ) : (
                            <View />
                          )}
                          <Pressable
                            disabled={mediaBusy || editingLocked}
                            onPress={() => confirmDeletePhoto(photo.id)}
                          >
                            <Text style={styles.deleteActionText}>हटाएँ</Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.divider} />
              <View style={styles.mediaHeaderRow}>
                <View style={styles.mediaCopy}>
                  <Text style={styles.mediaTitle}>कुंडली</Text>
                  <Text style={styles.mediaHint}>PDF या image, अधिकतम 10MB</Text>
                </View>
                {(editingProfile?.kundalis.length ?? 0) === 0 ? (
                  <Pressable
                    disabled={mediaBusy || editingLocked}
                    style={[
                      styles.kundaliButton,
                      (mediaBusy || editingLocked) && styles.disabledButton,
                    ]}
                    onPress={pickAndUploadKundali}
                  >
                    <SymbolView
                      name={{ ios: 'doc.badge.plus', android: 'upload_file', web: 'upload_file' }}
                      tintColor={C.maroon}
                      size={16}
                    />
                    <Text style={styles.kundaliButtonText}>कुंडली जोड़ें</Text>
                  </Pressable>
                ) : null}
              </View>

              {editingProfile?.kundalis[0] ? (
                <View style={styles.kundaliCard}>
                  <View style={styles.kundaliIcon}>
                    <SymbolView
                      name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
                      tintColor={C.maroon}
                      size={24}
                    />
                  </View>
                  <View style={styles.kundaliCopy}>
                    <Text style={styles.kundaliName} numberOfLines={1}>
                      {editingProfile.kundalis[0].fileName || 'कुंडली दस्तावेज'}
                    </Text>
                    <Text style={styles.kundaliStatus}>
                      {mediaStatusLabel[editingProfile.kundalis[0].status]}
                    </Text>
                  </View>
                  <Pressable
                    disabled={mediaBusy || editingLocked}
                    onPress={() => confirmDeleteKundali(editingProfile.kundalis[0].id)}
                  >
                    <Text style={styles.deleteActionText}>हटाएँ</Text>
                  </Pressable>
                </View>
              ) : null}

              {mediaBusy ? (
                <View style={styles.mediaProgress}>
                  <ActivityIndicator color={C.maroon} size="small" />
                  <Text style={styles.mediaProgressText}>फाइल प्रोसेस हो रही है...</Text>
                </View>
              ) : null}
            </>
          )}
        </Section>

        <View style={styles.actionsCard}>
          {editingApproved ? (
            <Pressable
              disabled={busy || editingLocked || mediaBusy}
              style={[
                styles.submitButton,
                (busy || editingLocked || mediaBusy) && styles.disabledButton,
              ]}
              onPress={() => save(false)}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <SymbolView
                    name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
                  <Text style={styles.submitButtonText}>बदलाव सेव करके समीक्षा में भेजें</Text>
                </>
              )}
            </Pressable>
          ) : (
            <>
              <Pressable
                disabled={busy || editingLocked}
                style={[styles.draftButton, (busy || editingLocked) && styles.disabledButton]}
                onPress={() => save(false)}
              >
                {busy ? (
                  <ActivityIndicator color={C.maroon} size="small" />
                ) : (
                  <>
                    <SymbolView
                      name={{ ios: 'square.and.arrow.down', android: 'save', web: 'save' }}
                      tintColor={C.maroon}
                      size={17}
                    />
                    <Text style={styles.draftButtonText}>
                      {profileId ? 'ड्राफ्ट अपडेट करें' : 'ड्राफ्ट सेव करके फोटो जोड़ें'}
                    </Text>
                  </>
                )}
              </Pressable>
              {profileId ? (
                <Pressable
                  disabled={busy || editingLocked || mediaBusy}
                  style={[
                    styles.submitButton,
                    (busy || editingLocked || mediaBusy) && styles.disabledButton,
                  ]}
                  onPress={() => save(true)}
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <SymbolView
                        name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                        tintColor="#FFFFFF"
                        size={16}
                      />
                      <Text style={styles.submitButtonText}>सेव करके समीक्षा में भेजें</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
