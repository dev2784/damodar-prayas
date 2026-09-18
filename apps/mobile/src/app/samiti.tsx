import { C, styles } from '@/styles/samiti.styles';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLanguageText } from '@/hooks/use-language-text';
import { type Committee, useGetCommitteesQuery } from '@/services/committee-api';

function CommitteeCard({ committee }: { committee: Committee }) {
  const { text } = useLanguageText();
  const translation = committee.translations[0];
  const location = [committee.city, committee.state].filter(Boolean).join(', ');

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: '/samiti-detail', params: { id: committee.id } })}
    >
      {committee.bannerUrl ? (
        <Image
          source={{ uri: committee.bannerUrl }}
          style={styles.banner}
          contentFit="cover"
          transition={180}
        />
      ) : (
        <View style={styles.bannerPlaceholder}>
          <SymbolView
            name={{
              ios: 'building.columns.fill',
              android: 'account_balance',
              web: 'account_balance',
            }}
            tintColor={C.maroon}
            size={48}
          />
        </View>
      )}

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{translation?.name ?? text('समिति', 'Committee')}</Text>
        {location ? (
          <View style={styles.locationRow}>
            <SymbolView
              name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
              tintColor={C.green}
              size={15}
            />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          {committee.members.length > 0 ? (
            <View style={styles.memberMeta}>
              <SymbolView
                name={{ ios: 'person.3.fill', android: 'groups', web: 'groups' }}
                tintColor={C.gold}
                size={15}
              />
              <Text style={styles.memberMetaText}>{committee.members.length} {text('पदाधिकारी', 'office bearers')}</Text>
            </View>
          ) : (
            <Text style={styles.optionalText}>{text('पदाधिकारी विवरण वैकल्पिक', 'Office bearer details optional')}</Text>
          )}
          <View style={styles.openRow}>
            <Text style={styles.openText}>{text('समिति देखें', 'View committee')}</Text>
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

export default function SamitiScreen() {
  const { text, apiLanguage } = useLanguageText();
  const { data, isLoading, isFetching, isError, refetch } = useGetCommitteesQuery({
    language: apiLanguage,
  });
  const items = data?.items ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CommitteeCard committee={item} />}
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
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>{text('समाज संगठन', 'Community organisation')}</Text>
                <Text style={styles.title}>{text('समितियाँ', 'Committees')}</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => router.push('/samiti-submit')}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  tintColor="#FFFFFF"
                  size={16}
                />
                <Text style={styles.addButtonText}>{text('समिति जोड़ें', 'Add committee')}</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              {text('शहर और राज्य के अनुसार समाज की सक्रिय समितियाँ देखें। पदाधिकारी जोड़ना वैकल्पिक है।', 'View active community committees by city and state. Adding office bearers is optional.')}
            </Text>
            {!isLoading && !isError && items.length > 0 ? (
              <View style={styles.countPill}>
                <Text style={styles.countText}>
                  {data?.pagination.total ?? items.length} {text('समितियाँ', 'committees')}
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={C.maroon} size="large" />
              <Text style={styles.stateTitle}>{text('समितियाँ लोड हो रही हैं...', 'Loading committees...')}</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateCard}>
              <SymbolView
                name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                tintColor={C.maroon}
                size={42}
              />
              <Text style={styles.stateTitle}>{text('समिति जानकारी लोड नहीं हो पाई', 'Could not load committee information')}</Text>
              <Text style={styles.stateText}>{text('इंटरनेट या API कनेक्शन जाँचकर दोबारा कोशिश करें।', 'Check your internet or API connection and try again.')}</Text>
              <Pressable style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryText}>{text('फिर से कोशिश करें', 'Try again')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.stateCard}>
              <SymbolView
                name={{
                  ios: 'building.columns.fill',
                  android: 'account_balance',
                  web: 'account_balance',
                }}
                tintColor={C.gold}
                size={46}
              />
              <Text style={styles.stateTitle}>{text('अभी कोई समिति प्रकाशित नहीं है', 'No committee published yet')}</Text>
              <Text style={styles.stateText}>
                {text('नई समिति जुड़ते ही उसका banner, नाम, शहर और राज्य यहाँ दिखाई देगा।', 'New committee details will appear here after publication.')}
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
