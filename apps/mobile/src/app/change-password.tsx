import { s } from '@/styles/change-password.styles';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { router, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChangePasswordMutation } from '@/services/auth-api';
import { isValidNewPassword } from '@/lib/password';
import { useAppSelector } from '@/store/hooks';

export default function ChangePasswordScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  async function save() {
    if (newPassword !== confirm)
      return Alert.alert(
        'Password match नहीं हुआ',
        'New password और confirm password एक जैसे रखें।',
      );
    if (!isValidNewPassword(newPassword))
      return Alert.alert('Password छोटा है', 'कम से कम 8 characters और letter + number रखें।');
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      Alert.alert('Password updated', 'आपका password बदल गया है।', [
        { text: 'ठीक है', onPress: () => router.back() },
      ]);
    } catch (e: unknown) {
      const data = typeof e === 'object' && e && 'data' in e ? e.data : null;
      const message =
        typeof data === 'object' && data && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Current password check करें और फिर try करें।';
      Alert.alert('Password update नहीं हुआ', message);
    }
  }
  if (!hydrated) return null;
  if (!accessToken)
    return <Redirect href={{ pathname: '/auth', params: { next: '/change-password' } }} />;
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.wrap}>
        <Pressable onPress={() => router.back()}>
          <Text style={s.back}>‹ वापस</Text>
        </Pressable>
        <Text style={s.title}>Password बदलें</Text>
        <Text style={s.sub}>
          Temporary password से login किया है तो यहाँ अपना नया private password set करें।
        </Text>
        <View style={s.card}>
          <Text style={s.label}>Current / Temporary password</Text>
          <TextInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
            style={s.input}
          />
          <Text style={s.label}>New password</Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            style={s.input}
          />
          <Text style={s.label}>Confirm new password</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            style={s.input}
          />
          <Text style={s.hint}>कम से कम 8 characters, एक letter और एक number.</Text>
          <Pressable
            disabled={isLoading || !currentPassword || !newPassword || !confirm}
            style={[
              s.button,
              (isLoading || !currentPassword || !newPassword || !confirm) && s.disabled,
            ]}
            onPress={() => void save()}
          >
            <Text style={s.buttonText}>{isLoading ? 'Updating…' : 'Update Password'}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
