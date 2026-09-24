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
export type PendingPhoneVerification = { requiresPhoneVerification: true; user: AuthUser };
export type AuthResult = AuthResponse | PendingPhoneVerification;
export function requiresPhoneVerification(result: AuthResult): result is PendingPhoneVerification {
  return 'requiresPhoneVerification' in result && result.requiresPhoneVerification;
}
export type RegisterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string | null;
  password: string;
  otpAccessToken?: string;
};
export type LoginInput = { phone: string; password: string };
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResult, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    login: builder.mutation<AuthResult, LoginInput>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    googleLogin: builder.mutation<AuthResult, { idToken: string }>({
      query: (body) => ({ url: '/auth/google', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),

    googleRegister: builder.mutation<AuthResult, { idToken: string; phone: string; firstName: string; lastName: string; otpAccessToken?: string }>({
      query: (body) => ({ url: '/auth/google/register', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    googleLink: builder.mutation<{ success: boolean }, { idToken: string }>({
      query: (body) => ({ url: '/auth/google/link', method: 'POST', body }),
      invalidatesTags: ['Me'],
    }),
    sendOtp: builder.mutation<{ success: boolean; widgetId: string; otpLength: number; resendSeconds: number; otpExpiryMinutes: number }, { phone: string }>({
      query: (body) => ({ url: '/auth/otp/send', method: 'POST', body }),
    }),
    verifyOtp: builder.mutation<AuthResponse, { phone: string; accessToken: string }>({
      query: (body) => ({ url: '/auth/otp/verify', method: 'POST', body }),
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
export const { useRegisterMutation, useLoginMutation, useGoogleLoginMutation, useGoogleRegisterMutation, useGoogleLinkMutation, useSendOtpMutation, useVerifyOtpMutation, useChangePasswordMutation, useGetMeQuery } =
  authApi;
