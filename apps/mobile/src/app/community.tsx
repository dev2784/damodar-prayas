import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type CommunityPost,
  useGetCommunityPostsQuery,
} from '@/services/community-api';

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
  blue: '#356AA0',
};

type FeedCategory = 'NEWS' | 'EVENT';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('hi-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function excerpt(value: string) {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > 145 ? `${clean.slice(0, 142)}...` : clean;
}

function PostCard({ post }: { post: CommunityPost }) {
  const translation = post.translations[0];
  const isEvent = post.category === 'EVENT';
  const date = formatDate(isEvent ? post.eventDate : post.publishedAt ?? post.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/community-post', params: { id: post.id } })}>
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
            size={42}
          />
        </View>
      )}

      <View style={styles.cardBody}>
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
          <View style={styles.metaSpacer} />
          {date ? <Text style={styles.dateText}>{date}</Text> : null}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {translation?.title ?? 'विवरण उपलब्ध नहीं'}
        </Text>
        {translation?.details ? (
          <Text style={styles.cardExcerpt} numberOfLines={3}>
            {excerpt(translation.details)}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          {post.location ? (
            <View style={styles.locationRow}>
              <SymbolView name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }} tintColor={C.green} size={14} />
              <Text style={styles.locationText} numberOfLines={1}>{post.location}</Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.readMoreRow}>
            <Text style={styles.readMore}>पूरा देखें</Text>
            <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={C.maroon} size={14} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('NEWS');
  const { data, isLoading, isFetching, isError, refetch } = useGetCommunityPostsQuery({
    category: activeCategory,
    language: 'HI',
  });

  const items = data?.items ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={C.maroon}
          />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerCopy}>
                  <Text style={styles.eyebrow}>समाज अपडेट्स</Text>
                  <Text style={styles.title}>समाचार एवं कार्यक्रम</Text>
                </View>
                <Pressable
                  style={styles.addButton}
                  onPress={() => router.push({ pathname: '/community-submit', params: { category: activeCategory } })}>
                  <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor="#FFFFFF" size={16} />
                  <Text style={styles.addButtonText}>जोड़ें</Text>
                </Pressable>
              </View>
              <Text style={styles.subtitle}>
                समाज की नई खबरें, घोषणाएँ और आने वाले कार्यक्रम एक ही जगह।
              </Text>
            </View>

            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, activeCategory === 'NEWS' && styles.activeTab]}
                onPress={() => setActiveCategory('NEWS')}>
                <SymbolView
                  name={{ ios: 'newspaper.fill', android: 'newspaper', web: 'newspaper' }}
                  tintColor={activeCategory === 'NEWS' ? '#FFFFFF' : C.maroon}
                  size={17}
                />
                <Text style={[styles.tabText, activeCategory === 'NEWS' && styles.activeTabText]}>समाचार</Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeCategory === 'EVENT' && styles.activeTab]}
                onPress={() => setActiveCategory('EVENT')}>
                <SymbolView
                  name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                  tintColor={activeCategory === 'EVENT' ? '#FFFFFF' : C.maroon}
                  size={17}
                />
                <Text style={[styles.tabText, activeCategory === 'EVENT' && styles.activeTabText]}>कार्यक्रम</Text>
              </Pressable>
            </View>

            {!isLoading && !isError && items.length > 0 ? (
              <View style={styles.countRow}>
                <Text style={styles.countText}>
                  {activeCategory === 'NEWS' ? 'ताज़ा समाचार' : 'आने वाले कार्यक्रम'}
                </Text>
                <Text style={styles.countValue}>{data?.pagination.total ?? items.length}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={C.maroon} size="large" />
              <Text style={styles.stateTitle}>जानकारी लोड हो रही है...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateCard}>
              <SymbolView name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} tintColor={C.maroon} size={42} />
              <Text style={styles.stateTitle}>अभी जानकारी लोड नहीं हो पाई</Text>
              <Text style={styles.stateText}>इंटरनेट या API कनेक्शन जाँचकर दोबारा कोशिश करें।</Text>
              <Pressable style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryText}>फिर से कोशिश करें</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <SymbolView
                name={
                  activeCategory === 'NEWS'
                    ? { ios: 'newspaper', android: 'newspaper', web: 'newspaper' }
                    : { ios: 'calendar', android: 'event', web: 'event' }
                }
                tintColor={C.gold}
                size={42}
              />
              <Text style={styles.stateTitle}>
                {activeCategory === 'NEWS' ? 'अभी कोई समाचार प्रकाशित नहीं है' : 'अभी कोई कार्यक्रम प्रकाशित नहीं है'}
              </Text>
              <Text style={styles.stateText}>नई जानकारी प्रकाशित होते ही यहाँ दिखाई देगी।</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 110, flexGrow: 1 },
  header: { paddingHorizontal: 2, paddingTop: 5, paddingBottom: 13 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerCopy: { flex: 1 },
  addButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 11, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' },
  eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: C.maroonDark, fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 3 },
  subtitle: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 4, maxWidth: 360 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    padding: 5,
    borderRadius: 16,
    backgroundColor: '#F5EBDD',
    borderWidth: 1,
    borderColor: '#E8D9C8',
    marginBottom: 13,
  },
  tab: {
    flex: 1,
    minHeight: 43,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  activeTab: { backgroundColor: C.maroon },
  tabText: { color: C.maroon, fontSize: 12, fontWeight: '900' },
  activeTabText: { color: '#FFFFFF' },
  countRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 9, paddingHorizontal: 2 },
  countText: { color: C.text, fontSize: 12, fontWeight: '900' },
  countValue: {
    marginLeft: 7,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    overflow: 'hidden',
    backgroundColor: '#F3E5E2',
    color: C.maroon,
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 9,
    fontWeight: '900',
  },
  card: {
    backgroundColor: C.paper,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.line,
    marginBottom: 13,
    elevation: 2,
    shadowColor: '#5D3724',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.995 }] },
  banner: { width: '100%', aspectRatio: 1.85, backgroundColor: '#EEDFD3' },
  bannerPlaceholder: { width: '100%', aspectRatio: 1.85, alignItems: 'center', justifyContent: 'center' },
  newsPlaceholder: { backgroundColor: '#FAECEC' },
  eventPlaceholder: { backgroundColor: '#FFF4DC' },
  cardBody: { padding: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', minHeight: 24 },
  categoryPill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  newsPill: { backgroundColor: '#FCE9EC' },
  eventPill: { backgroundColor: '#FFF1D5' },
  categoryText: { fontSize: 8.5, fontWeight: '900' },
  newsText: { color: C.maroon },
  eventText: { color: '#A86600' },
  featuredPill: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 6, borderRadius: 8, backgroundColor: C.gold, paddingHorizontal: 7, paddingVertical: 4 },
  featuredText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  metaSpacer: { flex: 1 },
  dateText: { color: C.muted, fontSize: 8.5, fontWeight: '700' },
  cardTitle: { color: C.text, fontSize: 17, lineHeight: 23, fontWeight: '900', marginTop: 9 },
  cardExcerpt: { color: C.muted, fontSize: 10.5, lineHeight: 16, marginTop: 6 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 11 },
  locationRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { flex: 1, color: C.green, fontSize: 9.5, fontWeight: '800' },
  readMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  readMore: { color: C.maroon, fontSize: 9.5, fontWeight: '900' },
  stateCard: {
    minHeight: 260,
    marginTop: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
  },
  stateTitle: { color: C.text, fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  stateText: { color: C.muted, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 5 },
  retryButton: { marginTop: 14, borderRadius: 11, backgroundColor: C.maroon, paddingHorizontal: 17, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
});
