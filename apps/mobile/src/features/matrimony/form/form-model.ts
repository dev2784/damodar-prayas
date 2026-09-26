import type {
  MatrimonyCategory,
  MatrimonyGender,
  MatrimonyMaritalStatus,
  MatrimonyOwnerProfile,
  MatrimonyProfileFor,
  MatrimonyProfileInput,
} from '@/services/matrimony-api';

type ManglikChoice = 'YES' | 'NO' | 'UNKNOWN';

export type FormState = {
  profileFor: MatrimonyProfileFor;
  category: MatrimonyCategory;
  gender: MatrimonyGender;
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  heightCm: string;
  maritalStatus: MatrimonyMaritalStatus;
  contactPhone: string;
  contactEmail: string;
  education: string;
  occupation: string;
  companyOrBusiness: string;
  annualIncome: string;
  gotra: string;
  manglik: ManglikChoice;
  birthTime: string;
  birthPlace: string;
  currentCity: string;
  district: string;
  state: string;
  country: string;
  fullAddress: string;
  postalCode: string;
  nativePlace: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
  brothers: string;
  sisters: string;
  familyDetails: string;
  about: string;
};

export const initialForm: FormState = {
  profileFor: 'SELF',
  category: 'JUNA_GUJARATI',
  gender: 'MALE',
  firstName: '',
  middleName: '',
  lastName: '',
  dateOfBirth: '',
  heightCm: '',
  maritalStatus: 'NEVER_MARRIED',
  contactPhone: '',
  contactEmail: '',
  education: '',
  occupation: '',
  companyOrBusiness: '',
  annualIncome: '',
  gotra: '',
  manglik: 'UNKNOWN',
  birthTime: '',
  birthPlace: '',
  currentCity: '',
  district: '',
  state: '',
  country: 'India',
  fullAddress: '',
  postalCode: '',
  nativePlace: '',
  fatherName: '',
  fatherOccupation: '',
  motherName: '',
  motherOccupation: '',
  brothers: '0',
  sisters: '0',
  familyDetails: '',
  about: '',
};

function textOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function profileToForm(profile: MatrimonyOwnerProfile): FormState {
  return {
    profileFor: profile.profileFor,
    category: profile.category,
    gender: profile.gender,
    firstName: profile.firstName ?? '',
    middleName: profile.middleName ?? '',
    lastName: profile.lastName ?? '',
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : '',
    heightCm: profile.heightCm?.toString() ?? '',
    maritalStatus: profile.maritalStatus,
    contactPhone: profile.contactPhone ?? '',
    contactEmail: profile.contactEmail ?? '',
    education: profile.education ?? '',
    occupation: profile.occupation ?? '',
    companyOrBusiness: profile.companyOrBusiness ?? '',
    annualIncome: profile.annualIncome?.toString() ?? '',
    gotra: profile.gotra ?? '',
    manglik: profile.manglik === true ? 'YES' : profile.manglik === false ? 'NO' : 'UNKNOWN',
    birthTime: profile.birthTime ?? '',
    birthPlace: profile.birthPlace ?? '',
    currentCity: profile.currentCity ?? '',
    district: profile.district ?? '',
    state: profile.state ?? '',
    country: profile.country || 'India',
    fullAddress: profile.fullAddress ?? '',
    postalCode: profile.postalCode ?? '',
    nativePlace: profile.nativePlace ?? '',
    fatherName: profile.fatherName ?? '',
    fatherOccupation: profile.fatherOccupation ?? '',
    motherName: profile.motherName ?? '',
    motherOccupation: profile.motherOccupation ?? '',
    brothers: profile.brothers?.toString() ?? '0',
    sisters: profile.sisters?.toString() ?? '0',
    familyDetails: profile.familyDetails ?? '',
    about: profile.about ?? '',
  };
}

export function buildPayload(form: FormState): MatrimonyProfileInput {
  return {
    profileFor: form.profileFor,
    category: form.category,
    gender: form.gender,
    firstName: form.firstName.trim(),
    middleName: textOrNull(form.middleName),
    lastName: form.lastName.trim(),
    dateOfBirth: form.dateOfBirth.trim(),
    heightCm: numberOrNull(form.heightCm),
    maritalStatus: form.maritalStatus,
    contactPhone: textOrNull(form.contactPhone),
    contactEmail: textOrNull(form.contactEmail),
    education: textOrNull(form.education),
    occupation: textOrNull(form.occupation),
    companyOrBusiness: textOrNull(form.companyOrBusiness),
    annualIncome: numberOrNull(form.annualIncome),
    gotra: textOrNull(form.gotra),
    manglik: form.manglik === 'YES' ? true : form.manglik === 'NO' ? false : null,
    birthTime: textOrNull(form.birthTime),
    birthPlace: textOrNull(form.birthPlace),
    currentCity: textOrNull(form.currentCity),
    district: textOrNull(form.district),
    state: textOrNull(form.state),
    country: form.country.trim() || 'India',
    fullAddress: textOrNull(form.fullAddress),
    postalCode: textOrNull(form.postalCode),
    nativePlace: textOrNull(form.nativePlace),
    fatherName: textOrNull(form.fatherName),
    fatherOccupation: textOrNull(form.fatherOccupation),
    motherName: textOrNull(form.motherName),
    motherOccupation: textOrNull(form.motherOccupation),
    brothers: Math.max(0, Math.round(numberOrNull(form.brothers) ?? 0)),
    sisters: Math.max(0, Math.round(numberOrNull(form.sisters) ?? 0)),
    familyDetails: textOrNull(form.familyDetails),
    about: textOrNull(form.about),
  };
}

export function validateForm(
  form: FormState,
  today = new Date(),
): { title: string; message: string } | null {
  if (!form.firstName.trim() || !form.lastName.trim() || !form.dateOfBirth.trim()) {
    return { title: 'जरूरी जानकारी बाकी है', message: 'नाम, उपनाम और जन्मतिथि भरना जरूरी है।' };
  }

  const dob = new Date(`${form.dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) {
    return {
      title: 'जन्मतिथि सही नहीं है',
      message: 'जन्मतिथि YYYY-MM-DD फॉर्मेट में भरें, जैसे 1998-05-21।',
    };
  }

  const adultCutoff = new Date(
    Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()),
  );
  if (dob > adultCutoff) {
    return {
      title: 'आयु सीमा',
      message: 'मैट्रिमोनी प्रोफाइल के लिए आयु कम से कम 18 वर्ष होनी चाहिए।',
    };
  }

  const height = numberOrNull(form.heightCm);
  if (height !== null && (height < 100 || height > 250)) {
    return { title: 'ऊंचाई जाँचें', message: 'ऊंचाई सेंटीमीटर में 100 से 250 के बीच होनी चाहिए।' };
  }

  if (
    form.country.trim().toLowerCase() === 'india' &&
    form.postalCode.trim() &&
    !/^\d{6}$/.test(form.postalCode.trim())
  ) {
    return { title: 'पिन कोड जाँचें', message: 'भारत के लिए 6 अंकों का पिन कोड भरें।' };
  }

  return null;
}

export type UpdateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => void;
