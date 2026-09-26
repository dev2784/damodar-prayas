import type {
  MatrimonyProfileFor,
  MatrimonyGender,
  MatrimonyMaritalStatus,
} from '@/services/matrimony-api';
export const profileForChoices: { label: string; value: MatrimonyProfileFor }[] = [
  { label: 'स्वयं', value: 'SELF' },
  { label: 'पुत्र', value: 'SON' },
  { label: 'पुत्री', value: 'DAUGHTER' },
  { label: 'भाई', value: 'BROTHER' },
  { label: 'बहन', value: 'SISTER' },
  { label: 'रिश्तेदार', value: 'RELATIVE' },
];

/* Future community-category choices. Keep model/API compatibility, but hide selector for now.
const categoryChoices: { label: string; value: MatrimonyCategory }[] = [
  { label: 'जूना गुजराती', value: 'JUNA_GUJARATI' },
  { label: 'पीपा', value: 'PIPA' },
  { label: 'नामदेव', value: 'NAMDEV' },
];
*/

export const genderChoices: { label: string; value: MatrimonyGender }[] = [
  { label: 'पुरुष', value: 'MALE' },
  { label: 'महिला', value: 'FEMALE' },
  { label: 'अन्य', value: 'OTHER' },
];

export const maritalChoices: { label: string; value: MatrimonyMaritalStatus }[] = [
  { label: 'अविवाहित', value: 'NEVER_MARRIED' },
  { label: 'तलाकशुदा', value: 'DIVORCED' },
  { label: 'विधुर/विधवा', value: 'WIDOWED' },
  { label: 'अलग रह रहे', value: 'SEPARATED' },
];
