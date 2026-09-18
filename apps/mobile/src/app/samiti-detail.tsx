import { C, styles } from '@/styles/samiti-detail.styles';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { useGetCommitteeQuery } from '@/services/committee-api';

export default function SamitiDetailScreen() {
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading, isError, refetch } = useGetCommitteeQuery(id ?? '', { skip: !id });
  const committee = data?.committee;
  const translation =
    committee?.translations.find((item) => item.language === 'HI') ?? committee?.translations[0];
  const location = [committee?.city, committee?.state].filter(Boolean).join(', ');

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
        <Text style={styles.topTitle}>समिति विवरण</Text>
        <View style={styles.topSpacer} />
      </View>

      {!id || isError || (!isLoading && !committee) ? (
        <View style={styles.centerState}>
          <SymbolView
            name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
            tintColor={C.maroon}
            size={43}
          />
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
            <Pressable onPress={() => setViewerUrl(committee.bannerUrl)}><Image
              source={{ uri: committee.bannerUrl }}
              style={styles.banner}
              contentFit="cover"
              transition={180}
            /></Pressable>
          ) : (
            <View style={styles.bannerPlaceholder}>
              <SymbolView
                name={{
                  ios: 'building.columns.fill',
                  android: 'account_balance',
                  web: 'account_balance',
                }}
                tintColor={C.maroon}
                size={58}
              />
            </View>
          )}

          <View style={styles.heroCard}>
            <Text style={styles.name}>{translation?.name ?? 'समिति'}</Text>
            {location ? (
              <View style={styles.locationRow}>
                <SymbolView
                  name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                  tintColor={C.green}
                  size={16}
                />
                <Text style={styles.location}>{location}</Text>
              </View>
            ) : null}
            {translation?.details ? (
              <Text style={styles.details}>{translation.details}</Text>
            ) : null}
          </View>

          {committee.address || committee.phone || committee.email ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>समिति संपर्क</Text>
              {committee.address ? (
                <View style={styles.infoRow}>
                  <SymbolView
                    name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
                    tintColor={C.gold}
                    size={18}
                  />
                  <Text style={styles.infoText}>{committee.address}</Text>
                </View>
              ) : null}
              {committee.phone ? (
                <Pressable
                  style={styles.infoRow}
                  onPress={() => void Linking.openURL(`tel:${committee.phone}`)}
                >
                  <SymbolView
                    name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                    tintColor={C.green}
                    size={18}
                  />
                  <Text style={[styles.infoText, styles.linkText]}>{committee.phone}</Text>
                </Pressable>
              ) : null}
              {committee.email ? (
                <Pressable
                  style={styles.infoRow}
                  onPress={() => void Linking.openURL(`mailto:${committee.email}`)}
                >
                  <SymbolView
                    name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
                    tintColor={C.maroon}
                    size={18}
                  />
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
                      <Pressable onPress={() => setViewerUrl(member.photoUrl)}><Image
              source={{ uri: member.photoUrl }}
                        style={styles.memberPhoto}
                        contentFit="cover"
                      /></Pressable>
                    ) : (
                      <View style={styles.memberPhotoPlaceholder}>
                        <SymbolView
                          name={{
                            ios: 'person.crop.circle.fill',
                            android: 'account_circle',
                            web: 'account_circle',
                          }}
                          tintColor="#C6AFA1"
                          size={42}
                        />
                      </View>
                    )}
                    <View style={styles.memberCopy}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      {member.designationHi || member.designationEn ? (
                        <Text style={styles.memberDesignation}>
                          {member.designationHi ?? member.designationEn}
                        </Text>
                      ) : null}
                      {member.phone ? (
                        <Pressable onPress={() => void Linking.openURL(`tel:${member.phone}`)}>
                          <Text style={styles.memberContact}>📞 {member.phone}</Text>
                        </Pressable>
                      ) : null}
                      {member.email ? (
                        <Text style={styles.memberContact}>✉️ {member.email}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      ) : null}
      <Modal visible={Boolean(viewerUrl)} transparent animationType="fade" onRequestClose={() => setViewerUrl(null)}>
        <View style={styles.viewerOverlay}>
          <Pressable style={styles.viewerClose} onPress={() => setViewerUrl(null)}><Text style={styles.viewerCloseText}>✕</Text></Pressable>
          {viewerUrl ? <Image source={{ uri: viewerUrl }} style={styles.viewerImage} contentFit="contain" /> : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
