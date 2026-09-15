import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type MatrimonyOwnerProfile,
  type MatrimonyProfileStatus,
  useGetMyMatrimonyProfilesQuery,
  useSubmitMatrimonyProfileMutation,
} from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

const C = {
  bg: '#FFF8ED',
  paper: '#FFFFFF',
  maroon: '#A30D1E',
  maroonDark: '#77101B',
  gold: '#D99A2B',
  text: '#2A211D',
  muted: '#736660',
  line: '#E9DDD1',
  green: '#16865C',
  amber: '#B76A12',
  red: '#B42318',
  blue: '#2F62A3',
};

const statusMeta: Record<MatrimonyProfileStatus, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'ड्राफ्ट', bg: '#FFF4DE', color: C.amber },
  PENDING: { label: 'समीक्षा में', bg: '#EEF4FF', color: C.blue },
  APPROVED: { label: 'स्वीकृत', bg: '#EAF8F0', color: C.green },
  REJECTED: { label: 'सुधार आवश्यक', bg: '#FFF0EE', color: C.red },
  SUSPENDED: { label: 'रुका हुआ', bg: '#F3F1F0', color: '#685F5A' },
  MARRIED: { label: 'विवाह सम्पन्न', bg: '#F8EFFA', color: '#7A3B86' },
};

const profileForLabels: Record<MatrimonyOwnerProfile['profileFor'], string> = {
  SELF: 'स्वयं के लिए',
  SON: 'पुत्र के लिए',
  DAUGHTER: 'पुत्री के लिए',
  BROTHER: 'भाई के लिए',
  SISTER: 'बहन के लिए',
  RELATIVE: 'रिश्तेदार के लिए',
};

function nameOf(profile: MatrimonyOwnerProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}

