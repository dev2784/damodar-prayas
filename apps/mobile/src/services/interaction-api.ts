import { api } from '@/services/api';
import type { MatrimonyProfile } from '@/services/matrimony-api';

export type InterestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type Interest = {
  id: string;
  senderProfileId: string;
  receiverProfileId: string;
  status: InterestStatus;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type IncomingInterest = Interest & { senderProfile: MatrimonyProfile };
export type OutgoingInterest = Interest & { receiverProfile: MatrimonyProfile };

export type ShortlistItem = {
  id: string;
  userId: string;
  matrimonyProfileId: string;
  createdAt: string;
  matrimonyProfile: MatrimonyProfile;
};

export const interactionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getShortlists: builder.query<{ items: ShortlistItem[] }, void>({
      query: () => '/shortlists',
      providesTags: (result) => [
        { type: 'Shortlists', id: 'LIST' },
        ...(result?.items.map((item) => ({ type: 'Shortlists' as const, id: item.matrimonyProfileId })) ?? []),
      ],
    }),
    addShortlist: builder.mutation<{ shortlist: { id: string } }, string>({
      query: (profileId) => ({ url: `/shortlists/${profileId}`, method: 'POST' }),
      invalidatesTags: (_result, _error, profileId) => [
        { type: 'Shortlists', id: 'LIST' },
        { type: 'Shortlists', id: profileId },
      ],
    }),
    removeShortlist: builder.mutation<void, string>({
      query: (profileId) => ({ url: `/shortlists/${profileId}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, profileId) => [
        { type: 'Shortlists', id: 'LIST' },
        { type: 'Shortlists', id: profileId },
      ],
    }),
    getIncomingInterests: builder.query<{ items: IncomingInterest[] }, void>({
      query: () => '/interests/incoming',
      providesTags: [{ type: 'Interests', id: 'INCOMING' }],
    }),
    getOutgoingInterests: builder.query<{ items: OutgoingInterest[] }, void>({
      query: () => '/interests/outgoing',
      providesTags: [{ type: 'Interests', id: 'OUTGOING' }],
    }),
    sendInterest: builder.mutation<
      { interest: Interest },
      { senderProfileId: string; receiverProfileId: string; message?: string | null }
    >({
      query: (body) => ({ url: '/interests', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Interests', id: 'OUTGOING' },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
    respondInterest: builder.mutation<{ interest: Interest }, { id: string; action: 'ACCEPT' | 'REJECT' }>({
      query: ({ id, action }) => ({
        url: `/interests/${id}/respond`,
        method: 'POST',
        body: { action },
      }),
      invalidatesTags: [
        { type: 'Interests', id: 'INCOMING' },
        { type: 'Interests', id: 'OUTGOING' },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetShortlistsQuery,
  useAddShortlistMutation,
  useRemoveShortlistMutation,
  useGetIncomingInterestsQuery,
  useGetOutgoingInterestsQuery,
  useSendInterestMutation,
  useRespondInterestMutation,
} = interactionApi;
