import { api } from '@/services/api';

export const pushApi = api.injectEndpoints({
  endpoints: (builder) => ({
    registerPushToken: builder.mutation<{ pushToken: { id: string } }, { token: string; platform?: string }>({
      query: (body) => ({ url: '/notifications/push-token', method: 'POST', body }),
    }),
    unregisterPushToken: builder.mutation<{ success: boolean }, { token: string }>({
      query: (body) => ({ url: '/notifications/push-token', method: 'DELETE', body }),
    }),
  }),
  overrideExisting: false,
});

export const { useRegisterPushTokenMutation, useUnregisterPushTokenMutation } = pushApi;
