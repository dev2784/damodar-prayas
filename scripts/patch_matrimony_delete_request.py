from pathlib import Path


def replace(path: str, old: str, new: str, count: int = 1):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f"Pattern not found in {path}: {old[:180]!r}")
    p.write_text(text.replace(old, new, count))


replace('prisma/schema.prisma', '''enum MediaStatus {
  PENDING
  APPROVED
  REJECTED
}
''', '''enum MediaStatus {
  PENDING
  APPROVED
  REJECTED
}

enum MatrimonyDeleteRequestStatus {
  PENDING
  APPROVED
  REJECTED
}
''')
replace('prisma/schema.prisma', '  auditLogs         AuditLog[]           @relation("AuditActor")\n', '  auditLogs         AuditLog[]           @relation("AuditActor")\n  matrimonyDeleteRequests MatrimonyDeleteRequest[]\n')
replace('prisma/schema.prisma', '  reports           ProfileReport[]\n\n  @@index([status, gender, createdAt])\n', '  reports           ProfileReport[]\n  deleteRequests    MatrimonyDeleteRequest[]\n\n  @@index([status, gender, createdAt])\n')
replace('prisma/schema.prisma', 'model PartnerPreference {\n', '''model MatrimonyDeleteRequest {
  id                 String                       @id @default(cuid())
  matrimonyProfileId String
  requestedById      String
  matrimonyProfile   MatrimonyProfile             @relation(fields: [matrimonyProfileId], references: [id], onDelete: Cascade)
  requestedBy        User                         @relation(fields: [requestedById], references: [id], onDelete: Restrict)
  reason             String
  status             MatrimonyDeleteRequestStatus @default(PENDING)
  adminNote          String?
  reviewedAt         DateTime?
  createdAt          DateTime                     @default(now())
  updatedAt          DateTime                     @updatedAt

  @@index([matrimonyProfileId, status, createdAt])
  @@index([requestedById, status, createdAt])
}

model PartnerPreference {
''')

migration = Path('prisma/migrations/20260915_add_matrimony_delete_requests')
migration.mkdir(parents=True, exist_ok=True)
(migration / 'migration.sql').write_text('''CREATE TYPE "MatrimonyDeleteRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "MatrimonyDeleteRequest" (
  "id" TEXT NOT NULL,
  "matrimonyProfileId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "status" "MatrimonyDeleteRequestStatus" NOT NULL DEFAULT 'PENDING',
  "adminNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MatrimonyDeleteRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MatrimonyDeleteRequest_matrimonyProfileId_status_createdAt_idx"
  ON "MatrimonyDeleteRequest"("matrimonyProfileId", "status", "createdAt");
CREATE INDEX "MatrimonyDeleteRequest_requestedById_status_createdAt_idx"
  ON "MatrimonyDeleteRequest"("requestedById", "status", "createdAt");

ALTER TABLE "MatrimonyDeleteRequest"
  ADD CONSTRAINT "MatrimonyDeleteRequest_matrimonyProfileId_fkey"
  FOREIGN KEY ("matrimonyProfileId") REFERENCES "MatrimonyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatrimonyDeleteRequest"
  ADD CONSTRAINT "MatrimonyDeleteRequest_requestedById_fkey"
  FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
''')

replace('apps/api/src/modules/matrimony/schemas.ts', '''export const updateMatrimonyProfileSchema = createMatrimonyProfileSchema.partial().omit({
  profileFor: true,
});
''', '''export const updateMatrimonyProfileSchema = createMatrimonyProfileSchema.partial().omit({
  profileFor: true,
});

export const matrimonyDeleteRequestSchema = z.object({
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(1000),
});
''')

replace('apps/api/src/modules/matrimony/selectors.ts', '''  partnerPreference: true,
} satisfies Prisma.MatrimonyProfileSelect;
''', '''  partnerPreference: true,
  deleteRequests: {
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    take: 1,
    select: {
      id: true,
      reason: true,
      status: true,
      createdAt: true,
    },
  },
} satisfies Prisma.MatrimonyProfileSelect;
''')

