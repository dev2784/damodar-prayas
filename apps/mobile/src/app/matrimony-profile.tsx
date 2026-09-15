import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type MatrimonyProfile, useGetMatrimonyProfileQuery, useGetMyMatrimonyProfilesQuery } from '@/services/matrimony-api';
import { useAddShortlistMutation, useGetIncomingInterestsQuery, useGetOutgoingInterestsQuery, useGetProfileContactQuery, useGetShortlistsQuery, useRemoveShortlistMutation, useSendInterestMutation } from '@/services/interaction-api';
import { useAppSelector } from '@/store/hooks';

const C = {
  bg: '#FFF9F1',
  paper: '#FFFFFF',
  maroon: '#A30D1E',
  maroonDark: '#7D0A16',
  gold: '#D99A2B',
  text: '#231C19',
  muted: '#746965',
  line: '#E9DCCF',
  green: '#0BAA67',
};

function calculateAge(dateOfBirth: string) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

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

function heightLabel(heightCm: number | null) {
  if (!heightCm) return null;
  const totalInches = heightCm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}' ${inches}" (${heightCm} cm)`;
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
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} />
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
          <SymbolView name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }} tintColor={C.maroon} size={44} />
          <Text style={styles.stateTitle}>प्रोफाइल उपलब्ध नहीं है</Text>
          <Text style={styles.stateText}>यह प्रोफाइल हटाया गया हो सकता है या API से लोड नहीं हो पाया।</Text>
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
  const shortlisted = shortlistData?.items.some((item) => item.matrimonyProfileId === profile.id) ?? false;
  const outgoingInterest = outgoingData?.items.find((item) => item.receiverProfileId === profile.id);
  const incomingInterest = incomingData?.items.find((item) => item.senderProfileId === profile.id);
  const relationshipInterest = outgoingInterest ?? incomingInterest;
  const acceptedInterest = relationshipInterest?.status === 'ACCEPTED' ? relationshipInterest : undefined;
  const contactOwnerProfileId = acceptedInterest
    ? acceptedInterest.senderProfileId === profile.id
      ? acceptedInterest.receiverProfileId
      : acceptedInterest.senderProfileId
    : '';
  const { data: contactData, isFetching: contactLoading, isError: contactError } = useGetProfileContactQuery(
    { profileId: profile.id, ownerProfileId: contactOwnerProfileId },
    { skip: !accessToken || !acceptedInterest || !contactOwnerProfileId },
  );

  async function toggleShortlist() {
    if (!accessToken) { router.push('/profile'); return; }
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
      const code = typeof error === 'object' && error && 'data' in error
        ? String((error as { data?: { error?: string } }).data?.error ?? '')
        : '';
      Alert.alert('रुचि नहीं भेजी गई', code === 'INTEREST_ALREADY_EXISTS' ? 'इस प्रोफाइल को interest पहले ही भेजा जा चुका है।' : 'कृपया दोबारा कोशिश करें।');
    }
  }

  function startInterest() {
    if (!accessToken) { router.push('/profile'); return; }
    if (isOwnProfile) return;
    if (relationshipInterest) {
      Alert.alert('Interest status', relationshipInterest.status === 'PENDING' ? 'यह interest अभी pending है।' : relationshipInterest.status === 'ACCEPTED' ? 'रुचि स्वीकार हो चुकी है। संपर्क विवरण नीचे उपलब्ध है।' : 'यह interest पहले ही respond हो चुका है।');
      return;
    }
    if (approvedOwnProfiles.length === 0) {
      Alert.alert('Approved profile जरूरी है', 'रुचि भेजने के लिए आपकी कम से कम एक approved matrimony profile होनी चाहिए।');
      return;
    }
    if (approvedOwnProfiles.length === 1) { void submitInterest(approvedOwnProfiles[0].id); return; }
    setSenderModalOpen(true);
  }

  const photo = profile.photos[0]?.url;
  const age = calculateAge(profile.dateOfBirth);
  const location = [profile.currentCity, profile.district, profile.state].filter(Boolean).join(', ');

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.heroPhoto} contentFit="cover" transition={180} />
        ) : (
          <View style={styles.heroPlaceholder}>
            <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} tintColor="#C9B0A2" size={110} />
          </View>
        )}

        <View style={styles.heroBody}>
          <View style={styles.badgesRow}>
            <View style={styles.verifiedBadge}>
              <SymbolView name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} tintColor={C.green} size={14} />
              <Text style={styles.verifiedText}>सत्यापित प्रोफाइल</Text>
            </View>
            {profile.isFeatured ? <Text style={styles.featuredBadge}>Featured</Text> : null}
          </View>

          <Text style={styles.name}>{fullName(profile)}, {age}</Text>
          <Text style={styles.location}>{location || profile.country}</Text>
          <Text style={styles.headline}>{profile.occupation || profile.education || 'दर्जी समाज मैट्रिमोनी प्रोफाइल'}</Text>
        </View>
      </View>

      {isOwnProfile ? (
        <View style={styles.ownProfileNote}><Text style={styles.ownProfileText}>यह आपकी अपनी प्रोफाइल है।</Text></View>
      ) : (
        <View style={styles.actionsCard}>
          <Pressable disabled={sendingInterest} style={[styles.primaryAction, sendingInterest && styles.disabledAction]} onPress={startInterest}>
            {sendingInterest ? <ActivityIndicator color="#FFFFFF" size="small" /> : <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} tintColor="#FFFFFF" size={18} />}
            <Text style={styles.primaryActionText}>{relationshipInterest ? (relationshipInterest.status === 'PENDING' ? 'रुचि Pending' : relationshipInterest.status === 'ACCEPTED' ? 'रुचि Accepted' : 'रुचि भेजी गई') : 'रुचि भेजें'}</Text>
          </Pressable>
          <Pressable disabled={addingShortlist || removingShortlist} style={styles.secondaryAction} onPress={() => void toggleShortlist()}>
            <SymbolView name={{ ios: shortlisted ? 'bookmark.fill' : 'bookmark', android: shortlisted ? 'bookmark' : 'bookmark_border', web: shortlisted ? 'bookmark' : 'bookmark_border' }} tintColor={C.maroon} size={18} />
            <Text style={styles.secondaryActionText}>{shortlisted ? 'Shortlisted' : 'Shortlist'}</Text>
          </Pressable>
        </View>
      )}

      {acceptedInterest ? (
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <SymbolView name={{ ios: 'phone.circle.fill', android: 'contact_phone', web: 'contact_phone' }} tintColor={C.green} size={22} />
            <View style={{ flex: 1 }}>
              <Text style={styles.contactTitle}>संपर्क विवरण उपलब्ध</Text>
              <Text style={styles.contactHint}>रुचि स्वीकार होने के बाद यह जानकारी दोनों पक्षों को दिखाई देती है।</Text>
            </View>
          </View>
          {contactLoading ? <ActivityIndicator color={C.green} size="small" /> : contactError ? (
            <Text style={styles.contactEmpty}>संपर्क विवरण लोड नहीं हो पाया। कृपया प्रोफाइल दोबारा खोलें।</Text>
          ) : (
            <View style={styles.contactDetails}>
              {contactData?.contactPhone ? <Text style={styles.contactValue}>📞 {contactData.contactPhone}</Text> : null}
              {contactData?.contactEmail ? <Text style={styles.contactValue}>✉️ {contactData.contactEmail}</Text> : null}
              {!contactData?.contactPhone && !contactData?.contactEmail ? <Text style={styles.contactEmpty}>इस प्रोफाइल ने अभी संपर्क जानकारी नहीं जोड़ी है।</Text> : null}
            </View>
          )}
        </View>
      ) : null}

      <Modal visible={senderModalOpen} transparent animationType="fade" onRequestClose={() => setSenderModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.senderModal}>
            <Text style={styles.senderModalTitle}>किस प्रोफाइल से रुचि भेजें?</Text>
            <Text style={styles.senderModalText}>आपके account में एक से ज्यादा approved profiles हैं।</Text>
            {approvedOwnProfiles.map((item) => <Pressable key={item.id} style={styles.senderOption} onPress={() => void submitInterest(item.id)}><Text style={styles.senderOptionName}>{[item.firstName, item.middleName, item.lastName].filter(Boolean).join(' ')}</Text><Text style={styles.senderOptionMeta}>{item.profileFor}</Text></Pressable>)}
            <Pressable style={styles.modalCancel} onPress={() => setSenderModalOpen(false)}><Text style={styles.modalCancelText}>रद्द करें</Text></Pressable>
          </View>
        </View>
      </Modal>

      <Section title="व्यक्तिगत जानकारी">
        <InfoRow label="समाज" value={categoryLabel(profile.category)} />
        <InfoRow label="वैवाहिक स्थिति" value={maritalStatusLabel(profile.maritalStatus)} />
        <InfoRow label="ऊंचाई" value={heightLabel(profile.heightCm)} />
        <InfoRow label="गोत्र" value={profile.gotra} />
        <InfoRow label="मांगलिक" value={profile.manglik === null ? null : profile.manglik ? 'हाँ' : 'नहीं'} />
        <InfoRow label="मूल स्थान" value={profile.nativePlace} />
      </Section>

      <Section title="शिक्षा और व्यवसाय">
        <InfoRow label="शिक्षा" value={profile.education} />
        <InfoRow label="व्यवसाय" value={profile.occupation} />
        <InfoRow label="कंपनी / व्यापार" value={profile.companyOrBusiness} />
        <InfoRow label="वार्षिक आय" value={profile.annualIncome ? `₹${profile.annualIncome.toLocaleString('en-IN')}` : null} />
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
          <SymbolView name={{ ios: 'lock.shield.fill', android: 'privacy_tip', web: 'privacy_tip' }} tintColor={C.green} size={20} />
          <Text style={styles.privacyText}>संपर्क जानकारी निजी रहती है। रुचि स्वीकार होने के बाद ही दिखाई जाएगी।</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  topBar: { height: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFDF9', borderBottomWidth: 1, borderBottomColor: C.line },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: C.maroonDark, fontSize: 17, fontWeight: '900' },
  topSpacer: { width: 38 },
  content: { padding: 14, paddingBottom: 110 },

  heroCard: { borderRadius: 18, overflow: 'hidden', backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, elevation: 2 },
  heroPhoto: { width: '100%', aspectRatio: 1.04, backgroundColor: '#EADDD2' },
  heroPlaceholder: { width: '100%', aspectRatio: 1.04, backgroundColor: '#F3E8DF', alignItems: 'center', justifyContent: 'center' },
  heroBody: { padding: 14 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 7, backgroundColor: '#ECFFF5', paddingHorizontal: 7, paddingVertical: 4 },
  verifiedText: { color: C.green, fontSize: 8.5, fontWeight: '900' },
  featuredBadge: { color: '#FFFFFF', backgroundColor: C.gold, borderRadius: 7, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 4, fontSize: 8, fontWeight: '900' },
  name: { color: C.text, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  location: { color: C.muted, fontSize: 11, marginTop: 4 },
  headline: { color: C.maroon, fontSize: 11, fontWeight: '800', marginTop: 5 },

  contactCard: { marginTop: 12, padding: 14, borderRadius: 16, backgroundColor: '#F1FAF5', borderWidth: 1, borderColor: '#CDE9D9', gap: 10 },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  contactTitle: { color: '#155C43', fontSize: 13, fontWeight: '900' },
  contactHint: { color: '#4D7464', fontSize: 9.5, lineHeight: 14, marginTop: 2 },
  contactDetails: { gap: 7, paddingTop: 2 },
  contactValue: { color: C.text, fontSize: 12, fontWeight: '800' },
  contactEmpty: { color: C.muted, fontSize: 10.5 },
  actionsCard: { flexDirection: 'row', gap: 9, marginTop: 11 },
  disabledAction: { opacity: 0.65 },
  ownProfileNote: { marginTop: 11, borderRadius: 12, backgroundColor: '#F4ECE6', padding: 12, alignItems: 'center' },
  ownProfileText: { color: C.muted, fontSize: 10.5, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(35,28,25,0.45)', justifyContent: 'center', padding: 22 },
  senderModal: { borderRadius: 18, backgroundColor: C.paper, padding: 16 },
  senderModalTitle: { color: C.text, fontSize: 17, fontWeight: '900' },
  senderModalText: { color: C.muted, fontSize: 10, marginTop: 4, marginBottom: 10 },
  senderOption: { borderWidth: 1, borderColor: C.line, borderRadius: 11, padding: 11, marginTop: 7 },
  senderOptionName: { color: C.text, fontSize: 12, fontWeight: '900' },
  senderOptionMeta: { color: C.muted, fontSize: 9, marginTop: 2 },
  modalCancel: { alignItems: 'center', paddingVertical: 11, marginTop: 8 },
  modalCancelText: { color: C.maroon, fontSize: 11, fontWeight: '900' },
  primaryAction: { flex: 1, minHeight: 48, borderRadius: 13, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  secondaryAction: { flex: 1, minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#E5BFC1', backgroundColor: '#FFF6F5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  secondaryActionText: { color: C.maroon, fontSize: 11, fontWeight: '900' },

  section: { marginTop: 12, borderRadius: 15, overflow: 'hidden', borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  sectionTitle: { color: C.maroonDark, fontSize: 13, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FFF4EC', borderBottomWidth: 1, borderBottomColor: '#F0E2D7' },
  sectionBody: { paddingHorizontal: 12, paddingVertical: 5 },
  infoRow: { minHeight: 41, paddingVertical: 8, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#EDE5DE' },
  infoLabel: { width: 112, color: C.muted, fontSize: 10.5, fontWeight: '700' },
  infoValue: { flex: 1, color: C.text, fontSize: 10.5, fontWeight: '800', textAlign: 'right' },
  aboutText: { color: C.text, fontSize: 11, lineHeight: 19, paddingVertical: 8 },

  privacyNote: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, backgroundColor: '#EFFAF4', padding: 12 },
  privacyText: { flex: 1, color: '#49635A', fontSize: 9.5, lineHeight: 15 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stateTitle: { color: C.text, fontSize: 16, fontWeight: '900', marginTop: 12, textAlign: 'center' },
  stateText: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 6, textAlign: 'center' },
  retryButton: { marginTop: 14, borderRadius: 10, backgroundColor: C.maroon, paddingHorizontal: 15, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
});
