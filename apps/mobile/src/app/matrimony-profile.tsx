import { calculateAge, heightLabel } from '@/lib/profile-format';
import { C, styles } from '@/styles/matrimony-profile.styles';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type MatrimonyProfile,
  useGetMatrimonyProfileQuery,
  useGetMyMatrimonyProfilesQuery,
} from '@/services/matrimony-api';
import {
  useAddShortlistMutation,
  useGetIncomingInterestsQuery,
  useGetOutgoingInterestsQuery,
  useGetProfileContactQuery,
  useGetShortlistsQuery,
  useRemoveShortlistMutation,
  useSendInterestMutation,
} from '@/services/interaction-api';
import { useAppSelector } from '@/store/hooks';

function fullName(profile: MatrimonyProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}

function categoryLabel(value: MatrimonyProfile['category']) {
  if (value === 'JUNA_GUJARATI') return 'जूना गुजराती';
  if (value === 'PIPA') return 'पीपा';
  return 'नामदेव';
}

function maritalStatusLabel(value: MatrimonyProfile['maritalStatus']) {
  const labels = {
    NEVER_MARRIED: 'अविवाहित',
    DIVORCED: 'तलाकशुदा',
    WIDOWED: 'विधवा / विधुर',
    SEPARATED: 'अलग रह रहे',
  } as const;
  return labels[value];
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function MatrimonyProfileScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const { data, isLoading, isError, refetch } = useGetMatrimonyProfileQuery(id, { skip: !id });
  const profile = data?.profile;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={C.maroon}
            size={22}
          />
        </Pressable>
        <Text style={styles.topTitle}>प्रोफाइल विवरण</Text>
        <View style={styles.topSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.stateTitle}>प्रोफाइल लोड हो रहा है...</Text>
        </View>
      ) : isError || !profile ? (
        <View style={styles.centerState}>
          <SymbolView
            name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
            tintColor={C.maroon}
            size={44}
          />
          <Text style={styles.stateTitle}>प्रोफाइल उपलब्ध नहीं है</Text>
          <Text style={styles.stateText}>
            यह प्रोफाइल हटाया गया हो सकता है या API से लोड नहीं हो पाया।
          </Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>फिर से कोशिश करें</Text>
          </Pressable>
        </View>
      ) : (
        <ProfileDetails profile={profile} />
      )}
    </SafeAreaView>
  );
}

