import { useState } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  uploadMatrimonyMediaFile,
  useDeleteMatrimonyKundaliMutation,
  useDeleteMatrimonyPhotoMutation,
  useSetPrimaryMatrimonyPhotoMutation,
} from '@/services/matrimony-media-api';
import { fileNameFromUri, mediaErrorMessage } from './media-errors';

export function useMatrimonyMedia({
  profileId,
  accessToken,
  editingLocked,
  refetchMine,
}: {
  profileId?: string;
  accessToken: string | null;
  editingLocked: boolean;
  refetchMine: () => unknown;
}) {
  const [uploadingMedia, setUploadingMedia] = useState<'photo' | 'kundali' | null>(null);
  const [deletePhoto, { isLoading: isDeletingPhoto }] = useDeleteMatrimonyPhotoMutation();
  const [setPrimaryPhoto, { isLoading: isSettingPrimary }] = useSetPrimaryMatrimonyPhotoMutation();
  const [deleteKundali, { isLoading: isDeletingKundali }] = useDeleteMatrimonyKundaliMutation();

  const mediaBusy =
    uploadingMedia !== null || isDeletingPhoto || isSettingPrimary || isDeletingKundali;
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

  return {
    mediaBusy,
    pickAndUploadPhoto,
    pickAndUploadKundali,
    confirmDeletePhoto,
    makePrimary,
    confirmDeleteKundali,
  };
}
