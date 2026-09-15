import { api } from '@/services/api';

export type AppNotification = {
  id: string;
  type: 'INTEREST_RECEIVED' | 'INTEREST_ACCEPTED' | 'INTEREST_REJECTED' | 'CONTACT_REQUEST' | 'CONTACT_ACCEPTED' | 'PROFILE_APPROVED' | 'PROFILE_REJECTED' | 'COMMUNITY_POST' | 'GENERAL';
  titleHi: string;
  titleEn: string | null;
  bodyHi: string | null;
  bodyEn: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationList = {
  items: AppNotification[];
  pagination: { page: number; limit: number; total: number; pages: number };
  unreadCount: number;
};

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationList, void>({
      query: () => '/notifications?limit=30',
      providesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    getUnreadNotificationCount: builder.query<{ unreadCount: number }, void>({
      query: () => '/notifications/unread-count',
      providesTags: [{ type: 'Notifications', id: 'COUNT' }],
    }),
    markNotificationRead: builder.mutation<{ notification: AppNotification }, string>({
      query: (id) => ({ url: '/notifications/' + id + '/read', method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, { type: 'Notifications', id: 'COUNT' }],
    }),
    markAllNotificationsRead: builder.mutation<{ updatedCount: number }, void>({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }, { type: 'Notifications', id: 'COUNT' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationApi;
