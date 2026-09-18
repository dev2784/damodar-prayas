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
      console.log('[push] registration start');
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
      console.log('[push] permission', status);
      if (status !== 'granted') return;
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Damodar Prayas',
          importance: Notifications.AndroidImportance.HIGH,
        });
      }
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      console.log('[push] projectId', projectId ? 'found' : 'missing');
      if (!projectId) return;
      try {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[push] expo token generated');
        await registerToken({ token, platform: Platform.OS }).unwrap();
        console.log('[push] backend registration success');
      } catch (error) {
        console.error('[push] token/backend registration failed', error);
        return;
      }

      responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const d = response.notification.request.content.data as Record<string, unknown>;
        if (d.type === 'OBITUARY' && typeof d.postId === 'string') {
          router.push({ pathname: '/community-post', params: { id: d.postId } });
        } else if ((d.type === 'INTEREST_RECEIVED' || d.type === 'INTEREST_ACCEPTED') && typeof d.profileId === 'string') {
          router.push({ pathname: '/matrimony-profile', params: { id: d.profileId } });
        }
      });
    })();

    return () => responseSubscription?.remove();
  }, [accessToken, registerToken]);

  return null;
}
