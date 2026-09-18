import { api } from '@/services/api';

export type CommunityPostCategory =
  'NEWS' | 'EVENT' | 'ADVERTISEMENT' | 'REQUEST' | 'GRATITUDE' | 'WISHES';

export type CommunityPostTranslation = {
  language: 'HI' | 'EN';
  title: string;
  details: string;
};

export type CommunityPost = {
  id: string;
  category: CommunityPostCategory;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'ARCHIVED';
  bannerUrl: string | null;
  bannerStorageKey: string | null;
  contactName: string | null;
  contactPhone: string | null;
  location: string | null;
  eventDate: string | null;
  publishedAt: string | null;
  expiresAt: string | null;
  isFeatured: boolean;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  translations: CommunityPostTranslation[];
};

export type CommunityPostSubmission = {
  category: CommunityPostCategory;
  bannerUrl?: string | null;
  bannerStorageKey?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  location?: string | null;
  eventDate?: string | null;
  expiresAt?: string | null;
  translations: CommunityPostTranslation[];
};

type CommunityPostList = {
  items: CommunityPost[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const communityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getCommunityPosts: builder.query<
      CommunityPostList,
      { category: CommunityPostCategory; language?: 'HI' | 'EN' }
    >({
      query: ({ category, language = 'HI' }) =>
        `/posts?category=${category}&language=${language}&page=1&limit=30`,
      providesTags: (result, _error, arg) => [
        { type: 'Posts', id: `${arg.category}-${arg.language ?? 'HI'}` },
        ...(result?.items.map((item) => ({ type: 'Posts' as const, id: item.id })) ?? []),
      ],
    }),
    getCommunityPost: builder.query<{ post: CommunityPost }, string>({
      query: (id) => `/posts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Posts', id }],
    }),
    submitCommunityPost: builder.mutation<{ post: CommunityPost }, CommunityPostSubmission>({
      query: (body) => ({
        url: '/posts/submit',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCommunityPostsQuery,
  useGetCommunityPostQuery,
  useSubmitCommunityPostMutation,
} = communityApi;
