import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useCreateMatrimonyProfileMutation,
  useGetMyMatrimonyProfilesQuery,
  useSubmitMatrimonyProfileMutation,
  useUpdateMatrimonyProfileMutation,
} from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';
import {
  buildPayload,
  initialForm,
  profileToForm,
  validateForm,
  type FormState,
} from './form-model';
import { useMatrimonyMedia } from './use-matrimony-media';

export function useMatrimonyForm() {
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
  const editingApproved = editingProfile?.status === 'APPROVED';
  const editingLocked = Boolean(
    editingProfile && !['DRAFT', 'REJECTED', 'APPROVED'].includes(editingProfile.status),
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
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

    const validationError = validateForm(form);
    if (validationError) {
      Alert.alert(validationError.title, validationError.message);
      return;
    }

    if (submitAfterSave && editingProfile && editingProfile.photos.length === 0) {
      Alert.alert(
        'फोटो जरूरी है',
        'समीक्षा के लिए भेजने से पहले कम से कम एक प्रोफाइल फोटो जोड़ें।',
      );
      return;
    }

    try {
      const payload = buildPayload(form);
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

  const media = useMatrimonyMedia({ profileId, accessToken, editingLocked, refetchMine });
  return {
    profileId,
    accessToken,
    form,
    update,
    editingProfile,
    isLoadingMine,
    busy,
    editingApproved,
    editingLocked,
    save,
    ...media,
  };
}
