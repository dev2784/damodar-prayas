import { api } from '@/services/api';
export type SupportCategory = 'FEEDBACK' | 'COMPLAINT' | 'CONTACT';
export const supportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    sendSupportMessage: builder.mutation<
      { ticket: { id: string; status: 'OPEN'; createdAt: string } },
      { category: SupportCategory; subject: string; message: string }
    >({ query: (body) => ({ url: '/support', method: 'POST', body }) }),
  }),
});
export const { useSendSupportMessageMutation } = supportApi;