function ProfileDetails({ profile }: { profile: MatrimonyProfile }) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [senderModalOpen, setSenderModalOpen] = useState(false);
  const { data: mineData } = useGetMyMatrimonyProfilesQuery(undefined, { skip: !accessToken });
  const { data: shortlistData } = useGetShortlistsQuery(undefined, { skip: !accessToken });
  const { data: outgoingData } = useGetOutgoingInterestsQuery(undefined, { skip: !accessToken });
  const { data: incomingData } = useGetIncomingInterestsQuery(undefined, { skip: !accessToken });
  const [addShortlist, { isLoading: addingShortlist }] = useAddShortlistMutation();
  const [removeShortlist, { isLoading: removingShortlist }] = useRemoveShortlistMutation();
  const [sendInterest, { isLoading: sendingInterest }] = useSendInterestMutation();
  const approvedOwnProfiles = mineData?.items.filter((item) => item.status === 'APPROVED') ?? [];
  const isOwnProfile = mineData?.items.some((item) => item.id === profile.id) ?? false;
  const shortlisted =
    shortlistData?.items.some((item) => item.matrimonyProfileId === profile.id) ?? false;
  const outgoingInterest = outgoingData?.items.find(
    (item) => item.receiverProfileId === profile.id,
  );
  const incomingInterest = incomingData?.items.find((item) => item.senderProfileId === profile.id);
  const relationshipInterest = outgoingInterest ?? incomingInterest;
  const acceptedInterest =
    relationshipInterest?.status === 'ACCEPTED' ? relationshipInterest : undefined;
  const contactOwnerProfileId = acceptedInterest
    ? acceptedInterest.senderProfileId === profile.id
      ? acceptedInterest.receiverProfileId
      : acceptedInterest.senderProfileId
    : '';
  const {
    data: contactData,
    isFetching: contactLoading,
    isError: contactError,
  } = useGetProfileContactQuery(
    { profileId: profile.id, ownerProfileId: contactOwnerProfileId },
    { skip: !accessToken || !acceptedInterest || !contactOwnerProfileId },
  );

  async function toggleShortlist() {
    if (!accessToken) {
      router.push('/profile');
      return;
    }
    try {
      if (shortlisted) await removeShortlist(profile.id).unwrap();
      else await addShortlist(profile.id).unwrap();
    } catch {
      Alert.alert('Shortlist अपडेट नहीं हुई', 'कृपया दोबारा कोशिश करें।');
    }
  }

  async function submitInterest(senderProfileId: string) {
    try {
      await sendInterest({ senderProfileId, receiverProfileId: profile.id }).unwrap();
      setSenderModalOpen(false);
      Alert.alert('रुचि भेज दी गई', 'सामने वाले सदस्य को आपका interest request मिल गया है।');
    } catch (error) {
      const code =
        typeof error === 'object' && error && 'data' in error
          ? String((error as { data?: { error?: string } }).data?.error ?? '')
          : '';
      Alert.alert(
        'रुचि नहीं भेजी गई',
        code === 'INTEREST_ALREADY_EXISTS'
          ? 'इस प्रोफाइल को interest पहले ही भेजा जा चुका है।'
          : 'कृपया दोबारा कोशिश करें।',
      );
    }
  }

  function startInterest() {
    if (!accessToken) {
      router.push('/profile');
      return;
    }
    if (isOwnProfile) return;
    if (relationshipInterest) {
      Alert.alert(
        'Interest status',
        relationshipInterest.status === 'PENDING'
          ? 'यह interest अभी pending है।'
          : relationshipInterest.status === 'ACCEPTED'
            ? 'रुचि स्वीकार हो चुकी है। संपर्क विवरण नीचे उपलब्ध है।'
            : 'यह interest पहले ही respond हो चुका है।',
      );
      return;
    }
    if (approvedOwnProfiles.length === 0) {
      Alert.alert(
        'Approved profile जरूरी है',
        'रुचि भेजने के लिए आपकी कम से कम एक approved matrimony profile होनी चाहिए।',
      );
      return;
    }
    if (approvedOwnProfiles.length === 1) {
      void submitInterest(approvedOwnProfiles[0].id);
      return;
    }
    setSenderModalOpen(true);
  }

  const photo = profile.photos[0]?.url;
  const age = calculateAge(profile.dateOfBirth);
  const location = [profile.currentCity, profile.district, profile.state]
    .filter(Boolean)
    .join(', ');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        {photo ? (
          <Image
            source={{ uri: photo }}
            style={styles.heroPhoto}
            contentFit="cover"
            transition={180}
          />
        ) : (
          <View style={styles.heroPlaceholder}>
            <SymbolView
              name={{
                ios: 'person.crop.circle.fill',
                android: 'account_circle',
                web: 'account_circle',
              }}
              tintColor="#C9B0A2"
              size={110}
            />
          </View>
        )}

        <View style={styles.heroBody}>
          <View style={styles.badgesRow}>
            <View style={styles.verifiedBadge}>
              <SymbolView
                name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                tintColor={C.green}
                size={14}
              />
              <Text style={styles.verifiedText}>सत्यापित प्रोफाइल</Text>
            </View>
            {profile.isFeatured ? <Text style={styles.featuredBadge}>Featured</Text> : null}
          </View>

          <Text style={styles.name}>
            {fullName(profile)}, {age}
          </Text>
          <Text style={styles.location}>{location || profile.country}</Text>
          <Text style={styles.headline}>
            {profile.occupation || profile.education || 'दर्जी समाज मैट्रिमोनी प्रोफाइल'}
          </Text>
        </View>
      </View>

      {isOwnProfile ? (
        <View style={styles.ownProfileNote}>
          <Text style={styles.ownProfileText}>यह आपकी अपनी प्रोफाइल है।</Text>
        </View>
      ) : (
        <View style={styles.actionsCard}>
          <Pressable
            disabled={sendingInterest}
            style={[styles.primaryAction, sendingInterest && styles.disabledAction]}
            onPress={startInterest}
          >
            {sendingInterest ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <SymbolView
                name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
                tintColor="#FFFFFF"
                size={18}
              />
            )}
            <Text style={styles.primaryActionText}>
              {relationshipInterest
                ? relationshipInterest.status === 'PENDING'
                  ? 'रुचि Pending'
                  : relationshipInterest.status === 'ACCEPTED'
                    ? 'रुचि Accepted'
                    : 'रुचि भेजी गई'
                : 'रुचि भेजें'}
            </Text>
          </Pressable>
          <Pressable
            disabled={addingShortlist || removingShortlist}
            style={styles.secondaryAction}
            onPress={() => void toggleShortlist()}
          >
            <SymbolView
              name={{
                ios: shortlisted ? 'bookmark.fill' : 'bookmark',
                android: shortlisted ? 'bookmark' : 'bookmark_border',
                web: shortlisted ? 'bookmark' : 'bookmark_border',
              }}
              tintColor={C.maroon}
              size={18}
            />
            <Text style={styles.secondaryActionText}>
              {shortlisted ? 'Shortlisted' : 'Shortlist'}
            </Text>
          </Pressable>
        </View>
      )}

      {acceptedInterest ? (
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <SymbolView
              name={{ ios: 'phone.circle.fill', android: 'contact_phone', web: 'contact_phone' }}
              tintColor={C.green}
              size={22}
            />
            <View style={styles.flexFill}>
              <Text style={styles.contactTitle}>संपर्क विवरण उपलब्ध</Text>
              <Text style={styles.contactHint}>
                रुचि स्वीकार होने के बाद यह जानकारी दोनों पक्षों को दिखाई देती है।
              </Text>
            </View>
          </View>
          {contactLoading ? (
            <ActivityIndicator color={C.green} size="small" />
          ) : contactError ? (
            <Text style={styles.contactEmpty}>
              संपर्क विवरण लोड नहीं हो पाया। कृपया प्रोफाइल दोबारा खोलें।
            </Text>
          ) : (
            <View style={styles.contactDetails}>
              {contactData?.contactPhone ? (
                <Text style={styles.contactValue}>📞 {contactData.contactPhone}</Text>
              ) : null}
              {contactData?.contactEmail ? (
                <Text style={styles.contactValue}>✉️ {contactData.contactEmail}</Text>
              ) : null}
              {!contactData?.contactPhone && !contactData?.contactEmail ? (
                <Text style={styles.contactEmpty}>
                  इस प्रोफाइल ने अभी संपर्क जानकारी नहीं जोड़ी है।
                </Text>
              ) : null}
            </View>
          )}
        </View>
      ) : null}

      <Modal
        visible={senderModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSenderModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.senderModal}>
            <Text style={styles.senderModalTitle}>किस प्रोफाइल से रुचि भेजें?</Text>
            <Text style={styles.senderModalText}>
              आपके account में एक से ज्यादा approved profiles हैं।
            </Text>
            {approvedOwnProfiles.map((item) => (
              <Pressable
                key={item.id}
                style={styles.senderOption}
                onPress={() => void submitInterest(item.id)}
              >
                <Text style={styles.senderOptionName}>
                  {[item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ')}
                </Text>
                <Text style={styles.senderOptionMeta}>{item.profileFor}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.modalCancel} onPress={() => setSenderModalOpen(false)}>
              <Text style={styles.modalCancelText}>रद्द करें</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Section title="व्यक्तिगत जानकारी">
        <InfoRow label="समाज" value={categoryLabel(profile.category)} />
        <InfoRow label="वैवाहिक स्थिति" value={maritalStatusLabel(profile.maritalStatus)} />
        <InfoRow label="ऊंचाई" value={heightLabel(profile.heightCm)} />
        <InfoRow label="गोत्र" value={profile.gotra} />
        <InfoRow
          label="मांगलिक"
          value={profile.manglik === null ? null : profile.manglik ? 'हाँ' : 'नहीं'}
        />
        <InfoRow label="मूल स्थान" value={profile.nativePlace} />
      </Section>

      <Section title="शिक्षा और व्यवसाय">
        <InfoRow label="शिक्षा" value={profile.education} />
        <InfoRow label="व्यवसाय" value={profile.occupation} />
        <InfoRow label="कंपनी / व्यापार" value={profile.companyOrBusiness} />
        <InfoRow
          label="वार्षिक आय"
          value={profile.annualIncome ? `₹${profile.annualIncome.toLocaleString('en-IN')}` : null}
        />
      </Section>

      <Section title="स्थान और जन्म विवरण">
        <InfoRow label="वर्तमान शहर" value={profile.currentCity} />
        <InfoRow label="जिला" value={profile.district} />
        <InfoRow label="राज्य" value={profile.state} />
        <InfoRow label="जन्म स्थान" value={profile.birthPlace} />
      </Section>

      <Section title="परिवार">
        <InfoRow label="भाई" value={profile.brothers} />
        <InfoRow label="बहनें" value={profile.sisters} />
      </Section>

      {profile.about ? (
        <Section title="मेरे बारे में">
          <Text style={styles.aboutText}>{profile.about}</Text>
        </Section>
      ) : null}

      {!acceptedInterest ? (
        <View style={styles.privacyNote}>
          <SymbolView
            name={{ ios: 'lock.shield.fill', android: 'privacy_tip', web: 'privacy_tip' }}
            tintColor={C.green}
            size={20}
          />
          <Text style={styles.privacyText}>
            संपर्क जानकारी निजी रहती है। रुचि स्वीकार होने के बाद ही दिखाई जाएगी।
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}
