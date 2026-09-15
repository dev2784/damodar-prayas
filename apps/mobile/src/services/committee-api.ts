import { api } from '@/services/api';

export type CommitteeTranslation = {
  language: 'HI' | 'EN';
  name: string;
  details: string | null;
};

export type CommitteeMember = {
  id?: string;
  name: string;
  designationHi: string | null;
  designationEn: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  sortOrder: number;
  isActive?: boolean;
};

export type CommitteeStatus = 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';

export type Committee = {
  id: string;
  status?: CommitteeStatus;
  rejectionReason?: string | null;
  publishedAt?: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  sortOrder: number;
  translations: CommitteeTranslation[];
  members: CommitteeMember[];
};

export type CommitteeSubmission = {
  bannerUrl: string;
  bannerStorageKey?: string;
  logoUrl?: string;
  city: string;
  district?: string;
  state: string;
  address?: string;
  phone?: string;
  email?: string;
  translations: Array<{
    language: 'HI' | 'EN';
    name: string;
    details?: string;
  }>;
  members: Array<{
    name: string;
    designationHi?: string;
    designationEn?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    sortOrder?: number;
    isActive?: boolean;
  }>;
};

type CommitteeList = {
  items: Committee[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const committeeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCommittees: builder.query<CommitteeList, { language?: 'HI' | 'EN' } | void>({
      query: (arg) => `/committees?language=${arg?.language ?? 'HI'}&page=1&limit=50`,
      providesTags: (result) => [
        { type: 'Committees', id: 'LIST' },
        ...(result?.items.map((item) => ({ type: 'Committees' as const, id: item.id })) ?? []),
      ],
    }),
    getCommittee: builder.query<{ committee: Committee }, string>({
      query: (id) => `/committees/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Committees', id }],
    }),
    submitCommittee: builder.mutation<{ committee: Committee; message: string }, CommitteeSubmission>({
      query: (body) => ({
        url: '/committees/submit',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCommitteesQuery,
  useGetCommitteeQuery,
  useSubmitCommitteeMutation,
} = committeeApi;
