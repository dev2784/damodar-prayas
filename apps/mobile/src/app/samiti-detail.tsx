import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGetCommitteeQuery } from '@/services/committee-api';

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

export default function SamitiDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading, isError, refetch } = useGetCommitteeQuery(id ?? '', { skip: !id });
  const committee = data?.committee;
  const translation = committee?.translations.find((item) => item.language === 'HI') ?? committee?.translations[0];
  const location = [committee?.city, committee?.state].filter(Boolean).join(', ');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} />
        </Pressable>
        <Text style={styles.topTitle}>समिति विवरण</Text>
        <View style={styles.topSpacer} />
      </View>

      {!id || isError || (!isLoading && !committee) ? (
        <View style={styles.centerState}>
          <SymbolView name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }} tintColor={C.maroon} size={43} />
          <Text style={styles.stateTitle}>समिति उपलब्ध नहीं है</Text>
          <Text style={styles.stateText}>समिति हटाई गई हो सकती है या API से लोड नहीं हो पाई।</Text>
          {id ? (
            <Pressable style={styles.retryButton} onPress={refetch}>
              <Text style={styles.retryText}>फिर से कोशिश करें</Text>
            </Pressable>
          ) : null}
        </View>
      ) : isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.stateTitle}>समिति लोड हो रही है...</Text>
        </View>
      ) : committee ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {committee.bannerUrl ? (
            <Image source={{ uri: committee.bannerUrl }} style={styles.banner} contentFit="cover" transition={180} />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <SymbolView name={{ ios: 'building.columns.fill', android: 'account_balance', web: 'account_balance' }} tintColor={C.maroon} size={58} />
            </View>
          )}

          <View style={styles.heroCard}>
            <Text style={styles.name}>{translation?.name ?? 'समिति'}</Text>
            {location ? (
              <View style={styles.locationRow}>
                <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor={C.green} size={16} />
                <Text style={styles.location}>{location}</Text>
              </View>
            ) : null}
            {translation?.details ? <Text style={styles.details}>{translation.details}</Text> : null}
          </View>

          {committee.address || committee.phone || committee.email ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>समिति संपर्क</Text>
              {committee.address ? (
                <View style={styles.infoRow}>
                  <SymbolView name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }} tintColor={C.gold} size={18} />
                  <Text style={styles.infoText}>{committee.address}</Text>
                </View>
              ) : null}
              {committee.phone ? (
                <Pressable style={styles.infoRow} onPress={() => void Linking.openURL(`tel:${committee.phone}`)}>
                  <SymbolView name={{ ios: 'phone.fill', android: 'call', web: 'call' }} tintColor={C.green} size={18} />
                  <Text style={[styles.infoText, styles.linkText]}>{committee.phone}</Text>
                </Pressable>
              ) : null}
              {committee.email ? (
                <Pressable style={styles.infoRow} onPress={() => void Linking.openURL(`mailto:${committee.email}`)}>
                  <SymbolView name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }} tintColor={C.maroon} size={18} />
                  <Text style={[styles.infoText, styles.linkText]}>{committee.email}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {committee.members.length > 0 ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>समिति सदस्य / पदाधिकारी</Text>
              <Text style={styles.sectionHint}>केवल उपलब्ध सदस्य विवरण दिखाए जा रहे हैं।</Text>
              <View style={styles.membersList}>
                {committee.members.map((member) => (
                  <View key={member.id} style={styles.memberCard}>
                    {member.photoUrl ? (
                      <Image source={{ uri: member.photoUrl }} style={styles.memberPhoto} contentFit="cover" />
                    ) : (
                      <View style={styles.memberPhotoPlaceholder}>
                        <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} tintColor="#C6AFA1" size={42} />
                      </View>
                    )}
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.designationHi || member.designationEn ? (
                        <Text style={styles.memberDesignation}>{member.designationHi ?? member.designationEn}</Text>
                      ) : null}
                      {member.phone ? (
                        <Pressable onPress={() => void Linking.openURL(`tel:${member.phone}`)}>
                          <Text style={styles.memberContact}>📞 {member.phone}</Text>
                        </Pressable>
                      ) : null}
                      {member.email ? <Text style={styles.memberContact}>✉️ {member.email}</Text> : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  topBar: { height: 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.paper, borderBottomWidth: 1, borderBottomColor: C.line },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: C.maroonDark, fontSize: 16, fontWeight: '900' },
  topSpacer: { width: 38 },
  content: { padding: 14, paddingBottom: 110 },
  banner: { width: '100%', aspectRatio: 1.75, borderRadius: 18, backgroundColor: '#EEDFD3' },
  bannerPlaceholder: { width: '100%', aspectRatio: 1.75, borderRadius: 18, backgroundColor: '#F7E9DF', alignItems: 'center', justifyContent: 'center' },
  heroCard: { marginTop: 13, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, padding: 15 },
  name: { color: C.text, fontSize: 23, lineHeight: 30, fontWeight: '900' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  location: { color: C.green, fontSize: 11, fontWeight: '900' },
  details: { color: C.muted, fontSize: 11.5, lineHeight: 18, marginTop: 11 },
  sectionCard: { marginTop: 13, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, padding: 14 },
  sectionTitle: { color: C.maroonDark, fontSize: 15, fontWeight: '900' },
  sectionHint: { color: C.muted, fontSize: 9.5, marginTop: 3 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  infoText: { flex: 1, color: C.text, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  linkText: { color: C.green, fontWeight: '900' },
  membersList: { gap: 9, marginTop: 12 },
  memberCard: { flexDirection: 'row', gap: 10, borderRadius: 14, backgroundColor: '#FFF8F1', borderWidth: 1, borderColor: '#EFE0D1', padding: 10 },
  memberPhoto: { width: 58, height: 58, borderRadius: 13, backgroundColor: '#EEDFD3' },
  memberPhotoPlaceholder: { width: 58, height: 58, borderRadius: 13, backgroundColor: '#F1E5DB', alignItems: 'center', justifyContent: 'center' },
  memberCopy: { flex: 1, justifyContent: 'center' },
  memberName: { color: C.text, fontSize: 12.5, fontWeight: '900' },
  memberDesignation: { color: C.maroon, fontSize: 9.5, fontWeight: '800', marginTop: 2 },
  memberContact: { color: C.muted, fontSize: 9.5, marginTop: 4 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stateTitle: { color: C.text, fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  stateText: { color: C.muted, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  retryButton: { marginTop: 14, borderRadius: 11, backgroundColor: C.maroon, paddingHorizontal: 17, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
});
