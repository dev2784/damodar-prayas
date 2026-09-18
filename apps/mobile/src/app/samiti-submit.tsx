import { C, styles } from '@/styles/samiti-submit.styles';
import { useMemo, useState } from 'react';
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
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { uploadContentBanner, type ContentUploadableFile } from '@/services/content-media';
import { useSubmitCommitteeMutation } from '@/services/committee-api';
import { useAppSelector } from '@/store/hooks';

type MemberDraft = {
  key: string;
  name: string;
  designationHi: string;
  phone: string;
  email: string;
};

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed || undefined;
}

function fileNameFromUri(uri: string) {
  const raw = uri.split('/').pop();
  return raw && raw.includes('.') ? raw : `samiti-${Date.now()}.jpg`;
}

function errorMessage(error: unknown) {
  if (typeof error === 'object' && error && 'data' in error) {
    const data = (error as { data?: { message?: string; error?: string } }).data;
    return data?.message || data?.error || 'कृपया जानकारी जाँचकर दोबारा कोशिश करें।';
  }
  return 'कृपया जानकारी जाँचकर दोबारा कोशिश करें।';
}

export default function SamitiSubmitScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [submitCommittee, { isLoading: isSubmitting }] = useSubmitCommitteeMutation();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [details, setDetails] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [banner, setBanner] = useState<ContentUploadableFile | null>(null);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [uploading, setUploading] = useState(false);

  const busy = isSubmitting || uploading;
  const validMemberCount = useMemo(
    () => members.filter((member) => member.name.trim()).length,
    [members],
  );

  async function pickBanner() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: false,
      quality: 0.9,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const type = asset.mimeType || 'image/jpeg';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
      Alert.alert('इमेज फॉर्मेट', 'कृपया JPG, PNG या WEBP banner चुनें।');
      return;
    }

    setBanner({
      uri: asset.uri,
      name: asset.fileName || fileNameFromUri(asset.uri),
      type,
    });
  }

  function addMember() {
    setMembers((current) => [
      ...current,
      { key: `${Date.now()}-${Math.random()}`, name: '', designationHi: '', phone: '', email: '' },
    ]);
  }

  function updateMember(key: string, field: keyof Omit<MemberDraft, 'key'>, value: string) {
    setMembers((current) =>
      current.map((member) => (member.key === key ? { ...member, [field]: value } : member)),
    );
  }

  function removeMember(key: string) {
    setMembers((current) => current.filter((member) => member.key !== key));
  }

  async function submit() {
    if (!accessToken) {
      Alert.alert('लॉगिन जरूरी है', 'समिति जोड़ने के लिए पहले लॉगिन करें।');
      router.push('/auth');
      return;
    }

    if (!name.trim() || !city.trim() || !state.trim() || !banner) {
      Alert.alert('जरूरी जानकारी बाकी है', 'समिति का नाम, शहर, राज्य और main banner जरूरी हैं।');
      return;
    }

    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('Email जाँचें', 'कृपया सही email भरें।');
      return;
    }

    const invalidMember = members.find(
      (member) =>
        !member.name.trim() &&
        (member.designationHi.trim() || member.phone.trim() || member.email.trim()),
    );
    if (invalidMember) {
      Alert.alert('पदाधिकारी का नाम', 'जिस पदाधिकारी की जानकारी भर रहे हैं उसका नाम भी भरें।');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadContentBanner({ file: banner, accessToken });
      setUploading(false);

      await submitCommittee({
        bannerUrl: result.media.url,
        bannerStorageKey: result.media.storageKey,
        city: city.trim(),
        state: state.trim(),
        district: optional(district),
        address: optional(address),
        phone: optional(phone),
        email: optional(email),
        translations: [
          {
            language: 'HI',
            name: name.trim(),
            details: optional(details),
          },
        ],
        members: members
          .filter((member) => member.name.trim())
          .map((member, index) => ({
            name: member.name.trim(),
            designationHi: optional(member.designationHi),
            phone: optional(member.phone),
            email: optional(member.email),
            sortOrder: index,
            isActive: true,
          })),
      }).unwrap();

      Alert.alert(
        'समिति समीक्षा में भेज दी गई',
        'यह अभी सार्वजनिक नहीं होगी। Admin approval के बाद ही समिति सूची में दिखाई देगी।',
        [{ text: 'ठीक है', onPress: () => router.replace('/samiti') }],
      );
    } catch (error) {
      setUploading(false);
      Alert.alert('समिति सबमिट नहीं हुई', errorMessage(error));
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
            <Text style={styles.eyebrow}>समाज संगठन</Text>
            <Text style={styles.title}>नई समिति जोड़ें</Text>
          </View>
        </View>

        <View style={styles.approvalNote}>
          <SymbolView
            name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
            tintColor={C.green}
            size={22}
          />
          <Text style={styles.approvalText}>
            समिति जोड़ने के बाद approval में जाएगी। स्वीकृति से पहले किसी public list में नहीं
            दिखेगी।
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>मुख्य जानकारी</Text>
          <Text style={styles.label}>समिति का नाम *</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder="जैसे श्री दर्जी समाज समिति"
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>Main banner *</Text>
          <Pressable style={styles.imagePicker} onPress={() => void pickBanner()}>
            {banner ? (
              <Image source={{ uri: banner.uri }} style={styles.preview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <SymbolView
                  name={{ ios: 'photo.fill', android: 'image', web: 'image' }}
                  tintColor={C.gold}
                  size={36}
                />
                <Text style={styles.imageText}>Banner image चुनें</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.twoCol}>
            <View style={styles.flexField}>
              <Text style={styles.label}>शहर *</Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#A49890"
              />
            </View>
            <View style={styles.flexField}>
              <Text style={styles.label}>राज्य *</Text>
              <TextInput
                value={state}
                onChangeText={setState}
                style={styles.input}
                placeholder="State"
                placeholderTextColor="#A49890"
              />
            </View>
          </View>

          <Text style={styles.label}>जिला</Text>
          <TextInput
            value={district}
            onChangeText={setDistrict}
            style={styles.input}
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>समिति के बारे में</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            style={[styles.input, styles.multiline]}
            multiline
            textAlignVertical="top"
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>पता</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            style={[styles.input, styles.multilineSmall]}
            multiline
            textAlignVertical="top"
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
          />

          <Text style={styles.label}>फोन</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder="वैकल्पिक"
            placeholderTextColor="#A49890"
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.card}>
          <View style={styles.memberHeader}>
            <View style={styles.memberHeaderCopy}>
              <Text style={styles.sectionTitle}>पदाधिकारी</Text>
              <Text style={styles.optionalHint}>
                पूरी तरह optional है। चाहें तो बाद में भी जोड़ा जा सकता है।
              </Text>
            </View>
            <Pressable style={styles.addMemberButton} onPress={addMember}>
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                tintColor="#FFFFFF"
                size={15}
              />
              <Text style={styles.addMemberText}>जोड़ें</Text>
            </Pressable>
          </View>

          {members.length === 0 ? (
            <View style={styles.noMembers}>
              <Text style={styles.noMembersText}>
                अभी कोई पदाधिकारी नहीं जोड़ा गया। समिति फिर भी submit की जा सकती है।
              </Text>
            </View>
          ) : null}

          {members.map((member, index) => (
            <View key={member.key} style={styles.memberCard}>
              <View style={styles.memberTitleRow}>
                <Text style={styles.memberTitle}>पदाधिकारी {index + 1}</Text>
                <Pressable onPress={() => removeMember(member.key)}>
                  <SymbolView
                    name={{ ios: 'trash.fill', android: 'delete', web: 'delete' }}
                    tintColor={C.red}
                    size={18}
                  />
                </Pressable>
              </View>
              <TextInput
                value={member.name}
                onChangeText={(value) => updateMember(member.key, 'name', value)}
                style={styles.input}
                placeholder="नाम"
                placeholderTextColor="#A49890"
              />
              <TextInput
                value={member.designationHi}
                onChangeText={(value) => updateMember(member.key, 'designationHi', value)}
                style={styles.input}
                placeholder="पद, जैसे अध्यक्ष"
                placeholderTextColor="#A49890"
              />
              <TextInput
                value={member.phone}
                onChangeText={(value) => updateMember(member.key, 'phone', value)}
                style={styles.input}
                placeholder="फोन, optional"
                placeholderTextColor="#A49890"
                keyboardType="phone-pad"
              />
              <TextInput
                value={member.email}
                onChangeText={(value) => updateMember(member.key, 'email', value)}
                style={styles.input}
                placeholder="Email, optional"
                placeholderTextColor="#A49890"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          ))}

          {validMemberCount > 0 ? (
            <Text style={styles.memberCount}>{validMemberCount} पदाधिकारी शामिल होंगे</Text>
          ) : null}
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
