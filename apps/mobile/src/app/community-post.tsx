import { useLanguageText } from '@/hooks/use-language-text';
import { C, styles } from '@/styles/community-post.styles';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import {
  useGetCommunityLocationsQuery,
  useGetCommunityPostQuery,
  useGetCommunityPostLikesQuery,
  useGetMyCommunityPostLikeQuery,
  useLikeCommunityPostMutation,
  useUnlikeCommunityPostMutation,
} from '@/services/community-api';
import { useAppSelector } from '@/store/hooks';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('hi-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export default function CommunityPostScreen() {
  const { text, apiLanguage } = useLanguageText();
  const { data: locations } = useGetCommunityLocationsQuery();
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { data, isLoading, isError, refetch } = useGetCommunityPostQuery(id ?? '', { skip: !id });
  const post = data?.post;
  const city = locations?.cities.find((item) => item.id === post?.cityId);
  const location = [city?.name, post?.location].filter(Boolean).join(' · ');
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data: likesData } = useGetCommunityPostLikesQuery(id ?? '', { skip: !id });
  const { data: myLike } = useGetMyCommunityPostLikeQuery(id ?? '', { skip: !id || !accessToken });
  const [likePost, { isLoading: liking }] = useLikeCommunityPostMutation();
  const [unlikePost, { isLoading: unliking }] = useUnlikeCommunityPostMutation();
  const likeBusy = liking || unliking;

  async function toggleLike() {
    if (!id) return;
    if (!accessToken) {
      router.push({ pathname: '/auth', params: { next: `/community-post?id=${id}` } });
      return;
    }
    try {
      if (myLike?.isLiked) await unlikePost(id).unwrap();
      else await likePost(id).unwrap();
    } catch {
      Alert.alert('Like नहीं हुआ', 'कृपया दोबारा कोशिश करें।');
    }
  }

  async function sharePost() {
    if (!post) return;
    const tr = post.translations.find((x) => x.language === apiLanguage) ?? post.translations[0];
    const message = [
      tr?.title,
      tr?.details?.slice(0, 180),
      location ? `${text('स्थान', 'Location')}: ${location}` : null,
      'Damodar Prayas',
    ]
      .filter(Boolean)
      .join('\n\n');
    await Share.share({ message, title: tr?.title ?? 'Damodar Prayas' });
  }

  if (!id) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>पोस्ट उपलब्ध नहीं है</Text>
          <Pressable style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>वापस जाएँ</Text>
          </Pressable>
        </View>
        <Modal
          visible={Boolean(viewerUrl)}
          transparent
          animationType="fade"
          onRequestClose={() => setViewerUrl(null)}
        >
          <View style={styles.viewerOverlay}>
            <Pressable style={styles.viewerClose} onPress={() => setViewerUrl(null)}>
              <Text style={styles.viewerCloseText}>✕</Text>
            </Pressable>
            {viewerUrl ? (
              <Image source={{ uri: viewerUrl }} style={styles.viewerImage} contentFit="contain" />
            ) : null}
          </View>
        </Modal>
      </SafeAreaView>
    );
  }

  const translation =
    post?.translations.find((item) => item.language === apiLanguage) ?? post?.translations[0];
  const isEvent = post?.category === 'EVENT';
  const isAdvertisement = post?.category === 'ADVERTISEMENT';
  const isObituary = post?.category === 'OBITUARY';
  const categoryLabel = isEvent
    ? 'कार्यक्रम'
    : isAdvertisement
      ? 'विज्ञापन'
      : isObituary
        ? 'शोक सूचना'
        : 'समाचार';
  const topTitle = isEvent
    ? 'कार्यक्रम विवरण'
    : isAdvertisement
      ? 'विज्ञापन विवरण'
      : isObituary
        ? 'शोक सूचना'
        : 'समाचार विवरण';
  const categoryIcon = isEvent
    ? ({ ios: 'calendar.badge.clock', android: 'event', web: 'event' } as const)
    : isAdvertisement
      ? ({ ios: 'megaphone.fill', android: 'campaign', web: 'campaign' } as const)
      : isObituary
        ? ({ ios: 'flame.fill', android: 'local_florist', web: 'local_florist' } as const)
        : ({ ios: 'newspaper.fill', android: 'newspaper', web: 'newspaper' } as const);
  const categoryTint = isEvent
    ? C.gold
    : isAdvertisement
      ? C.green
      : isObituary
        ? C.muted
        : C.maroon;
  const eventDate = formatDate(post?.eventDate ?? null);
  const publishedDate = formatDate(post?.postDate ?? post?.publishedAt ?? post?.createdAt ?? null);

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
        <Text style={styles.topTitle}>{topTitle}</Text>
        <View style={styles.topSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centerState}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.stateTitle}>जानकारी लोड हो रही है...</Text>
        </View>
      ) : isError || !post ? (
        <View style={styles.centerState}>
          <SymbolView
            name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
            tintColor={C.maroon}
            size={43}
          />
          <Text style={styles.stateTitle}>जानकारी उपलब्ध नहीं है</Text>
          <Text style={styles.stateText}>पोस्ट हटाई गई हो सकती है या API से लोड नहीं हो पाई।</Text>
          <Pressable style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>फिर से कोशिश करें</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {post.bannerUrl ? (
            <Pressable onPress={() => setViewerUrl(post.bannerUrl)}>
              <Image
                source={{ uri: post.bannerUrl }}
                style={styles.banner}
                contentFit="cover"
                transition={180}
              />
            </Pressable>
          ) : (
            <View
              style={[
                styles.bannerPlaceholder,
                isEvent
                  ? styles.eventPlaceholder
                  : isAdvertisement
                    ? styles.adPlaceholder
                    : styles.newsPlaceholder,
              ]}
            >
              <SymbolView name={categoryIcon} tintColor={categoryTint} size={54} />
            </View>
          )}

          <View style={styles.articleCard}>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.categoryPill,
                  isEvent ? styles.eventPill : isAdvertisement ? styles.adPill : styles.newsPill,
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isEvent ? styles.eventText : isAdvertisement ? styles.adText : styles.newsText,
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
                  <Text style={styles.featuredText}>मुख्य</Text>
                </View>
              ) : null}
            </View>

            {isObituary && post.deceasedName ? (
              <Text style={styles.obituaryName}>स्व. {post.deceasedName}</Text>
            ) : null}
            <Text style={styles.title}>{translation?.title ?? 'विवरण उपलब्ध नहीं'}</Text>
            {isObituary ? (
              <View style={styles.obituaryMeta}>
                {post.obituaryType ? (
                  <Text style={styles.obituaryType}>
                    {
                      (
                        {
                          DEATH_NOTICE: 'निधन सूचना',
                          UTHAWNA: 'उठावना',
                          CHAUTHA: 'चौथा',
                          TRIBUTE: 'श्रद्धांजलि सभा',
                          OTHER: 'अन्य शोक कार्यक्रम',
                        } as const
                      )[post.obituaryType]
                    }
                  </Text>
                ) : null}
                {post.deathDate ? (
                  <Text style={styles.obituaryLine}>निधन: {formatDate(post.deathDate)}</Text>
                ) : null}
                {post.eventDate ? (
                  <Text style={styles.obituaryLine}>
                    कार्यक्रम: {formatDate(post.eventDate)}
                    {post.eventTime ? ` • ${post.eventTime}` : ''}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <View style={styles.infoStack}>
              {isEvent && eventDate ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <SymbolView
                      name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
                      tintColor={C.maroon}
                      size={17}
                    />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>कार्यक्रम की तारीख</Text>
                    <Text style={styles.infoValue}>{eventDate}</Text>
                  </View>
                </View>
              ) : null}

              {location ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <SymbolView
                      name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                      tintColor={C.green}
                      size={17}
                    />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>स्थान</Text>
                    <Text style={styles.infoValue}>{location}</Text>
                  </View>
                </View>
              ) : null}

              {!isEvent && publishedDate ? (
                <View style={styles.infoRow}>
                  <View style={styles.infoIconWrap}>
                    <SymbolView
                      name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }}
                      tintColor={C.gold}
                      size={17}
                    />
                  </View>
                  <View style={styles.infoCopy}>
                    <Text style={styles.infoLabel}>
                      {post.postDate ? text('तारीख', 'Date') : text('प्रकाशित', 'Published')}
                    </Text>
                    <Text style={styles.infoValue}>{publishedDate}</Text>
                  </View>
                </View>
              ) : null}
            </View>

            {translation?.details ? (
              <Text style={styles.details}>{translation.details}</Text>
            ) : null}

            <View style={styles.socialRow}>
              {!isAdvertisement ? (
                <Pressable
                  disabled={likeBusy}
                  style={[styles.socialButton, myLike?.isLiked && styles.socialButtonActive]}
                  onPress={() => void toggleLike()}
                >
                  <Text style={[styles.socialIcon, myLike?.isLiked && styles.socialTextActive]}>
                    {myLike?.isLiked ? '♥' : '♡'}
                  </Text>
                  <Text style={[styles.socialText, myLike?.isLiked && styles.socialTextActive]}>
                    {likesData?.likeCount ?? 0} Like
                  </Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.socialButton} onPress={() => void sharePost()}>
                <Text style={styles.socialIcon}>↗</Text>
                <Text style={styles.socialText}>Share</Text>
              </Pressable>
            </View>
          </View>

          {post.contactName || post.contactPhone ? (
            <View style={styles.contactCard}>
              <View style={styles.contactTitleRow}>
                <SymbolView
                  name={{
                    ios: 'person.crop.circle.fill',
                    android: 'contact_phone',
                    web: 'contact_phone',
                  }}
                  tintColor={C.maroon}
                  size={22}
                />
                <Text style={styles.contactTitle}>संपर्क</Text>
              </View>
              {post.contactName ? <Text style={styles.contactName}>{post.contactName}</Text> : null}
              {post.contactPhone ? (
                <Pressable
                  style={styles.phoneButton}
                  onPress={() => void Linking.openURL(`tel:${post.contactPhone}`)}
                >
                  <SymbolView
                    name={{ ios: 'phone.fill', android: 'call', web: 'call' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
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
