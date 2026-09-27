import { api } from '@/services/api';

export type CommunityCity = { id: string; name: string; district: string };

export type CommunityPostCategory =
  'NEWS' | 'EVENT' | 'ADVERTISEMENT' | 'REQUEST' | 'GRATITUDE' | 'WISHES' | 'OBITUARY';

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
  state?: string | null;
  cityId?: string | null;
  postDate?: string | null;
  eventDate: string | null;
  obituaryType: 'DEATH_NOTICE' | 'UTHAWNA' | 'CHAUTHA' | 'TRIBUTE' | 'OTHER' | null;
  deceasedName: string | null;
  deathDate: string | null;
  eventTime: string | null;
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
  state?: string;
  cityId?: string;
  postDate?: string;
  eventDate?: string | null;
  obituaryType?: 'DEATH_NOTICE' | 'UTHAWNA' | 'CHAUTHA' | 'TRIBUTE' | 'OTHER' | null;
  deceasedName?: string | null;
  deathDate?: string | null;
  eventTime?: string | null;
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
    getCommunityLocations: builder.query<{ state: string; cities: CommunityCity[] }, void>({
      query: () => '/posts/locations',
      keepUnusedDataFor: 86400,
    }),
    getCommunityPosts: builder.query<
      CommunityPostList,
      {
        category: CommunityPostCategory;
        language?: 'HI' | 'EN';
        cityId?: string;
        date?: string;
        page?: number;
      }
    >({
      query: ({ category, language = 'HI', cityId, date, page = 1 }) => ({
        url: '/posts',
        params: {
          category,
          language,
          page,
          limit: 30,
          ...(cityId ? { cityId } : {}),
          ...(date ? { date } : {}),
        },
      }),
      providesTags: (result, _error, arg) => [
        { type: 'Posts', id: `${arg.category}-${arg.language ?? 'HI'}` },
        ...(result?.items.map((item) => ({ type: 'Posts' as const, id: item.id })) ?? []),
      ],
    }),
    getCommunityPost: builder.query<{ post: CommunityPost }, string>({
      query: (id) => `/posts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Posts', id }],
    }),
    getCommunityPostLikes: builder.query<{ likeCount: number }, string>({
      query: (id) => `/posts/${id}/likes`,
      providesTags: (_r, _e, id) => [{ type: 'Posts', id: `likes-${id}` }],
    }),
    getMyCommunityPostLike: builder.query<{ isLiked: boolean }, string>({
      query: (id) => `/posts/${id}/like/me`,
      providesTags: (_r, _e, id) => [{ type: 'Posts', id: `my-like-${id}` }],
    }),
    likeCommunityPost: builder.mutation<{ isLiked: boolean; likeCount: number }, string>({
      query: (id) => ({ url: `/posts/${id}/like`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Posts', id: `likes-${id}` },
        { type: 'Posts', id: `my-like-${id}` },
      ],
    }),
    unlikeCommunityPost: builder.mutation<{ isLiked: boolean; likeCount: number }, string>({
      query: (id) => ({ url: `/posts/${id}/like`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'Posts', id: `likes-${id}` },
        { type: 'Posts', id: `my-like-${id}` },
      ],
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
  useGetCommunityLocationsQuery,
  useGetCommunityPostsQuery,
  useGetCommunityPostQuery,
  useSubmitCommunityPostMutation,
  useGetCommunityPostLikesQuery,
  useGetMyCommunityPostLikeQuery,
  useLikeCommunityPostMutation,
  useUnlikeCommunityPostMutation,
} = communityApi;
