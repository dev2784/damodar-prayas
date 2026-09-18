import { C, styles } from '@/styles/community.styles';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguageText } from '@/hooks/use-language-text';
import { type CommunityPost, useGetCommunityPostsQuery } from '@/services/community-api';

type FeedCategory = 'NEWS' | 'EVENT' | 'OBITUARY' | 'ADVERTISEMENT';

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
  const { text } = useLanguageText();
  const translation = post.translations[0];
  const isEvent = post.category === 'EVENT';
  const isAdvertisement = post.category === 'ADVERTISEMENT';
  const isObituary = post.category === 'OBITUARY';
  const date = formatDate(isEvent ? post.eventDate : (post.publishedAt ?? post.createdAt));
  const categoryLabel = isEvent ? text('कार्यक्रम', 'Event') : isAdvertisement ? text('विज्ञापन', 'Advertisement') : isObituary ? text('शोक सूचना', 'Obituary') : text('समाचार', 'News');
  const categoryIcon = isEvent
    ? ({ ios: 'calendar.badge.clock', android: 'event', web: 'event' } as const)
    : isAdvertisement
      ? ({ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' } as const)
      : isObituary
        ? ({ ios: 'flame.fill', android: 'local_florist', web: 'local_florist' } as const)
        : ({ ios: 'newspaper.fill', android: 'newspaper', web: 'newspaper' } as const);
  const categoryTint = isEvent ? C.gold : isAdvertisement ? C.green : isObituary ? C.muted : C.maroon;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/community-post', params: { id: post.id } })}
    >
      {post.bannerUrl ? (
        <Image
          source={{ uri: post.bannerUrl }}
          style={styles.banner}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View
          style={[
            styles.bannerPlaceholder,
            isEvent
              ? styles.eventPlaceholder
              : isAdvertisement
                ? styles.adPlaceholder
                : isObituary ? styles.obituaryPlaceholder : styles.newsPlaceholder,
          ]}
        >
          <SymbolView name={categoryIcon} tintColor={categoryTint} size={42} />
        </View>
      )}

      <View style={styles.cardBody}>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.categoryPill,
              isEvent ? styles.eventPill : isAdvertisement ? styles.adPill : isObituary ? styles.obituaryPill : styles.newsPill,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                isEvent ? styles.eventText : isAdvertisement ? styles.adText : isObituary ? styles.obituaryText : styles.newsText,
              ]}
            >
              {categoryLabel}
            </Text>
          </View>
          {post.isFeatured ? (
            <View style={styles.featuredPill}>
              <SymbolView
                name={{ ios: 'star.fill', android: 'star', web: 'star' }}
                tintColor="#FFFFFF"
                size={11}
              />
              <Text style={styles.featuredText}>{text('मुख्य', 'Featured')}</Text>
            </View>
          ) : null}
          <View style={styles.metaSpacer} />
          {date ? <Text style={styles.dateText}>{date}</Text> : null}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {translation?.title ?? text('विवरण उपलब्ध नहीं', 'Details unavailable')}
        </Text>
        {translation?.details ? (
          <Text style={styles.cardExcerpt} numberOfLines={3}>
            {excerpt(translation.details)}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          {post.location ? (
            <View style={styles.locationRow}>
              <SymbolView
                name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                tintColor={C.green}
                size={14}
              />
              <Text style={styles.locationText} numberOfLines={1}>
                {post.location}
              </Text>
            </View>
          ) : (
            <View />
          )}
          <View style={styles.readMoreRow}>
            <Text style={styles.readMore}>{text('पूरा देखें', 'View details')}</Text>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              tintColor={C.maroon}
              size={14}
            />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function CommunityScreen() {
  const { text, apiLanguage } = useLanguageText();
  const [activeCategory, setActiveCategory] = useState<FeedCategory>('NEWS');
  const { data, isLoading, isFetching, isError, refetch } = useGetCommunityPostsQuery({
    category: activeCategory,
    language: apiLanguage,
  });

  const items = data?.items ?? [];
  const sectionLabel =
    activeCategory === 'NEWS'
      ? text('ताज़ा समाचार', 'Latest news')
      : activeCategory === 'EVENT'
        ? text('आने वाले कार्यक्रम', 'Upcoming events')
        : activeCategory === 'OBITUARY'
          ? text('शोक सूचनाएँ', 'Obituary notices')
          : text('समाज व्यापार विज्ञापन', 'Community business ads');
  const emptyLabel =
    activeCategory === 'NEWS'
      ? text('अभी कोई समाचार प्रकाशित नहीं है', 'No news published yet')
      : activeCategory === 'EVENT'
        ? text('अभी कोई कार्यक्रम प्रकाशित नहीं है', 'No events published yet')
        : activeCategory === 'OBITUARY'
          ? text('अभी कोई शोक सूचना प्रकाशित नहीं है', 'No obituary notices published yet')
          : text('अभी कोई विज्ञापन प्रकाशित नहीं है', 'No advertisements published yet');
  const emptyIcon =
    activeCategory === 'NEWS'
      ? ({ ios: 'newspaper', android: 'newspaper', web: 'newspaper' } as const)
      : activeCategory === 'EVENT'
        ? ({ ios: 'calendar', android: 'event', web: 'event' } as const)
        : activeCategory === 'OBITUARY'
          ? ({ ios: 'flame', android: 'local_florist', web: 'local_florist' } as const)
          : ({ ios: 'megaphone', android: 'campaign', web: 'campaign' } as const);

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
                  <Text style={styles.eyebrow}>{text('समाज अपडेट्स', 'Community updates')}</Text>
                  <Text style={styles.title}>{text('समाचार, कार्यक्रम, शोक सूचना एवं विज्ञापन', 'News, events, obituary notices & advertisements')}</Text>
                </View>
                <Pressable
                  style={styles.addButton}
                  onPress={() =>
                    router.push({
                      pathname: '/community-submit',
                      params: { category: activeCategory },
                    })
                  }
                >
                  <SymbolView
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
                  <Text style={styles.addButtonText}>{text('जोड़ें', 'Add')}</Text>
                </Pressable>
              </View>
              <Text style={styles.subtitle}>
                {text('समाज की खबरें, समारोह और स्वीकृत व्यापार विज्ञापन एक ही जगह।', 'Community news, events and approved business advertisements in one place.')}
              </Text>
            </View>

            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, activeCategory === 'NEWS' && styles.activeTab]}
                onPress={() => setActiveCategory('NEWS')}
              >
                <SymbolView
                  name={{ ios: 'newspaper.fill', android: 'newspaper', web: 'newspaper' }}
                  tintColor={activeCategory === 'NEWS' ? '#FFFFFF' : C.maroon}
                  size={16}
                />
                <Text style={[styles.tabText, activeCategory === 'NEWS' && styles.activeTabText]}>
                  {text('समाचार', 'News')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeCategory === 'EVENT' && styles.activeTab]}
                onPress={() => setActiveCategory('EVENT')}
              >
                <SymbolView
                  name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                  tintColor={activeCategory === 'EVENT' ? '#FFFFFF' : C.maroon}
                  size={16}
                />
                <Text style={[styles.tabText, activeCategory === 'EVENT' && styles.activeTabText]}>
                  {text('समारोह', 'Events')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeCategory === 'OBITUARY' && styles.activeTab]}
                onPress={() => setActiveCategory('OBITUARY')}
              >
                <SymbolView
                  name={{ ios: 'flame.fill', android: 'local_florist', web: 'local_florist' }}
                  tintColor={activeCategory === 'OBITUARY' ? '#FFFFFF' : C.maroon}
                  size={16}
                />
                <Text style={[styles.tabText, activeCategory === 'OBITUARY' && styles.activeTabText]}>
                  {text('शोक सूचना', 'Obituary')}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, activeCategory === 'ADVERTISEMENT' && styles.activeTab]}
                onPress={() => setActiveCategory('ADVERTISEMENT')}
              >
                <SymbolView
                  name={{ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' }}
                  tintColor={activeCategory === 'ADVERTISEMENT' ? '#FFFFFF' : C.maroon}
                  size={16}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeCategory === 'ADVERTISEMENT' && styles.activeTabText,
                  ]}
                >
                  {text('विज्ञापन', 'Ads')}
                </Text>
              </Pressable>
            </View>

            {!isLoading && !isError && items.length > 0 ? (
              <View style={styles.countRow}>
                <Text style={styles.countText}>{sectionLabel}</Text>
                <Text style={styles.countValue}>{data?.pagination.total ?? items.length}</Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={C.maroon} size="large" />
              <Text style={styles.stateTitle}>{text('जानकारी लोड हो रही है...', 'Loading information...')}</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateCard}>
              <SymbolView
                name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                tintColor={C.maroon}
                size={42}
              />
              <Text style={styles.stateTitle}>{text('अभी जानकारी लोड नहीं हो पाई', 'Could not load information')}</Text>
              <Text style={styles.stateText}>{text('इंटरनेट या API कनेक्शन जाँचकर दोबारा कोशिश करें।', 'Check your internet or API connection and try again.')}</Text>
              <Pressable style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryText}>{text('फिर से कोशिश करें', 'Try again')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <SymbolView name={emptyIcon} tintColor={C.gold} size={42} />
              <Text style={styles.stateTitle}>{emptyLabel}</Text>
              <Text style={styles.stateText}>
                {text('Admin approval के बाद नई जानकारी यहाँ दिखाई देगी।', 'New information will appear here after admin approval.')}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