replace('apps/api/src/modules/matrimony/routes.ts', '''  createMatrimonyProfileSchema,
  matrimonyListQuerySchema,
  updateMatrimonyProfileSchema,
''', '''  createMatrimonyProfileSchema,
  matrimonyDeleteRequestSchema,
  matrimonyListQuerySchema,
  updateMatrimonyProfileSchema,
''')
replace('apps/api/src/modules/matrimony/routes.ts', '''    if (!['DRAFT', 'REJECTED'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_NOT_EDITABLE',
        status: existing.status,
      });
    }

    const profile = await prisma.matrimonyProfile.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(existing.status === 'REJECTED'
          ? { status: 'DRAFT' as const, rejectionReason: null }
          : {}),
      },
''', '''    if (!['DRAFT', 'REJECTED', 'APPROVED'].includes(existing.status)) {
      return reply.code(409).send({
        error: 'MATRIMONY_PROFILE_NOT_EDITABLE',
        status: existing.status,
      });
    }

    const profile = await prisma.matrimonyProfile.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(existing.status === 'REJECTED'
          ? { status: 'DRAFT' as const, rejectionReason: null }
          : {}),
        ...(existing.status === 'APPROVED'
          ? { status: 'PENDING' as const, rejectionReason: null, approvedAt: null }
          : {}),
      },
''')
replace('apps/api/src/modules/matrimony/routes.ts', "  app.post('/:id/submit', async (request, reply) => {\n", '''  app.post('/:id/delete-request', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const { id } = request.params as { id: string };
    const parsed = matrimonyDeleteRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const profile = await prisma.matrimonyProfile.findFirst({
      where: { id, createdById: userId, deletedAt: null },
      select: { id: true, status: true },
    });
    if (!profile) return reply.code(404).send({ error: 'MATRIMONY_PROFILE_NOT_FOUND' });
    if (!['PENDING', 'APPROVED'].includes(profile.status)) {
      return reply.code(409).send({ error: 'DELETE_REQUEST_NOT_ALLOWED', status: profile.status });
    }

    const existingRequest = await prisma.matrimonyDeleteRequest.findFirst({
      where: { matrimonyProfileId: id, requestedById: userId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    if (existingRequest) {
      return reply.code(409).send({ error: 'DELETE_REQUEST_ALREADY_PENDING', request: existingRequest });
    }

    const deleteRequest = await prisma.matrimonyDeleteRequest.create({
      data: { matrimonyProfileId: id, requestedById: userId, reason: parsed.data.reason },
      select: { id: true, reason: true, status: true, createdAt: true },
    });

    return reply.code(201).send({ request: deleteRequest });
  });

  app.post('/:id/submit', async (request, reply) => {
''')

replace('apps/mobile/src/services/matrimony-api.ts', "export type MatrimonyMediaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';\n", '''export type MatrimonyMediaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MatrimonyDeleteRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MatrimonyDeleteRequest = {
  id: string;
  reason: string;
  status: MatrimonyDeleteRequestStatus;
  createdAt: string;
};
''')
replace('apps/mobile/src/services/matrimony-api.ts', '  kundalis: MatrimonyKundali[];\n};\n', '  kundalis: MatrimonyKundali[];\n  deleteRequests: MatrimonyDeleteRequest[];\n};\n')
replace('apps/mobile/src/services/matrimony-api.ts', '    submitMatrimonyProfile: builder.mutation<OwnerMatrimonyProfileResponse, string>({\n', '''    requestMatrimonyProfileDeletion: builder.mutation<{ request: MatrimonyDeleteRequest }, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/matrimony/${id}/delete-request`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Matrimony', id },
        { type: 'Matrimony', id: 'MINE' },
      ],
    }),
    submitMatrimonyProfile: builder.mutation<OwnerMatrimonyProfileResponse, string>({
''')
replace('apps/mobile/src/services/matrimony-api.ts', '  useDeleteMatrimonyProfileMutation,\n  useSubmitMatrimonyProfileMutation,\n', '  useDeleteMatrimonyProfileMutation,\n  useRequestMatrimonyProfileDeletionMutation,\n  useSubmitMatrimonyProfileMutation,\n')

