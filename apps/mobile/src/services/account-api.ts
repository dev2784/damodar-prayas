import { api } from '@/services/api';

export type AccountDeleteRequest = {
  id: string;
  reason?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
};

export const accountApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAccountDeleteRequest: builder.query<{ request: AccountDeleteRequest | null }, void>({
      query: () => '/account/delete-request',
      providesTags: ['Me'],
    }),
    requestAccountDeletion: builder.mutation<{ request: AccountDeleteRequest }, { reason?: string }>({
      query: (body) => ({ url: '/account/delete-request', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetAccountDeleteRequestQuery, useRequestAccountDeletionMutation } = accountApi;
