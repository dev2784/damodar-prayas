export function fileNameFromUri(uri: string, fallback: string) {
  const last = uri.split('/').pop()?.split('?')[0];
  return last || fallback;
}

function requestErrorCode(error: unknown) {
  if (typeof error !== 'object' || !error || !('data' in error)) return '';
  const data = (error as { data?: { error?: string; message?: string } }).data;
  return data?.error || data?.message || '';
}

export function mediaErrorMessage(error: unknown) {
  const code = requestErrorCode(error);
  if (code === 'MEDIA_PROVIDER_NOT_CONFIGURED') {
    return 'फोटो/कुंडली upload storage अभी server पर configure नहीं है। Cloudinary configure होते ही यही upload buttons काम करेंगे।';
  }
  if (code === 'PROFILE_PHOTO_LIMIT_REACHED') return 'अधिकतम 6 फोटो जोड़े जा सकते हैं।';
  if (code === 'KUNDALI_ALREADY_UPLOADED')
    return 'एक कुंडली पहले से जुड़ी है। नई जोड़ने से पहले पुरानी हटाएँ।';
  if (code === 'UNSUPPORTED_PHOTO_TYPE') return 'केवल JPG, PNG या WEBP फोटो चुनें।';
  if (code === 'UNSUPPORTED_KUNDALI_TYPE') return 'कुंडली PDF, JPG, PNG या WEBP में होनी चाहिए।';
  if (code === 'UPLOAD_NETWORK_ERROR')
    return 'Upload request server तक नहीं पहुँच पाई। इंटरनेट/API connection जाँचकर दोबारा कोशिश करें।';
  if (code) return `Upload fail हुआ: ${code}`;
  return 'Upload पूरा नहीं हुआ। कृपया दोबारा कोशिश करें।';
}