replace('apps/mobile/src/app/matrimony-form.tsx', '''  const editingLocked = Boolean(
    editingProfile && editingProfile.status !== 'DRAFT' && editingProfile.status !== 'REJECTED',
  );
''', '''  const editingApproved = editingProfile?.status === 'APPROVED';
  const editingLocked = Boolean(
    editingProfile && !['DRAFT', 'REJECTED', 'APPROVED'].includes(editingProfile.status),
  );
''')
replace('apps/mobile/src/app/matrimony-form.tsx', "      Alert.alert('ड्राफ्ट अपडेट हो गया', 'आपकी जानकारी सेव हो गई है।');\n", '''      if (editingApproved) {
        Alert.alert('बदलाव समीक्षा में भेज दिए', 'स्वीकृत प्रोफाइल में बदलाव अब दोबारा समीक्षा के बाद सार्वजनिक होंगे।', [
          { text: 'ठीक है', onPress: () => router.replace('/my-matrimony') },
        ]);
        return;
      }

      Alert.alert('ड्राफ्ट अपडेट हो गया', 'आपकी जानकारी सेव हो गई है।');
''')
old_actions = '''        <View style={styles.actionsCard}>
          <Pressable
            disabled={busy || editingLocked}
            style={[styles.draftButton, (busy || editingLocked) && styles.disabledButton]}
            onPress={() => save(false)}>
            {busy ? <ActivityIndicator color={C.maroon} size="small" /> : (
              <>
                <SymbolView name={{ ios: 'square.and.arrow.down', android: 'save', web: 'save' }} tintColor={C.maroon} size={17} />
                <Text style={styles.draftButtonText}>{profileId ? 'ड्राफ्ट अपडेट करें' : 'ड्राफ्ट सेव करके फोटो जोड़ें'}</Text>
              </>
            )}
          </Pressable>

          {profileId ? (
            <Pressable
              disabled={busy || editingLocked || mediaBusy}
              style={[styles.submitButton, (busy || editingLocked || mediaBusy) && styles.disabledButton]}
              onPress={() => save(true)}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                <>
                  <SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} tintColor="#FFFFFF" size={16} />
                  <Text style={styles.submitButtonText}>सेव करके समीक्षा में भेजें</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </View>
'''
new_actions = '''        <View style={styles.actionsCard}>
          {editingApproved ? (
            <Pressable
              disabled={busy || editingLocked || mediaBusy}
              style={[styles.submitButton, (busy || editingLocked || mediaBusy) && styles.disabledButton]}
              onPress={() => save(false)}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                <>
                  <SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} tintColor="#FFFFFF" size={16} />
                  <Text style={styles.submitButtonText}>बदलाव सेव करके समीक्षा में भेजें</Text>
                </>
              )}
            </Pressable>
          ) : (
            <>
              <Pressable
                disabled={busy || editingLocked}
                style={[styles.draftButton, (busy || editingLocked) && styles.disabledButton]}
                onPress={() => save(false)}>
                {busy ? <ActivityIndicator color={C.maroon} size="small" /> : (
                  <>
                    <SymbolView name={{ ios: 'square.and.arrow.down', android: 'save', web: 'save' }} tintColor={C.maroon} size={17} />
                    <Text style={styles.draftButtonText}>{profileId ? 'ड्राफ्ट अपडेट करें' : 'ड्राफ्ट सेव करके फोटो जोड़ें'}</Text>
                  </>
                )}
              </Pressable>
              {profileId ? (
                <Pressable
                  disabled={busy || editingLocked || mediaBusy}
                  style={[styles.submitButton, (busy || editingLocked || mediaBusy) && styles.disabledButton]}
                  onPress={() => save(true)}>
                  {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : (
                    <>
                      <SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} tintColor="#FFFFFF" size={16} />
                      <Text style={styles.submitButtonText}>सेव करके समीक्षा में भेजें</Text>
                    </>
                  )}
                </Pressable>
              ) : null}
            </>
          )}
        </View>
'''
replace('apps/mobile/src/app/matrimony-form.tsx', old_actions, new_actions)

