import fs from 'node:fs';

const path = 'apps/mobile/src/app/matrimony.tsx';
let text = fs.readFileSync(path, 'utf8');

const oldOwner = `  const { data: mineData } = useGetMyMatrimonyProfilesQuery(undefined, { skip: !accessToken });
  const resumableProfile = mineData?.items.find((item) => item.status === 'DRAFT' || item.status === 'REJECTED');

  function openOwnerFlow() {
    if (!accessToken) {
      router.push({ pathname: '/auth', params: { mode: 'register', next: '/matrimony-form' } });
      return;
    }
    if (resumableProfile) {
      router.push({ pathname: '/matrimony-form', params: { id: resumableProfile.id } });
      return;
    }
    if ((mineData?.items.length ?? 0) > 0) {
      router.push('/my-matrimony');
      return;
    }
    router.push('/matrimony-form');
  }
`;

const newOwner = `  const { data: mineData, isLoading: isLoadingMine } = useGetMyMatrimonyProfilesQuery(undefined, { skip: !accessToken });
  const hasAnyOwnProfile = (mineData?.items.length ?? 0) > 0;

  function openOwnerFlow() {
    if (!accessToken) {
      router.push({ pathname: '/auth', params: { mode: 'register', next: '/matrimony-form' } });
      return;
    }
    if (isLoadingMine) return;
    if (hasAnyOwnProfile) {
      router.push('/my-matrimony');
      return;
    }
    router.push('/matrimony-form');
  }
`;

const oldCopy = `                <Text style={styles.createProfileTitle}>{resumableProfile ? 'अपना ड्राफ्ट जारी रखें' : 'अपना मैट्रिमोनी प्रोफाइल बनाएँ'}</Text>
                <Text style={styles.createProfileText}>{resumableProfile ? 'आपका अधूरा ड्राफ्ट मिल गया है। वहीं से आगे जारी रखें।' : 'अपनी जानकारी भरें, ड्राफ्ट सेव करें और तैयार होने पर समीक्षा के लिए भेजें।'}</Text>
`;

const newCopy = `                <Text style={styles.createProfileTitle}>{hasAnyOwnProfile ? 'अपने मैट्रिमोनी प्रोफाइल देखें' : 'अपना मैट्रिमोनी प्रोफाइल बनाएँ'}</Text>
                <Text style={styles.createProfileText}>{hasAnyOwnProfile ? 'आपके अकाउंट में पहले से प्रोफाइल मौजूद है। उसे देखने, एडिट करने या स्थिति जांचने के लिए आगे बढ़ें।' : 'अपनी जानकारी भरें, ड्राफ्ट सेव करें और तैयार होने पर समीक्षा के लिए भेजें।'}</Text>
`;

const oldButton = `                <Text style={styles.createProfileButtonText}>{resumableProfile ? 'जारी रखें' : 'बनाएँ'}</Text>`;
const newButton = `                <Text style={styles.createProfileButtonText}>{isLoadingMine ? 'जाँच रहे हैं' : hasAnyOwnProfile ? 'मेरे प्रोफाइल' : 'बनाएँ'}</Text>`;

for (const [from, to, label] of [[oldOwner, newOwner, 'owner flow'], [oldCopy, newCopy, 'banner copy'], [oldButton, newButton, 'button copy']]) {
  if (!text.includes(from)) throw new Error(`Pattern not found: ${label}`);
  text = text.replace(from, to);
}

fs.writeFileSync(path, text);
