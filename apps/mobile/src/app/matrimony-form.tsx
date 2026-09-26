import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';
import { C, styles } from '@/styles/matrimony-form.styles';
import { useMatrimonyForm } from '@/features/matrimony/form/use-matrimony-form';
import { MediaSection } from '@/features/matrimony/form/media-section';
import { FormActions } from '@/features/matrimony/form/form-actions';
import { BasicDetailsSection } from '@/features/matrimony/form/basic-details-section';
import { ContactWorkSection } from '@/features/matrimony/form/contact-work-section';
import { LocationBirthSection } from '@/features/matrimony/form/location-birth-section';
import { FamilySection } from '@/features/matrimony/form/family-section';

export default function MatrimonyFormScreen() {
  const controller = useMatrimonyForm();
  const { accessToken, profileId, isLoadingMine, editingProfile, editingLocked, form, update } =
    controller;
  if (!accessToken) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <SymbolView
            name={{ ios: 'person.badge.key.fill', android: 'login', web: 'login' }}
            tintColor={C.maroon}
            size={46}
          />
          <Text style={styles.centerTitle}>पहले लॉगिन करें</Text>
          <Text style={styles.centerText}>
            मैट्रिमोनी ड्राफ्ट निजी डेटा है, इसलिए इसे बनाने या एडिट करने के लिए लॉगिन जरूरी है।
          </Text>
          <Pressable style={styles.centerButton} onPress={() => router.replace('/profile')}>
            <Text style={styles.centerButtonText}>प्रोफाइल / लॉगिन</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (profileId && isLoadingMine && !editingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <ActivityIndicator color={C.maroon} size="large" />
          <Text style={styles.centerTitle}>प्रोफाइल लोड हो रहा है...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (profileId && !isLoadingMine && !editingProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.centerTitle}>प्रोफाइल नहीं मिला</Text>
          <Text style={styles.centerText}>
            यह प्रोफाइल आपके अकाउंट से जुड़ा नहीं है या उपलब्ध नहीं है।
          </Text>
          <Pressable style={styles.centerButton} onPress={() => router.replace('/my-matrimony')}>
            <Text style={styles.centerButtonText}>मेरे प्रोफाइल पर जाएँ</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              tintColor={C.maroon}
              size={22}
            />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MATRIMONY PROFILE</Text>
            <Text style={styles.title}>
              {profileId ? 'प्रोफाइल एडिट करें' : 'नया प्रोफाइल बनाएँ'}
            </Text>
          </View>
        </View>

        {editingLocked ? (
          <View style={styles.lockBanner}>
            <SymbolView
              name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }}
              tintColor={C.maroon}
              size={20}
            />
            <Text style={styles.lockText}>
              यह प्रोफाइल अभी एडिट नहीं किया जा सकता क्योंकि इसकी स्थिति {editingProfile?.status}{' '}
              है।
            </Text>
          </View>
        ) : null}

        <View style={styles.progressBanner}>
          <View style={styles.progressIcon}>
            <SymbolView
              name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }}
              tintColor={C.green}
              size={22}
            />
          </View>
          <View style={styles.progressCopy}>
            <Text style={styles.progressTitle}>
              {profileId ? 'जानकारी, फोटो और कुंडली पूरी करें' : 'पहले जरूरी जानकारी भरें'}
            </Text>
            <Text style={styles.progressText}>
              {profileId
                ? 'फोटो जोड़कर तैयार होने पर समीक्षा के लिए भेजें।'
                : 'पहले ड्राफ्ट सेव होगा, फिर इसी फॉर्म में फोटो और कुंडली जोड़ सकेंगे।'}
            </Text>
          </View>
        </View>

        <BasicDetailsSection form={form} update={update} profileId={profileId} />
        <ContactWorkSection form={form} update={update} />
        <LocationBirthSection form={form} update={update} />
        <FamilySection form={form} update={update} />
        <MediaSection {...controller} />
        <FormActions {...controller} />
      </ScrollView>
    </SafeAreaView>
  );
}