Path('apps/mobile/src/app/my-matrimony.tsx').write_text(r'''import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  type MatrimonyOwnerProfile,
  type MatrimonyProfileStatus,
  useDeleteMatrimonyProfileMutation,
  useGetMyMatrimonyProfilesQuery,
  useRequestMatrimonyProfileDeletionMutation,
  useSubmitMatrimonyProfileMutation,
} from '@/services/matrimony-api';
import { useAppSelector } from '@/store/hooks';

const C = { bg: '#FFF8ED', paper: '#FFFFFF', maroon: '#A30D1E', maroonDark: '#77101B', gold: '#D99A2B', text: '#2A211D', muted: '#736660', line: '#E9DDD1', green: '#16865C', amber: '#B76A12', red: '#B42318', blue: '#2F62A3' };
const statusMeta: Record<MatrimonyProfileStatus, { label: string; bg: string; color: string }> = {
  DRAFT: { label: 'ड्राफ्ट', bg: '#FFF4DE', color: C.amber }, PENDING: { label: 'समीक्षा में', bg: '#EEF4FF', color: C.blue }, APPROVED: { label: 'स्वीकृत', bg: '#EAF8F0', color: C.green }, REJECTED: { label: 'सुधार आवश्यक', bg: '#FFF0EE', color: C.red }, SUSPENDED: { label: 'रुका हुआ', bg: '#F3F1F0', color: '#685F5A' }, MARRIED: { label: 'विवाह सम्पन्न', bg: '#F8EFFA', color: '#7A3B86' },
};
const profileForLabels: Record<MatrimonyOwnerProfile['profileFor'], string> = { SELF: 'स्वयं के लिए', SON: 'पुत्र के लिए', DAUGHTER: 'पुत्री के लिए', BROTHER: 'भाई के लिए', SISTER: 'बहन के लिए', RELATIVE: 'रिश्तेदार के लिए' };
function nameOf(profile: MatrimonyOwnerProfile) { return [profile.firstName, profile.middleName, profile.lastName].filter(Boolean).join(' '); }

function ProfileCard({ profile, submitting, deleting, requestingDelete, onSubmit, onDelete, onRequestDelete }: { profile: MatrimonyOwnerProfile; submitting: boolean; deleting: boolean; requestingDelete: boolean; onSubmit: (id: string) => void; onDelete: (id: string) => void; onRequestDelete: (profile: MatrimonyOwnerProfile) => void }) {
  const status = statusMeta[profile.status];
  const draftEditable = profile.status === 'DRAFT' || profile.status === 'REJECTED';
  const editable = draftEditable || profile.status === 'APPROVED';
  const activeDeleteRequest = profile.deleteRequests[0];
  const canRequestDelete = profile.status === 'PENDING' || profile.status === 'APPROVED';
  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}><View style={styles.avatar}><SymbolView name={{ ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }} tintColor="#C79D86" size={46} /></View><View style={styles.cardHeading}><Text style={styles.name} numberOfLines={1}>{nameOf(profile)}</Text><Text style={styles.profileFor}>{profileForLabels[profile.profileFor]}</Text></View><View style={[styles.statusBadge, { backgroundColor: status.bg }]}><Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text></View></View>
      <View style={styles.metaRow}><Text style={styles.metaText} numberOfLines={1}>{[profile.currentCity, profile.state].filter(Boolean).join(', ') || 'स्थान अभी नहीं जोड़ा'}</Text><Text style={styles.metaDot}>•</Text><Text style={styles.metaText} numberOfLines={1}>{profile.occupation || profile.education || 'विवरण अधूरा'}</Text></View>
      {profile.status === 'REJECTED' && profile.rejectionReason ? <View style={styles.rejectionBox}><Text style={styles.rejectionTitle}>सुधार का कारण</Text><Text style={styles.rejectionText}>{profile.rejectionReason}</Text></View> : null}
      {profile.status === 'APPROVED' ? <View style={styles.approvedEditNote}><Text style={styles.approvedEditText}>एडिट करने पर बदलाव दोबारा समीक्षा में जाएंगे।</Text></View> : null}
      <View style={styles.cardActions}>
        {editable ? <Pressable style={styles.secondaryButton} onPress={() => router.push({ pathname: '/matrimony-form', params: { id: profile.id } })}><SymbolView name={{ ios: 'pencil', android: 'edit', web: 'edit' }} tintColor={C.maroon} size={16} /><Text style={styles.secondaryButtonText}>एडिट करें</Text></Pressable> : <View style={styles.lockedState}><SymbolView name={{ ios: 'lock.fill', android: 'lock', web: 'lock' }} tintColor="#8B7F78" size={14} /><Text style={styles.lockedText}>अभी एडिट नहीं किया जा सकता</Text></View>}
        {profile.status === 'APPROVED' ? <Pressable style={styles.viewButton} onPress={() => router.push({ pathname: '/matrimony-profile', params: { id: profile.id } })}><SymbolView name={{ ios: 'eye', android: 'visibility', web: 'visibility' }} tintColor={C.green} size={15} /><Text style={styles.viewButtonText}>देखें</Text></Pressable> : null}
        {draftEditable ? <Pressable disabled={submitting} style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={() => onSubmit(profile.id)}>{submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : <><SymbolView name={{ ios: 'paperplane.fill', android: 'send', web: 'send' }} tintColor="#FFFFFF" size={15} /><Text style={styles.primaryButtonText}>स्वीकृति के लिए भेजें</Text></>}</Pressable> : null}
      </View>
      {draftEditable ? <Pressable disabled={deleting} style={[styles.deleteDraftButton, deleting && styles.buttonDisabled]} onPress={() => onDelete(profile.id)}>{deleting ? <ActivityIndicator color={C.red} size="small" /> : <><SymbolView name={{ ios: 'trash', android: 'delete_outline', web: 'delete_outline' }} tintColor={C.red} size={15} /><Text style={styles.deleteDraftText}>यह ड्राफ्ट हटाएँ</Text></>}</Pressable> : canRequestDelete ? activeDeleteRequest ? <View style={styles.deletePendingBox}><SymbolView name={{ ios: 'clock.fill', android: 'schedule', web: 'schedule' }} tintColor={C.amber} size={15} /><View style={{ flex: 1 }}><Text style={styles.deletePendingTitle}>प्रोफाइल हटाने का अनुरोध भेजा गया है</Text><Text style={styles.deletePendingText} numberOfLines={2}>{activeDeleteRequest.reason}</Text></View></View> : <Pressable disabled={requestingDelete} style={[styles.deleteRequestButton, requestingDelete && styles.buttonDisabled]} onPress={() => onRequestDelete(profile)}>{requestingDelete ? <ActivityIndicator color={C.red} size="small" /> : <><SymbolView name={{ ios: 'trash.slash', android: 'delete_forever', web: 'delete_forever' }} tintColor={C.red} size={15} /><Text style={styles.deleteRequestText}>प्रोफाइल हटाने का अनुरोध</Text></>}</Pressable> : null}
    </View>
  );
}

export default function MyMatrimonyScreen() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [requestingDeleteId, setRequestingDeleteId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MatrimonyOwnerProfile | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const { data, isLoading, isFetching, isError, refetch } = useGetMyMatrimonyProfilesQuery(undefined, { skip: !accessToken });
  const [submitProfile] = useSubmitMatrimonyProfileMutation();
  const [deleteProfile] = useDeleteMatrimonyProfileMutation();
  const [requestDeletion] = useRequestMatrimonyProfileDeletionMutation();

  function handleDelete(id: string) { Alert.alert('ड्राफ्ट हटाएँ?', 'यह अधूरा मैट्रिमोनी ड्राफ्ट आपकी सूची से हट जाएगा।', [{ text: 'रहने दें', style: 'cancel' }, { text: 'हटाएँ', style: 'destructive', onPress: async () => { try { setDeletingId(id); await deleteProfile(id).unwrap(); } catch { Alert.alert('ड्राफ्ट नहीं हटा', 'कृपया दोबारा कोशिश करें।'); } finally { setDeletingId(null); } } }]); }
  function openDeleteRequest(profile: MatrimonyOwnerProfile) { setDeleteTarget(profile); setDeleteReason(''); }
  async function submitDeleteRequest() { if (!deleteTarget) return; const reason = deleteReason.trim(); if (reason.length < 10) { Alert.alert('कारण लिखें', 'प्रोफाइल हटाने का कारण कम से कम 10 अक्षरों में लिखें।'); return; } try { setRequestingDeleteId(deleteTarget.id); await requestDeletion({ id: deleteTarget.id, reason }).unwrap(); setDeleteTarget(null); setDeleteReason(''); Alert.alert('अनुरोध भेज दिया', 'एडमिन समीक्षा के बाद प्रोफाइल हटाने की कार्रवाई करेगा।'); } catch (error) { const code = typeof error === 'object' && error && 'data' in error ? String((error as { data?: { error?: string } }).data?.error ?? '') : ''; Alert.alert('अनुरोध नहीं भेजा', code === 'DELETE_REQUEST_ALREADY_PENDING' ? 'इस प्रोफाइल का deletion request पहले से pending है।' : 'कृपया दोबारा कोशिश करें।'); } finally { setRequestingDeleteId(null); } }
  function handleSubmit(id: string) { Alert.alert('प्रोफाइल भेजें?', 'भेजने के बाद प्रोफाइल समीक्षा में चली जाएगी और स्वीकृति तक एडिट नहीं होगी।', [{ text: 'अभी नहीं', style: 'cancel' }, { text: 'भेजें', onPress: async () => { try { setSubmittingId(id); await submitProfile(id).unwrap(); Alert.alert('भेज दिया', 'प्रोफाइल अब समिति की समीक्षा में है।'); } catch { Alert.alert('सबमिट नहीं हुआ', 'कृपया दोबारा कोशिश करें।'); } finally { setSubmittingId(null); } } }]); }

  if (!accessToken) return <SafeAreaView style={styles.safeArea}><View style={styles.authState}><View style={styles.authIcon}><SymbolView name={{ ios: 'person.badge.key.fill', android: 'login', web: 'login' }} tintColor={C.maroon} size={44} /></View><Text style={styles.authTitle}>मैट्रिमोनी प्रोफाइल के लिए लॉगिन जरूरी है</Text><Text style={styles.authText}>आपकी ड्राफ्ट, संपर्क जानकारी और प्रोफाइल की स्थिति निजी रहती है, इसलिए पहले अपना अकाउंट सत्यापित करें।</Text><Pressable style={styles.loginButton} onPress={() => router.push('/profile')}><Text style={styles.loginButtonText}>प्रोफाइल / लॉगिन पर जाएँ</Text></Pressable><Pressable onPress={() => router.back()}><Text style={styles.backLink}>वापस मैट्रिमोनी देखें</Text></Pressable></View></SafeAreaView>;

  return <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}><Pressable style={styles.iconButton} onPress={() => router.back()}><SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={C.maroon} size={22} /></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>MY MATRIMONY</Text><Text style={styles.title}>मेरे मैट्रिमोनी प्रोफाइल</Text></View><Pressable style={styles.addButton} onPress={() => router.push({ pathname: '/matrimony-form', params: { newProfile: '1' } })}><SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor="#FFFFFF" size={18} /></Pressable></View>
      <View style={styles.infoBanner}><SymbolView name={{ ios: 'shield.checkered', android: 'verified_user', web: 'verified_user' }} tintColor={C.green} size={22} /><View style={styles.infoCopy}><Text style={styles.infoTitle}>आप नियंत्रण में हैं</Text><Text style={styles.infoText}>ड्राफ्ट सीधे हट सकता है। Submitted/approved प्रोफाइल हटाने के लिए admin request जाएगी।</Text></View></View>
      {isLoading ? <View style={styles.stateBox}><ActivityIndicator color={C.maroon} size="large" /><Text style={styles.stateTitle}>आपके प्रोफाइल लोड हो रहे हैं...</Text></View> : isError ? <View style={styles.stateBox}><SymbolView name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} tintColor={C.maroon} size={38} /><Text style={styles.stateTitle}>प्रोफाइल लोड नहीं हो पाए</Text><Pressable style={styles.retryButton} onPress={refetch}><Text style={styles.retryText}>फिर से कोशिश करें</Text></Pressable></View> : (data?.items.length ?? 0) === 0 ? <View style={styles.emptyCard}><View style={styles.emptyIcon}><SymbolView name={{ ios: 'heart.text.square.fill', android: 'favorite', web: 'favorite' }} tintColor={C.maroon} size={40} /></View><Text style={styles.emptyTitle}>पहला मैट्रिमोनी प्रोफाइल बनाएँ</Text><Text style={styles.emptyText}>बेसिक जानकारी भरकर ड्राफ्ट सेव करें। फोटो और बाकी विवरण अगले चरणों में जोड़ सकते हैं।</Text><Pressable style={styles.createButton} onPress={() => router.push({ pathname: '/matrimony-form', params: { newProfile: '1' } })}><Text style={styles.createButtonText}>नया प्रोफाइल बनाएँ</Text></Pressable></View> : <View style={styles.listBlock}><View style={styles.sectionHeadingRow}><Text style={styles.sectionTitle}>{data?.items.length ?? 0} प्रोफाइल</Text>{isFetching ? <ActivityIndicator color={C.maroon} size="small" /> : null}</View>{data?.items.map((profile) => <ProfileCard key={profile.id} profile={profile} submitting={submittingId === profile.id} deleting={deletingId === profile.id} requestingDelete={requestingDeleteId === profile.id} onSubmit={handleSubmit} onDelete={handleDelete} onRequestDelete={openDeleteRequest} />)}</View>}
    </ScrollView>
    <Modal visible={Boolean(deleteTarget)} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalIcon}><SymbolView name={{ ios: 'trash.slash.fill', android: 'delete_forever', web: 'delete_forever' }} tintColor={C.red} size={26} /></View><Text style={styles.modalTitle}>प्रोफाइल हटाने का अनुरोध</Text><Text style={styles.modalText}>{deleteTarget ? `${nameOf(deleteTarget)} को हटाने का कारण बताइए। Admin review के बाद profile delete होगी।` : ''}</Text><TextInput value={deleteReason} onChangeText={setDeleteReason} placeholder="उदाहरण: विवाह तय हो गया है / अब प्रोफाइल की आवश्यकता नहीं है" placeholderTextColor="#A69A94" multiline maxLength={1000} style={styles.reasonInput} /><Text style={styles.reasonCount}>{deleteReason.trim().length}/1000</Text><View style={styles.modalActions}><Pressable disabled={requestingDeleteId !== null} style={styles.modalCancel} onPress={() => { setDeleteTarget(null); setDeleteReason(''); }}><Text style={styles.modalCancelText}>रद्द करें</Text></Pressable><Pressable disabled={requestingDeleteId !== null} style={[styles.modalSubmit, requestingDeleteId !== null && styles.buttonDisabled]} onPress={submitDeleteRequest}>{requestingDeleteId ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.modalSubmitText}>अनुरोध भेजें</Text>}</Pressable></View></View></View></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg }, content: { padding: 16, paddingBottom: 110 }, headerRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 14 }, iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.line }, headerCopy: { flex: 1 }, eyebrow: { color: C.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, title: { color: C.maroonDark, fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 2 }, addButton: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.maroon },
  infoBanner: { flexDirection: 'row', gap: 10, padding: 13, borderRadius: 15, backgroundColor: '#F2FBF6', borderWidth: 1, borderColor: '#CFEBDD', marginBottom: 15 }, infoCopy: { flex: 1 }, infoTitle: { color: '#135C43', fontSize: 12, fontWeight: '900' }, infoText: { color: '#497063', fontSize: 10.5, lineHeight: 16, marginTop: 2 }, listBlock: { gap: 10 }, sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }, sectionTitle: { color: C.text, fontSize: 15, fontWeight: '900' }, card: { padding: 14, borderRadius: 17, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line, elevation: 2 }, cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' }, cardHeading: { flex: 1, minWidth: 0 }, name: { color: C.text, fontSize: 16, fontWeight: '900' }, profileFor: { color: C.muted, fontSize: 10.5, marginTop: 3 }, statusBadge: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 9 }, statusText: { fontSize: 9, fontWeight: '900' }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }, metaText: { flexShrink: 1, color: C.muted, fontSize: 10.5 }, metaDot: { color: '#B7A69D', fontSize: 11 }, rejectionBox: { marginTop: 11, padding: 10, borderRadius: 12, backgroundColor: '#FFF5F3', borderWidth: 1, borderColor: '#F5D4CF' }, rejectionTitle: { color: C.red, fontSize: 10, fontWeight: '900' }, rejectionText: { color: '#7C4B46', fontSize: 10.5, lineHeight: 16, marginTop: 3 }, approvedEditNote: { marginTop: 10, padding: 9, borderRadius: 10, backgroundColor: '#F0F8F4' }, approvedEditText: { color: '#32644F', fontSize: 9.5, fontWeight: '700' },
  cardActions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14 }, secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 40, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E4C8C1', backgroundColor: '#FFF8F5' }, secondaryButtonText: { color: C.maroon, fontSize: 10.5, fontWeight: '900' }, viewButton: { flexDirection: 'row', alignItems: 'center', gap: 5, minHeight: 40, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#CCE7D9', backgroundColor: '#F3FBF7' }, viewButtonText: { color: C.green, fontSize: 10.5, fontWeight: '900' }, primaryButton: { flex: 1, minWidth: 150, minHeight: 40, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, primaryButtonText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' }, deleteDraftButton: { alignSelf: 'flex-start', marginTop: 10, minHeight: 34, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: '#F0C8C2', backgroundColor: '#FFF7F5', flexDirection: 'row', alignItems: 'center', gap: 5 }, deleteDraftText: { color: C.red, fontSize: 9.5, fontWeight: '900' }, deleteRequestButton: { alignSelf: 'flex-start', marginTop: 10, minHeight: 36, paddingHorizontal: 11, borderRadius: 10, borderWidth: 1, borderColor: '#F0C8C2', backgroundColor: '#FFF7F5', flexDirection: 'row', alignItems: 'center', gap: 6 }, deleteRequestText: { color: C.red, fontSize: 9.5, fontWeight: '900' }, deletePendingBox: { marginTop: 10, padding: 10, borderRadius: 11, backgroundColor: '#FFF8E8', borderWidth: 1, borderColor: '#F0D6A0', flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, deletePendingTitle: { color: '#8A570D', fontSize: 10, fontWeight: '900' }, deletePendingText: { color: '#806B4C', fontSize: 9.5, lineHeight: 14, marginTop: 2 }, buttonDisabled: { opacity: 0.62 }, lockedState: { flexDirection: 'row', alignItems: 'center', gap: 5 }, lockedText: { color: '#8B7F78', fontSize: 9.5, fontWeight: '700' },
  stateBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 52, gap: 10 }, stateTitle: { color: C.text, fontSize: 14, fontWeight: '900', textAlign: 'center' }, retryButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 11, backgroundColor: C.maroon }, retryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' }, emptyCard: { alignItems: 'center', padding: 24, marginTop: 6, borderRadius: 20, backgroundColor: C.paper, borderWidth: 1, borderColor: C.line }, emptyIcon: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC' }, emptyTitle: { color: C.maroonDark, fontSize: 18, fontWeight: '900', marginTop: 15, textAlign: 'center' }, emptyText: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 7, textAlign: 'center' }, createButton: { marginTop: 18, minHeight: 46, paddingHorizontal: 18, borderRadius: 13, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center' }, createButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, authState: { flex: 1, paddingHorizontal: 28, alignItems: 'center', justifyContent: 'center' }, authIcon: { width: 82, height: 82, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0EC', borderWidth: 1, borderColor: '#F0D1C8' }, authTitle: { color: C.maroonDark, fontSize: 21, lineHeight: 28, fontWeight: '900', textAlign: 'center', marginTop: 18 }, authText: { color: C.muted, fontSize: 12.5, lineHeight: 20, textAlign: 'center', marginTop: 9 }, loginButton: { width: '100%', minHeight: 48, marginTop: 20, borderRadius: 14, backgroundColor: C.maroon, alignItems: 'center', justifyContent: 'center' }, loginButtonText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '900' }, backLink: { color: C.maroon, fontSize: 11, fontWeight: '800', marginTop: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(25,18,16,0.52)', alignItems: 'center', justifyContent: 'center', padding: 22 }, modalCard: { width: '100%', maxWidth: 460, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 18 }, modalIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#FFF0EE', alignItems: 'center', justifyContent: 'center' }, modalTitle: { color: C.maroonDark, fontSize: 19, fontWeight: '900', marginTop: 13 }, modalText: { color: C.muted, fontSize: 11.5, lineHeight: 18, marginTop: 6 }, reasonInput: { minHeight: 110, marginTop: 14, borderWidth: 1, borderColor: C.line, borderRadius: 13, backgroundColor: '#FFFCF8', padding: 12, color: C.text, fontSize: 12, textAlignVertical: 'top' }, reasonCount: { alignSelf: 'flex-end', color: '#998A82', fontSize: 9, marginTop: 4 }, modalActions: { flexDirection: 'row', gap: 9, marginTop: 14 }, modalCancel: { flex: 1, minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }, modalCancelText: { color: C.muted, fontSize: 11, fontWeight: '900' }, modalSubmit: { flex: 1.35, minHeight: 44, borderRadius: 12, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' }, modalSubmitText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
''')
