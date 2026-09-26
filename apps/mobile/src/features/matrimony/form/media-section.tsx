import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { C, styles } from '@/styles/matrimony-form.styles';
import { Section } from './form-controls';
import type { useMatrimonyForm } from './use-matrimony-form';
const mediaStatusLabel = {
  PENDING: 'समीक्षा में',
  APPROVED: 'स्वीकृत',
  REJECTED: 'अस्वीकृत',
} as const;

type MediaProps = Pick<
  ReturnType<typeof useMatrimonyForm>,
  | 'profileId'
  | 'editingProfile'
  | 'mediaBusy'
  | 'editingLocked'
  | 'pickAndUploadPhoto'
  | 'pickAndUploadKundali'
  | 'makePrimary'
  | 'confirmDeletePhoto'
  | 'confirmDeleteKundali'
>;
export function MediaSection({
  profileId,
  editingProfile,
  mediaBusy,
  editingLocked,
  pickAndUploadPhoto,
  pickAndUploadKundali,
  makePrimary,
  confirmDeletePhoto,
  confirmDeleteKundali,
}: MediaProps) {
  return (
    <Section
      title="5. फोटो और कुंडली"
      subtitle={
        profileId
          ? 'अधिकतम 6 फोटो जोड़ें। पहली फोटो अपने आप मुख्य फोटो बनती है। कुंडली optional है।'
          : 'इस सेक्शन को खोलने के लिए पहले ड्राफ्ट सेव करें।'
      }
    >
      {!profileId ? (
        <View style={styles.mediaLockedCard}>
          <SymbolView
            name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
            tintColor={C.amber}
            size={20}
          />
          <Text style={styles.mediaLockedText}>
            ड्राफ्ट सेव होते ही profile ID बनेगी, फिर फोटो और कुंडली upload कर पाएँगे।
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.mediaHeaderRow}>
            <Text style={styles.mediaTitle}>
              प्रोफाइल फोटो ({editingProfile?.photos.length ?? 0}/6)
            </Text>
            {(editingProfile?.photos.length ?? 0) < 6 ? (
              <Pressable
                disabled={mediaBusy || editingLocked}
                style={[
                  styles.mediaAddButton,
                  (mediaBusy || editingLocked) && styles.disabledButton,
                ]}
                onPress={pickAndUploadPhoto}
              >
                <SymbolView
                  name={{
                    ios: 'photo.badge.plus',
                    android: 'add_photo_alternate',
                    web: 'add_photo_alternate',
                  }}
                  tintColor="#FFFFFF"
                  size={16}
                />
                <Text style={styles.mediaAddText}>फोटो जोड़ें</Text>
              </Pressable>
            ) : null}
          </View>

          {(editingProfile?.photos.length ?? 0) === 0 ? (
            <View style={styles.emptyMedia}>
              <SymbolView
                name={{
                  ios: 'photo.on.rectangle.angled',
                  android: 'photo_library',
                  web: 'photo_library',
                }}
                tintColor="#B69B8B"
                size={30}
              />
              <Text style={styles.emptyMediaText}>
                अभी कोई फोटो नहीं है। समीक्षा के लिए कम से कम 1 फोटो जरूरी होगी।
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {editingProfile?.photos.map((photo) => (
                <View key={photo.id} style={styles.photoCard}>
                  <Image source={{ uri: photo.url }} style={styles.photoImage} contentFit="cover" />
                  <View style={styles.photoInfo}>
                    <View style={styles.photoStatusRow}>
                      <Text style={styles.photoStatus}>{mediaStatusLabel[photo.status]}</Text>
                      {photo.isPrimary ? <Text style={styles.primaryPill}>मुख्य</Text> : null}
                    </View>
                    <View style={styles.photoActions}>
                      {!photo.isPrimary ? (
                        <Pressable
                          disabled={mediaBusy || editingLocked}
                          onPress={() => makePrimary(photo.id)}
                        >
                          <Text style={styles.photoActionText}>मुख्य बनाएँ</Text>
                        </Pressable>
                      ) : (
                        <View />
                      )}
                      <Pressable
                        disabled={mediaBusy || editingLocked}
                        onPress={() => confirmDeletePhoto(photo.id)}
                      >
                        <Text style={styles.deleteActionText}>हटाएँ</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />
          <View style={styles.mediaHeaderRow}>
            <View style={styles.mediaCopy}>
              <Text style={styles.mediaTitle}>कुंडली</Text>
              <Text style={styles.mediaHint}>PDF या image, अधिकतम 10MB</Text>
            </View>
            {(editingProfile?.kundalis.length ?? 0) === 0 ? (
              <Pressable
                disabled={mediaBusy || editingLocked}
                style={[
                  styles.kundaliButton,
                  (mediaBusy || editingLocked) && styles.disabledButton,
                ]}
                onPress={pickAndUploadKundali}
              >
                <SymbolView
                  name={{ ios: 'doc.badge.plus', android: 'upload_file', web: 'upload_file' }}
                  tintColor={C.maroon}
                  size={16}
                />
                <Text style={styles.kundaliButtonText}>कुंडली जोड़ें</Text>
              </Pressable>
            ) : null}
          </View>

          {editingProfile?.kundalis[0] ? (
            <View style={styles.kundaliCard}>
              <View style={styles.kundaliIcon}>
                <SymbolView
                  name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
                  tintColor={C.maroon}
                  size={24}
                />
              </View>
              <View style={styles.kundaliCopy}>
                <Text style={styles.kundaliName} numberOfLines={1}>
                  {editingProfile.kundalis[0].fileName || 'कुंडली दस्तावेज'}
                </Text>
                <Text style={styles.kundaliStatus}>
                  {mediaStatusLabel[editingProfile.kundalis[0].status]}
                </Text>
              </View>
              <Pressable
                disabled={mediaBusy || editingLocked}
                onPress={() => confirmDeleteKundali(editingProfile.kundalis[0].id)}
              >
                <Text style={styles.deleteActionText}>हटाएँ</Text>
              </Pressable>
            </View>
          ) : null}

          {mediaBusy ? (
            <View style={styles.mediaProgress}>
              <ActivityIndicator color={C.maroon} size="small" />
              <Text style={styles.mediaProgressText}>फाइल प्रोसेस हो रही है...</Text>
            </View>
          ) : null}
        </>
      )}
    </Section>
  );
}
