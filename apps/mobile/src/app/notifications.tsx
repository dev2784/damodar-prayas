import { C, styles } from '@/styles/notifications.styles';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type AppNotification,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/services/notification-api';
import { useAppSelector } from '@/store/hooks';

export default function NotificationsScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const { data, isLoading, isError, refetch } = useGetNotificationsQuery(undefined, {
    skip: !accessToken,
  });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAll] = useMarkAllNotificationsReadMutation();

  async function openItem(item: AppNotification) {
    if (!item.readAt) {
      try {
        await markRead(item.id).unwrap();
      } catch {}
    }
    const receiverProfileId =
      typeof item.data?.receiverProfileId === 'string' ? item.data.receiverProfileId : '';
    if (item.type === 'INTEREST_RECEIVED') {
      router.push('/matrimony-interests');
      return;
    }
    if (item.type === 'INTEREST_ACCEPTED' && receiverProfileId) {
      router.push({ pathname: '/matrimony-profile', params: { id: receiverProfileId } });
      return;
    }
    if (item.type === 'INTEREST_ACCEPTED' || item.type === 'INTEREST_REJECTED') {
      router.push('/matrimony-interests');
    }
  }

  if (!accessToken)
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.title}>Notifications देखने के लिए लॉगिन करें</Text>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <SymbolView
            name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            tintColor={C.maroon}
            size={22}
          />
        </Pressable>
        <View style={styles.flexFill}>
          <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
          <Text style={styles.title}>सूचनाएँ</Text>
        </View>
        {(data?.unreadCount ?? 0) > 0 ? (
          <Pressable onPress={() => void markAll()}>
            <Text style={styles.readAll}>सभी पढ़ें</Text>
          </Pressable>
        ) : null}
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={C.maroon} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.title}>सूचनाएँ लोड नहीं हुईं</Text>
          <Pressable style={styles.retry} onPress={refetch}>
            <Text style={styles.retryText}>फिर कोशिश करें</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {(data?.items.length ?? 0) === 0 ? (
            <View style={styles.center}>
              <SymbolView
                name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
                tintColor="#B99D8C"
                size={44}
              />
              <Text style={styles.empty}>अभी कोई notification नहीं है</Text>
            </View>
          ) : (
            data?.items.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.card, !item.readAt && styles.unreadCard]}
                onPress={() => void openItem(item)}
              >
                <View style={[styles.dot, item.readAt && styles.dotRead]} />
                <View style={styles.flexFill}>
                  <Text style={styles.itemTitle}>{item.titleHi}</Text>
                  {item.bodyHi ? <Text style={styles.itemBody}>{item.bodyHi}</Text> : null}
                  <Text style={styles.time}>
                    {new Date(item.createdAt).toLocaleString('hi-IN')}
                  </Text>
                </View>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  tintColor="#B59D91"
                  size={16}
                />
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
