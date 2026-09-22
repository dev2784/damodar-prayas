import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { useRegisterPushTokenMutation } from '@/services/push-api';

const isExpoGo = Constants.appOwnership === 'expo';

export function PushNotifications() {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const [registerToken] = useRegisterPushTokenMutation();

  useEffect(() => {
    if (isExpoGo || !accessToken || !Device.isDevice) return;
    let responseSubscription: { remove: () => void } | undefined;

    void (async () => {
      const Notifications = await import('expo-notifications');
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      const current = await Notifications.getPermissionsAsync();
      let status = current.status;
      if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
      if (status !== 'granted') return;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Damodar Prayas',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) return;
      try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await registerToken({ token, platform: Platform.OS }).unwrap();
      } catch {
        return;
      }

      const navigateFromNotification = (d: Record<string, unknown>) => {
        if (d.type === 'OBITUARY' && typeof d.postId === 'string') {
          router.push({ pathname: '/community-post', params: { id: d.postId } });
        } else if ((d.type === 'INTEREST_RECEIVED' || d.type === 'INTEREST_ACCEPTED') && typeof d.profileId === 'string') {
          router.push({ pathname: '/matrimony-profile', params: { id: d.profileId } });
        }
      };

      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        navigateFromNotification(response.notification.request.content.data as Record<string, unknown>);
      });

      const initialResponse = await Notifications.getLastNotificationResponseAsync();
      if (initialResponse) {
        navigateFromNotification(initialResponse.notification.request.content.data as Record<string, unknown>);
      }
    })();

    return () => responseSubscription?.remove();
  }, [accessToken, registerToken]);

  return null;
}
