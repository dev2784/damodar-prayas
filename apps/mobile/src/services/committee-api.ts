import { api } from '@/services/api';

export type CommitteeTranslation = {
  language: 'HI' | 'EN';
  name: string;
  details: string | null;
};

export type CommitteeMember = {
  id: string;
  name: string;
  designationHi: string | null;
  designationEn: string | null;
  phone: string | null;
  email: string | null;
  photoUrl: string | null;
  sortOrder: number;
  isActive?: boolean;
};

export type Committee = {
  id: string;
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
  }),
  overrideExisting: false,
});

export const { useGetCommitteesQuery, useGetCommitteeQuery } = committeeApi;
