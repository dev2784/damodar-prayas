import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAppSelector } from '@/store/hooks';
import { useRegisterPushTokenMutation } from '@/services/push-api';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false})});

export function PushNotifications() {
 const accessToken=useAppSelector(s=>s.auth.accessToken);
 const [registerToken]=useRegisterPushTokenMutation();
 useEffect(()=>{if(!accessToken||!Device.isDevice)return; void (async()=>{
   const current=await Notifications.getPermissionsAsync();
   let status=current.status;
   if(status!=='granted')status=(await Notifications.requestPermissionsAsync()).status;
   if(status!=='granted')return;
   if(Platform.OS==='android')await Notifications.setNotificationChannelAsync('default',{name:'Damodar Prayas',importance:Notifications.AndroidImportance.HIGH});
   const projectId=Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
   if(!projectId)return;
   const token=(await Notifications.getExpoPushTokenAsync({projectId})).data;
   await registerToken({token,platform:Platform.OS}).unwrap();
 })();},[accessToken,registerToken]);
 useEffect(()=>Notifications.addNotificationResponseReceivedListener(response=>{
   const d=response.notification.request.content.data as Record<string,unknown>;
   if(d.type==='OBITUARY'&&typeof d.postId==='string')router.push({pathname:'/community-post',params:{id:d.postId}});
   else if((d.type==='INTEREST_RECEIVED'||d.type==='INTEREST_ACCEPTED')&&typeof d.profileId==='string')router.push({pathname:'/matrimony-profile',params:{id:d.profileId}});
 }).remove,[]);
 return null;
}
