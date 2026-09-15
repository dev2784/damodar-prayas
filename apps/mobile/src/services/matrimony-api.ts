import { api } from '@/services/api';

export type MatrimonyCategory = 'JUNA_GUJARATI' | 'PIPA' | 'NAMDEV';
export type MatrimonyGender = 'MALE' | 'FEMALE' | 'OTHER';
export type MatrimonyMaritalStatus = 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';

export type MatrimonyPhoto = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type MatrimonyProfile = {
  id: string;
  profileFor: 'SELF' | 'SON' | 'DAUGHTER' | 'BROTHER' | 'SISTER' | 'RELATIVE';
  category: MatrimonyCategory;
  gender: MatrimonyGender;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  heightCm: number | null;
  maritalStatus: MatrimonyMaritalStatus;
  education: string | null;
  occupation: string | null;
  companyOrBusiness: string | null;
  annualIncome: number | null;
  gotra: string | null;
  manglik: boolean | null;
  birthPlace: string | null;
  currentCity: string | null;
  district: string | null;
  state: string | null;
  country: string;
  nativePlace: string | null;
  brothers: number;
  sisters: number;
  about: string | null;
  isFeatured: boolean;
  approvedAt: string | null;
  createdAt: string;
  photos: MatrimonyPhoto[];
};

export type MatrimonyListArgs = {
  category?: MatrimonyCategory;
  gender?: MatrimonyGender;
  maritalStatus?: MatrimonyMaritalStatus;
  state?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  featured?: boolean;
  page?: number;
  limit?: number;
};

export type MatrimonyListResponse = {
  items: MatrimonyProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type MatrimonyDetailResponse = {
  profile: MatrimonyProfile;
};

export const matrimonyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMatrimonyProfiles: builder.query<MatrimonyListResponse, MatrimonyListArgs | void>({
      query: (args) => ({
        url: '/matrimony',
        params: args ?? undefined,
      }),
      providesTags: (result) => [
        { type: 'Matrimony', id: 'LIST' },
        ...(result?.items.map((item) => ({ type: 'Matrimony' as const, id: item.id })) ?? []),
      ],
    }),
    getMatrimonyProfile: builder.query<MatrimonyDetailResponse, string>({
      query: (id) => `/matrimony/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Matrimony', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMatrimonyProfilesQuery,
  useGetMatrimonyProfileQuery,
} = matrimonyApi;
