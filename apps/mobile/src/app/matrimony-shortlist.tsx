import { calculateAge } from '@/lib/profile-format';
import { C, styles } from '@/styles/matrimony-shortlist.styles';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGetShortlistsQuery, useRemoveShortlistMutation } from '@/services/interaction-api';
import type { MatrimonyProfile } from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

function nameOf(profile: MatrimonyProfile) {
  return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' ');
}

export default function MatrimonyShortlistScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data, isLoading, isError, refetch } = useGetShortlistsQuery(undefined, {
    skip: !accessToken,
  });
  const [removeShortlist, { isLoading: removing }] = useRemoveShortlistMutation();

  async function remove(profileId: string) {
    try {
      await removeShortlist(profileId).unwrap();
    } catch {
      Alert.alert('Shortlist अपडेट नहीं हुई', 'कृपया दोबारा कोशिश करें।');
    }
  }

  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.title}>Shortlist देखने के लिए लॉगिन करें</Text>
          <Pressable style={styles.primary} onPress={() => router.push('/profile')}>
            <Text style={styles.primaryText}>लॉगिन पर जाएँ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={C.maroon}
            size={22}
          />
        </Pressable>
        <View style={styles.flexFill}>
          <Text style={styles.eyebrow}>MY MATRIMONY</Text>
          <Text style={styles.title}>मेरी Shortlist</Text>
        </View>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.muted}>Shortlist लोड हो रही है...</Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.title}>Shortlist लोड नहीं हुई</Text>
          <Pressable style={styles.primary} onPress={refetch}>
            <Text style={styles.primaryText}>फिर कोशिश करें</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {(data?.items.length ?? 0) === 0 ? (
            <View style={styles.empty}>
              <SymbolView
                name={{ ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }}
                tintColor="#B99D8C"
                size={44}
              />
              <Text style={styles.title}>अभी कोई profile shortlist नहीं है</Text>
              <Text style={styles.muted}>
                पसंद आने वाली प्रोफाइल को Shortlist करें, वह यहाँ दिखाई देगी।
              </Text>
            </View>
          ) : (
            data?.items.map((item) => {
              const p = item.matrimonyProfile;
              const photo = p.photos[0]?.url;
              return (
                <Pressable
                  key={item.id}
                  style={styles.card}
                  onPress={() =>
                    router.push({ pathname: '/matrimony-profile', params: { id: p.id } })
                  }
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <SymbolView
                        name={{
                          ios: 'person.crop.circle.fill',
                          android: 'account_circle',
                          web: 'account_circle',
                        }}
                        tintColor="#C9B0A2"
                        size={54}
                      />
                    </View>
                  )}
                  <View style={styles.cardBody}>
                    <Text style={styles.name}>
                      {nameOf(p)}, {calculateAge(p.dateOfBirth)}
                    </Text>
                    <Text style={styles.meta}>
                      {[p.currentCity, p.state].filter(Boolean).join(', ') || 'भारत'}
                    </Text>
                    <Text style={styles.meta}>{p.occupation || p.education || 'विवरण देखें'}</Text>
                  </View>
                  <Pressable
                    disabled={removing}
                    style={styles.removeButton}
                    onPress={(event) => {
                      event.stopPropagation();
                      void remove(p.id);
                    }}
                  >
                    <SymbolView
                      name={{
                        ios: 'bookmark.slash.fill',
                        android: 'bookmark_remove',
                        web: 'bookmark_remove',
                      }}
                      tintColor={C.red}
                      size={20}
                    />
                  </Pressable>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
