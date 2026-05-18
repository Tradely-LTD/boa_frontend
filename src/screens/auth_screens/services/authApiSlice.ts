import { emptyApi } from '../../../store/emptyApi';

interface LoginRequest  { email: string; password: string; }
interface LoginResponse { success: boolean; data: { token: string; user: { id: number; email: string; name: string; role: 'admin' | 'super_admin' | 'centre_manager'; centreId?: number | null } } }

export const authApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
  }),
});

export const { useLoginMutation } = authApi;
