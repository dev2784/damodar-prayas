import { C, styles } from '@/styles/samiti.styles';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Committee, useGetCommitteesQuery } from '@/services/committee-api';

function CommitteeCard({ committee }: { committee: Committee }) {
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
        <Text style={styles.cardTitle}>{translation?.name ?? 'समिति'}</Text>
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
              <Text style={styles.memberMetaText}>{committee.members.length} पदाधिकारी</Text>
            </View>
          ) : (
            <Text style={styles.optionalText}>पदाधिकारी विवरण वैकल्पिक</Text>
          )}
          <View style={styles.openRow}>
            <Text style={styles.openText}>समिति देखें</Text>
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
  const { data, isLoading, isFetching, isError, refetch } = useGetCommitteesQuery({
    language: 'HI',
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
                <Text style={styles.eyebrow}>समाज संगठन</Text>
                <Text style={styles.title}>समितियाँ</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => router.push('/samiti-submit')}>
                <SymbolView
                  name={{ ios: 'plus', android: 'add', web: 'add' }}
                  tintColor="#FFFFFF"
                  size={16}
                />
                <Text style={styles.addButtonText}>समिति जोड़ें</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              शहर और राज्य के अनुसार समाज की सक्रिय समितियाँ देखें। पदाधिकारी जोड़ना वैकल्पिक है।
            </Text>
            {!isLoading && !isError && items.length > 0 ? (
              <View style={styles.countPill}>
                <Text style={styles.countText}>
                  {data?.pagination.total ?? items.length} समितियाँ
                </Text>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={C.maroon} size="large" />
              <Text style={styles.stateTitle}>समितियाँ लोड हो रही हैं...</Text>
            </View>
          ) : isError ? (
            <View style={styles.stateCard}>
              <SymbolView
                name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }}
                tintColor={C.maroon}
                size={42}
              />
              <Text style={styles.stateTitle}>समिति जानकारी लोड नहीं हो पाई</Text>
              <Text style={styles.stateText}>इंटरनेट या API कनेक्शन जाँचकर दोबारा कोशिश करें।</Text>
              <Pressable style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryText}>फिर से कोशिश करें</Text>
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
              <Text style={styles.stateTitle}>अभी कोई समिति प्रकाशित नहीं है</Text>
              <Text style={styles.stateText}>
                नई समिति जुड़ते ही उसका banner, नाम, शहर और राज्य यहाँ दिखाई देगा।
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}
