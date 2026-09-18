import { api } from '@/services/api';
export type AuthUser = {
  id: string;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  preferredLanguage: 'HI' | 'EN';
  role: 'MEMBER' | 'ADMIN' | 'SUPER_ADMIN';
  isPhoneVerified: boolean;
  createdAt?: string;
};
export type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUser;
};
export type RegisterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  password: string;
};
export type LoginInput = { phone: string; password: string };
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    login: builder.mutation<AuthResponse, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    changePassword: builder.mutation<
      { success: boolean; message: string },
      { currentPassword: string; newPassword: string }
    >({ query: (body) => ({ url: '/auth/change-password', method: 'POST', body }) }),
    getMe: builder.query<{ user: AuthUser }, void>({
      query: () => '/auth/me',
      providesTags: ['Me'],
    }),
  }),
  overrideExisting: false,
});
export const { useRegisterMutation, useLoginMutation, useChangePasswordMutation, useGetMeQuery } =
  authApi;
