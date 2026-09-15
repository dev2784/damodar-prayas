import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGetCommunityPostQuery } from '@/services/community-api';

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

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('hi-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function CommunityPostScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading, isError, refetch } = useGetCommunityPostQuery(id ?? '', { skip: !id });
  const post = data?.post;

  if (!id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>पोस्ट उपलब्ध नहीं है</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>वापस जाएँ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const translation = post?.translations.find((item) => item.language === 'HI') ?? post?.translations[0];
  const isEvent = post?.category === 'EVENT';
  const eventDate = formatDate(post?.eventDate ?? null);
  const publishedDate = formatDate(post?.publishedAt ?? post?.createdAt ?? null);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} />
        </Pressable>
        <Text style={styles.topTitle}>{isEvent ? 'कार्यक्रम विवरण' : 'समाचार विवरण'}</Text>
        <View style={styles.topSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.stateTitle}>जानकारी लोड हो रही है...</Text>
        </View>
      ) : isError || !post ? (
        <View style={styles.centerState}>
          <SymbolView name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }} tintColor={C.maroon} size={43} />
          <Text style={styles.stateTitle}>जानकारी उपलब्ध नहीं है</Text>
          <Text style={styles.stateText}>पोस्ट हटाई गई हो सकती है या API से लोड नहीं हो पाई।</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>फिर से कोशिश करें</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {post.bannerUrl ? (
            <Image source={{ uri: post.bannerUrl }} style={styles.banner} contentFit="cover" transition={180} />
          ) : (
            <View style={[styles.bannerPlaceholder, isEvent ? styles.eventPlaceholder : styles.newsPlaceholder]}>
              <SymbolView
                name={
                  isEvent
                    ? { ios: 'calendar.badge.clock', android: 'event', web: 'event' }
                    : { ios: 'newspaper.fill', android: 'newspaper', web: 'newspaper' }
                }
                tintColor={isEvent ? C.gold : C.maroon}
                size={54}
              />
            </View>
          )}

          <View style={styles.articleCard}>
            <View style={styles.metaRow}>
              <View style={[styles.categoryPill, isEvent ? styles.eventPill : styles.newsPill]}>
                <Text style={[styles.categoryText, isEvent ? styles.eventText : styles.newsText]}>
                  {isEvent ? 'कार्यक्रम' : 'समाचार'}
                </Text>
              </View>
              {post.isFeatured ? (
                <View style={styles.featuredPill}>
                  <SymbolView name={{ ios: 'star.fill', android: 'star', web: 'star' }} tintColor="#FFFFFF" size={11} />
                  <Text style={styles.featuredText}>मुख्य</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{translation?.title ?? 'विवरण उपलब्ध नहीं'}</Text>

            <View style={styles.infoStack}>
              {isEvent && eventDate ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <SymbolView name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} tintColor={C.maroon} size={17} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>कार्यक्रम की तारीख</Text>
                    <Text style={styles.infoValue}>{eventDate}</Text>
                  </View>
                </View>
              ) : null}

              {post.location ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor={C.green} size={17} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>स्थान</Text>
                    <Text style={styles.infoValue}>{post.location}</Text>
                  </View>
                </View>
              ) : null}

              {!isEvent && publishedDate ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <SymbolView name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }} tintColor={C.gold} size={17} />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>प्रकाशित</Text>
                    <Text style={styles.infoValue}>{publishedDate}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {translation?.details ? <Text style={styles.details}>{translation.details}</Text> : null}
          </View>

          {post.contactName || post.contactPhone ? (
            <View style={styles.contactCard}>
              <View style={styles.contactTitleRow}>
                <SymbolView name={{ ios: 'person.crop.circle.fill', android: 'contact_phone', web: 'contact_phone' }} tintColor={C.maroon} size={22} />
                <Text style={styles.contactTitle}>संपर्क</Text>
              </View>
              {post.contactName ? <Text style={styles.contactName}>{post.contactName}</Text> : null}
              {post.contactPhone ? (
                <Pressable style={styles.phoneButton} onPress={() => void Linking.openURL(`tel:${post.contactPhone}`)}>
                  <SymbolView name={{ ios: 'phone.fill', android: 'call', web: 'call' }} tintColor="#FFFFFF" size={16} />
                  <Text style={styles.phoneButtonText}>{post.contactPhone}</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  topBar: {
    height: 58,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.paper,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFF0EC', alignItems: 'center', justifyContent: 'center' },
  topTitle: { color: C.maroonDark, fontSize: 16, fontWeight: '900' },
  topSpacer: { width: 38 },
  content: { padding: 14, paddingBottom: 110 },
  banner: { width: '100%', aspectRatio: 1.65, borderRadius: 18, backgroundColor: '#EEDFD3' },
  bannerPlaceholder: { width: '100%', aspectRatio: 1.65, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  newsPlaceholder: { backgroundColor: '#FAECEC' },
  eventPlaceholder: { backgroundColor: '#FFF4DC' },
  articleCard: { marginTop: 13, borderRadius: 18, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, padding: 15 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  categoryPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  newsPill: { backgroundColor: '#FCE9EC' },
  eventPill: { backgroundColor: '#FFF1D5' },
  categoryText: { fontSize: 8.5, fontWeight: '900' },
  newsText: { color: C.maroon },
  eventText: { color: '#A86600' },
  featuredPill: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6, borderRadius: 8, backgroundColor: C.gold, paddingHorizontal: 7, paddingVertical: 4 },
  featuredText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  title: { color: C.text, fontSize: 23, lineHeight: 31, fontWeight: '900', marginTop: 11 },
  infoStack: { gap: 8, marginTop: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 4 },
  infoIconWrap: { width: 33, height: 33, borderRadius: 11, backgroundColor: '#FFF5EA', alignItems: 'center', justifyContent: 'center' },
  infoCopy: { flex: 1 },
  infoLabel: { color: C.muted, fontSize: 8.5, fontWeight: '800' },
  infoValue: { color: C.text, fontSize: 11.5, fontWeight: '900', marginTop: 1 },
  details: { color: '#4A403B', fontSize: 13, lineHeight: 22, marginTop: 18 },
  contactCard: { marginTop: 13, borderRadius: 18, backgroundColor: '#FFFDF9', borderWidth: 1, borderColor: C.line, padding: 14 },
  contactTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  contactTitle: { color: C.maroonDark, fontSize: 14, fontWeight: '900' },
  contactName: { color: C.text, fontSize: 12, fontWeight: '800', marginTop: 10 },
  phoneButton: { marginTop: 10, minHeight: 44, borderRadius: 12, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  phoneButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  stateTitle: { color: C.text, fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  stateText: { color: C.muted, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  retryButton: { marginTop: 14, borderRadius: 11, backgroundColor: C.maroon, paddingHorizontal: 17, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
});
