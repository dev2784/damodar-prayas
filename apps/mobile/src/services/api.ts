import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import type { RootState } from '@/store/store';

const baseUrl =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://damodar-prayas-api.onrender.com/api/v1';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      headers.set('accept', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Me',
    'Matrimony',
    'Interests',
    'ContactRequests',
    'Shortlists',
    'Posts',
    'Committees',
    'Notifications',
    'Reports',
  ],
  endpoints: () => ({}),
});
