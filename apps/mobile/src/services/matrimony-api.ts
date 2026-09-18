import { api } from '@/services/api';

export type MatrimonyCategory = 'JUNA_GUJARATI' | 'PIPA' | 'NAMDEV';
export type MatrimonyGender = 'MALE' | 'FEMALE' | 'OTHER';
export type MatrimonyMaritalStatus = 'NEVER_MARRIED' | 'DIVORCED' | 'WIDOWED' | 'SEPARATED';
export type MatrimonyProfileFor = 'SELF' | 'SON' | 'DAUGHTER' | 'BROTHER' | 'SISTER' | 'RELATIVE';
export type MatrimonyProfileStatus =
  'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'MARRIED';
export type MatrimonyMediaStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MatrimonyDeleteRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type MatrimonyDeleteRequest = {
  id: string;
  reason: string;
  status: MatrimonyDeleteRequestStatus;
  createdAt: string;
};

export type MatrimonyPhoto = {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder: number;
};

export type MatrimonyOwnerPhoto = MatrimonyPhoto & {
  storageKey: string | null;
  status: MatrimonyMediaStatus;
  createdAt: string;
};

export type MatrimonyKundali = {
  id: string;
  fileUrl: string;
  storageKey: string | null;
  fileName: string | null;
  mimeType: string | null;
  status: MatrimonyMediaStatus;
  createdAt: string;
};

export type MatrimonyProfile = {
  id: string;
  profileFor: MatrimonyProfileFor;
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

export type MatrimonyOwnerProfile = Omit<MatrimonyProfile, 'photos'> & {
  createdById: string;
  contactPhone: string | null;
  contactEmail: string | null;
  birthTime: string | null;
  fullAddress: string | null;
  postalCode: string | null;
  fatherName: string | null;
  fatherOccupation: string | null;
  motherName: string | null;
  motherOccupation: string | null;
  familyDetails: string | null;
  status: MatrimonyProfileStatus;
  rejectionReason: string | null;
  updatedAt: string;
  photos: MatrimonyOwnerPhoto[];
  kundalis: MatrimonyKundali[];
  deleteRequests: MatrimonyDeleteRequest[];
};

export type MatrimonyProfileInput = {
  profileFor: MatrimonyProfileFor;
  category: MatrimonyCategory;
  gender: MatrimonyGender;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth: string;
  heightCm?: number | null;
  maritalStatus: MatrimonyMaritalStatus;
  contactPhone?: string | null;
  contactEmail?: string | null;
  education?: string | null;
  occupation?: string | null;
  companyOrBusiness?: string | null;
  annualIncome?: number | null;
  gotra?: string | null;
  manglik?: boolean | null;
  birthTime?: string | null;
  birthPlace?: string | null;
  currentCity?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string;
  fullAddress?: string | null;
  postalCode?: string | null;
  nativePlace?: string | null;
  fatherName?: string | null;
  fatherOccupation?: string | null;
  motherName?: string | null;
  motherOccupation?: string | null;
  brothers?: number;
  sisters?: number;
  familyDetails?: string | null;
  about?: string | null;
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

type MyMatrimonyProfilesResponse = {
  items: MatrimonyOwnerProfile[];
};

type OwnerMatrimonyProfileResponse = {
  profile: MatrimonyOwnerProfile;
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
    getMyMatrimonyProfiles: builder.query<MyMatrimonyProfilesResponse, void>({
      query: () => '/matrimony/mine',
      providesTags: (result) => [
        { type: 'Matrimony', id: 'MINE' },
        ...(result?.items.map((item) => ({ type: 'Matrimony' as const, id: item.id })) ?? []),
      ],
    }),
    createMatrimonyProfile: builder.mutation<OwnerMatrimonyProfileResponse, MatrimonyProfileInput>({
      query: (body) => ({
        url: '/matrimony',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Matrimony', id: 'MINE' },
        { type: 'Matrimony', id: 'LIST' },
      ],
    }),
    updateMatrimonyProfile: builder.mutation<
      OwnerMatrimonyProfileResponse,
      { id: string; body: Partial<Omit<MatrimonyProfileInput, 'profileFor'>> }
    >({
      query: ({ id, body }) => ({
        url: `/matrimony/${id}`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Matrimony', id },
        { type: 'Matrimony', id: 'MINE' },
        { type: 'Matrimony', id: 'LIST' },
      ],
    }),
    deleteMatrimonyProfile: builder.mutation<void, string>({
      query: (id) => ({
        url: `/matrimony/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Matrimony', id },
        { type: 'Matrimony', id: 'MINE' },
        { type: 'Matrimony', id: 'LIST' },
      ],
    }),
    requestMatrimonyProfileDeletion: builder.mutation<
      { request: MatrimonyDeleteRequest },
      { id: string; reason: string }
    >({
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
      query: (id) => ({
        url: `/matrimony/${id}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Matrimony', id },
        { type: 'Matrimony', id: 'MINE' },
        { type: 'Matrimony', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMatrimonyProfilesQuery,
  useGetMatrimonyProfileQuery,
  useGetMyMatrimonyProfilesQuery,
  useCreateMatrimonyProfileMutation,
  useUpdateMatrimonyProfileMutation,
  useDeleteMatrimonyProfileMutation,
  useRequestMatrimonyProfileDeletionMutation,
  useSubmitMatrimonyProfileMutation,
} = matrimonyApi;