function ProfileCard({
  profile,
  submitting,
  onSubmit,
}: {
  profile: MatrimonyOwnerProfile;
  submitting: boolean;
  onSubmit: (id: string) => void;
}) {
  const status = statusMeta[profile.status];
  const editable = profile.status === 'DRAFT' || profile.status === 'REJECTED';
  const canSubmit = editable;

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.avatar}>
          <SymbolView
            name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }}
            tintColor="#C79D86"
            size={46}
          />
        </View>

        <View style={styles.cardHeading}>
          <Text style={styles.name} numberOfLines={1}>{nameOf(profile)}</Text>
          <Text style={styles.profileFor}>{profileForLabels[profile.profileFor]}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText} numberOfLines={1}>
          {[profile.currentCity, profile.state].filter(Boolean).join(', ') || 'स्थान अभी नहीं जोड़ा'}
        </Text>
        <Text style={styles.metaDot}>•</Text>
        <Text style={styles.metaText} numberOfLines={1}>
          {profile.occupation || profile.education || 'विवरण अधूरा'}
        </Text>
      </View>

      {profile.status === 'REJECTED' && profile.rejectionReason ? (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionTitle}>सुधार का कारण</Text>
          <Text style={styles.rejectionText}>{profile.rejectionReason}</Text>
        </View>
      ) : null}

      <View style={styles.cardActions}>
        {editable ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/matrimony-form', params: { id: profile.id } })}>
            <SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={C.maroon} size={16} />
            <Text style={styles.secondaryButtonText}>एडिट करें</Text>
          </Pressable>
        ) : profile.status === 'APPROVED' ? (
          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })}>
            <SymbolView name={{ ios: 'eye', android: 'visibility', web: 'visibility' }} tintColor={C.maroon} size={16} />
            <Text style={styles.secondaryButtonText}>देखें</Text>
          </Pressable>
        ) : (
          <View style={styles.lockedState}>
            <SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor="#8B7F78" size={14} />
            <Text style={styles.lockedText}>अभी एडिट नहीं किया जा सकता</Text>
          </View>
        )}

        {canSubmit ? (
          <Pressable
            disabled={submitting}
            style={[styles.primaryButton, submitting && styles.buttonDisabled]}
            onPress={() => onSubmit(profile.id)}>
            {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
              <>
                <SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} tintColor="#FFFFFF" size={15} />
                <Text style={styles.primaryButtonText}>स्वीकृति के लिए भेजें</Text>
              </>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function MyMatrimonyScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { data, isLoading, isFetching, isError, refetch } = useGetMyMatrimonyProfilesQuery(undefined, {
    skip: !accessToken,
  });
  const [submitProfile] = useSubmitMatrimonyProfileMutation();

  async function handleSubmit(id: string) {
    Alert.alert(
      'प्रोफाइल भेजें?',
      'भेजने के बाद प्रोफाइल समीक्षा में चली जाएगी और स्वीकृति तक एडिट नहीं होगी।',
      [
        { text: 'अभी नहीं', style: 'cancel' },
        {
          text: 'भेजें',
          onPress: async () => {
            try {
              setSubmittingId(id);
              await submitProfile(id).unwrap();
              Alert.alert('भेज दिया', 'प्रोफाइल अब समिति की समीक्षा में है।');
            } catch {
              Alert.alert('सबमिट नहीं हुआ', 'कृपया दोबारा कोशिश करें।');
            } finally {
              setSubmittingId(null);
            }
          },
        },
      ],
    );
  }

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.authState}>
          <View style={styles.authIcon}>
            <SymbolView name={{ ios: 'person.badge.key.fill', android: 'login', web: 'login' }} tintColor={C.maroon} size={44} />
          </View>
          <Text style={styles.authTitle}>मैट्रिमोनी प्रोफाइल के लिए लॉगिन जरूरी है</Text>
          <Text style={styles.authText}>
            आपकी ड्राफ्ट, संपर्क जानकारी और प्रोफाइल की स्थिति निजी रहती है, इसलिए पहले अपना अकाउंट सत्यापित करें।
          </Text>
          <Pressable style={styles.loginButton} onPress={() => router.push('/profile')}>
            <Text style={styles.loginButtonText}>प्रोफाइल / लॉगिन पर जाएँ</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backLink}>वापस मैट्रिमोनी देखें</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY MATRIMONY</Text>
            <Text style={styles.title}>मेरे मैट्रिमोनी प्रोफाइल</Text>
          </View>

          <Pressable style={styles.addButton} onPress={() => router.push('/matrimony-form')}>
            <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor="#FFFFFF" size={18} />
          </Pressable>
        </View>

        <View style={styles.infoBanner}>
          <SymbolView name={{ ios: 'shield.checkered', android: 'verified_user', web: 'verified_user' }} tintColor={C.green} size={22} />
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>आप नियंत्रण में हैं</Text>
            <Text style={styles.infoText}>पहले ड्राफ्ट सेव करें, फिर तैयार होने पर समीक्षा के लिए भेजें।</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={C.maroon} size="large" />
            <Text style={styles.stateTitle}>आपके प्रोफाइल लोड हो रहे हैं...</Text>
          </View>
        ) : isError ? (
          <View style={styles.stateBox}>
            <SymbolView name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} tintColor={C.maroon} size={38} />
            <Text style={styles.stateTitle}>प्रोफाइल लोड नहीं हो पाए</Text>
            <Pressable style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>फिर से कोशिश करें</Text>
            </Pressable>
          </View>
        ) : (data?.items.length ?? 0) === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <SymbolView name={{ ios: 'heart.text.square.fill', android: 'favorite', web: 'favorite' }} tintColor={C.maroon} size={40} />
            </View>
            <Text style={styles.emptyTitle}>पहला मैट्रिमोनी प्रोफाइल बनाएँ</Text>
            <Text style={styles.emptyText}>
              बेसिक जानकारी भरकर ड्राफ्ट सेव करें। फोटो और बाकी विवरण अगले चरणों में जोड़ सकते हैं।
            </Text>
            <Pressable style={styles.createButton} onPress={() => router.push('/matrimony-form')}>
              <SymbolView name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }} tintColor="#FFFFFF" size={18} />
              <Text style={styles.createButtonText}>नया प्रोफाइल बनाएँ</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listBlock}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>{data?.items.length ?? 0} प्रोफाइल</Text>
              {isFetching ? <ActivityIndicator color={C.maroon} size="small" /> : null}
            </View>

            {data?.items.map((profile) => (
              <ProfileCard
                key={profile.id}
                profile={profile}
                submitting={submittingId === profile.id}
                onSubmit={handleSubmit}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 },
  iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line },
  headerCopy: { flex: 1 },
  eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: C.maroonDark, fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 2 },
  addButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.maroon },

  infoBanner: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: 15, backgroundColor: '#F2FBF6', borderWidth: 1, borderColor: '#CFEBDD', marginBottom: 15 },
  infoCopy: { flex: 1 },
  infoTitle: { color: '#135C43', fontSize: 12, fontWeight: '900' },
  infoText: { color: '#497063', fontSize: 10.5, lineHeight: 16, marginTop: 2 },

  listBlock: { gap: 10 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '900' },
  card: { padding: 14, borderRadius: 17, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' },
  cardHeading: { flex: 1, minWidth: 0 },
  name: { color: C.text, fontSize: 16, fontWeight: '900' },
  profileFor: { color: C.muted, fontSize: 10.5, marginTop: 3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9 },
  statusText: { fontSize: 9, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  metaText: { flexShrink: 1, color: C.muted, fontSize: 10.5 },
  metaDot: { color: '#B7A69D', fontSize: 11 },
  rejectionBox: { marginTop: 11, padding: 10, borderRadius: 12, backgroundColor: '#FFF5F3', borderWidth: 1, borderColor: '#F5D4CF' },
  rejectionTitle: { color: C.red, fontSize: 10, fontWeight: '900' },
  rejectionText: { color: '#7C4B46', fontSize: 10.5, lineHeight: 16, marginTop: 3 },
  cardActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 14 },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E4C8C1', backgroundColor: '#FFF8F5' },
  secondaryButtonText: { color: C.maroon, fontSize: 10.5, fontWeight: '900' },
  primaryButton: { flex: 1, minHeight: 40, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
  buttonDisabled: { opacity: 0.62 },
  lockedState: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lockedText: { color: '#8B7F78', fontSize: 9.5, fontWeight: '700' },

  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 52, gap: 10 },
  stateTitle: { color: C.text, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  retryButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 11, backgroundColor: C.maroon },
  retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },

  emptyCard: { alignItems: 'center', padding: 24, marginTop: 6, borderRadius: 20, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line },
  emptyIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' },
  emptyTitle: { color: C.maroonDark, fontSize: 18, fontWeight: '900', marginTop: 15, textAlign: 'center' },
  emptyText: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 7, textAlign: 'center' },
  createButton: { marginTop: 18, minHeight: 46, paddingHorizontal: 18, borderRadius: 13, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  createButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },

  authState: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' },
  authIcon: { width: 82, height: 82, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC', borderWidth: 1, borderColor: '#F0D1C8' },
  authTitle: { color: C.maroonDark, fontSize: 21, lineHeight: 28, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  authText: { color: C.muted, fontSize: 12.5, lineHeight: 20, textAlign: 'center', marginTop: 9 },
  loginButton: { width: '100%', minHeight: 48, marginTop: 20, borderRadius: 14, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center' },
  loginButtonText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' },
  backLink: { color: C.maroon, fontSize: 11, fontWeight: '800', marginTop: 16 },
});
