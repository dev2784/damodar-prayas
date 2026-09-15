from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1)

# Prisma committee approval status
p = Path('prisma/schema.prisma')
s = p.read_text()
if 'enum CommitteeStatus {' not in s:
    marker = '''enum ContactRequestStatus {
  PENDING
  ACCEPTED
  REJECTED
  WITHDRAWN
}
'''
    addition = marker + '''
enum CommitteeStatus {
  PENDING
  PUBLISHED
  REJECTED
  ARCHIVED
}
'''
    s = replace_once(s, marker, addition, 'CommitteeStatus enum')

committee_match = re.search(r'model Committee \{.*?\n\}', s, flags=re.S)
if not committee_match:
    raise SystemExit('Committee model not found')
committee = committee_match.group(0)
if 'status           CommitteeStatus' not in committee:
    committee = replace_once(
        committee,
        '  email            String?\n  isActive         Boolean',
        '  email            String?\n  status           CommitteeStatus         @default(PENDING)\n  rejectionReason  String?\n  publishedAt      DateTime?\n  isActive         Boolean',
        'Committee approval fields',
    )
if '@@index([status, isActive, sortOrder])' not in committee:
    committee = replace_once(
        committee,
        '  @@index([isActive, sortOrder])',
        '  @@index([isActive, sortOrder])\n  @@index([status, isActive, sortOrder])',
        'Committee status index',
    )
s = s[:committee_match.start()] + committee + s[committee_match.end():]
p.write_text(s)

# Generic authenticated content/banner upload
p = Path('apps/api/src/modules/media/routes.ts')
s = p.read_text()
if "app.post('/content/banner'" not in s:
    marker = "  app.post('/matrimony/:profileId/photos', async (request, reply) => {"
    block = '''  app.post('/content/banner', async (request, reply) => {
    const userId = await getActiveUserId(request, reply);
    if (!userId) return;

    const file = await request.file({ limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
    if (!file) return reply.code(400).send({ error: 'FILE_REQUIRED' });
    if (!PHOTO_MIME_TYPES.has(file.mimetype)) {
      return reply.code(400).send({ error: 'UNSUPPORTED_BANNER_TYPE' });
    }

    const buffer = await file.toBuffer();
    const uploaded = await uploadMedia({
      buffer,
      mimeType: file.mimetype,
      fileName: file.filename,
      folder: `damodar-prayas/content/${userId}/banners`,
      kind: 'content-banner',
      publicBaseUrl: getPublicBaseUrl(request),
    });

    return reply.code(201).send({ media: uploaded });
  });

'''
    s = replace_once(s, marker, block + marker, 'content banner upload')
p.write_text(s)

# Community add button
p = Path('apps/mobile/src/app/community.tsx')
s = p.read_text()
if "pathname: '/community-submit'" not in s:
    old = '''            <View style={styles.header}>
              <Text style={styles.eyebrow}>समाज अपडेट्स</Text>
              <Text style={styles.title}>समाचार एवं कार्यक्रम</Text>
              <Text style={styles.subtitle}>
'''
    new = '''            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerCopy}>
                  <Text style={styles.eyebrow}>समाज अपडेट्स</Text>
                  <Text style={styles.title}>समाचार एवं कार्यक्रम</Text>
                </View>
                <Pressable
                  style={styles.addButton}
                  onPress={() => router.push({ pathname: '/community-submit', params: { category: activeCategory } })}>
                  <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor="#FFFFFF" size={16} />
                  <Text style={styles.addButtonText}>जोड़ें</Text>
                </Pressable>
              </View>
              <Text style={styles.subtitle}>
'''
    s = replace_once(s, old, new, 'community header add button')
    old_style = "  header: { paddingHorizontal: 2, paddingTop: 5, paddingBottom: 13 },\n"
    new_style = old_style + "  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },\n  headerCopy: { flex: 1 },\n  addButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 11, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', gap: 4 },\n  addButtonText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' },\n"
    s = replace_once(s, old_style, new_style, 'community add button styles')
p.write_text(s)

# Samiti add button
p = Path('apps/mobile/src/app/samiti.tsx')
s = p.read_text()
if "router.push('/samiti-submit')" not in s:
    old = '''          <View style={styles.header}>
            <Text style={styles.eyebrow}>समाज संगठन</Text>
            <Text style={styles.title}>समितियाँ</Text>
            <Text style={styles.subtitle}>
'''
    new = '''          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>समाज संगठन</Text>
                <Text style={styles.title}>समितियाँ</Text>
              </View>
              <Pressable style={styles.addButton} onPress={() => router.push('/samiti-submit')}>
                <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor="#FFFFFF" size={16} />
                <Text style={styles.addButtonText}>समिति जोड़ें</Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
'''
    s = replace_once(s, old, new, 'samiti header add button')
    old_style = "  header: { paddingHorizontal: 2, paddingTop: 5, paddingBottom: 14 },\n"
    new_style = old_style + "  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },\n  headerCopy: { flex: 1 },\n  addButton: { minHeight: 36, borderRadius: 11, paddingHorizontal: 11, backgroundColor: C.maroon, flexDirection: 'row', alignItems: 'center', gap: 4 },\n  addButtonText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '900' },\n"
    s = replace_once(s, old_style, new_style, 'samiti add button styles')
p.write_text(s)

# Hide form routes from bottom tabs
p = Path('apps/mobile/src/components/app-tabs.tsx')
s = p.read_text()
if 'name="community-submit"' not in s:
    s = replace_once(
        s,
        '      <Tabs.Screen name="community-post" options={{ href: null }} />\n',
        '      <Tabs.Screen name="community-post" options={{ href: null }} />\n      <Tabs.Screen name="community-submit" options={{ href: null }} />\n      <Tabs.Screen name="samiti-submit" options={{ href: null }} />\n',
        'hidden submission routes',
    )
p.write_text(s)
