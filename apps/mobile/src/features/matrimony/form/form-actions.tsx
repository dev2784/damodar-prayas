import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { C, styles } from '@/styles/matrimony-form.styles';
import type { useMatrimonyForm } from './use-matrimony-form';
type ActionProps = Pick<
  ReturnType<typeof useMatrimonyForm>,
  'profileId' | 'editingApproved' | 'busy' | 'editingLocked' | 'mediaBusy' | 'save'
>;
export function FormActions({
  profileId,
  editingApproved,
  busy,
  editingLocked,
  mediaBusy,
  save,
}: ActionProps) {
  return (
    <View style={styles.actionsCard}>
      {editingApproved ? (
        <Pressable
          disabled={busy || editingLocked || mediaBusy}
          style={[
            styles.submitButton,
            (busy || editingLocked || mediaBusy) && styles.disabledButton,
          ]}
          onPress={() => save(false)}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <SymbolView
                name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                tintColor="#FFFFFF"
                size={16}
              />
              <Text style={styles.submitButtonText}>बदलाव सेव करके समीक्षा में भेजें</Text>
            </>
          )}
        </Pressable>
      ) : (
        <>
          <Pressable
            disabled={busy || editingLocked}
            style={[styles.draftButton, (busy || editingLocked) && styles.disabledButton]}
            onPress={() => save(false)}
          >
            {busy ? (
              <ActivityIndicator color={C.maroon} size="small" />
            ) : (
              <>
                <SymbolView
                  name={{ ios: 'square.and.arrow.down', android: 'save', web: 'save' }}
                  tintColor={C.maroon}
                  size={17}
                />
                <Text style={styles.draftButtonText}>
                  {profileId ? 'ड्राफ्ट अपडेट करें' : 'ड्राफ्ट सेव करके फोटो जोड़ें'}
                </Text>
              </>
            )}
          </Pressable>
          {profileId ? (
            <Pressable
              disabled={busy || editingLocked || mediaBusy}
              style={[
                styles.submitButton,
                (busy || editingLocked || mediaBusy) && styles.disabledButton,
              ]}
              onPress={() => save(true)}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <SymbolView
                    name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }}
                    tintColor="#FFFFFF"
                    size={16}
                  />
                  <Text style={styles.submitButtonText}>सेव करके समीक्षा में भेजें</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}
