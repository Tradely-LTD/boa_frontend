import { emptyApi } from '../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../types/pagination';

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'centre_manager' | 'collector';
  isActive: boolean;
  createdAt: string;
}

export const usersApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<PaginatedResponse<AdminUser>, PaginationParams>({
      query: (params) => ({ url: '/users', params }),
      providesTags: ['Users'],
    }),
    updateUser: builder.mutation<{ success: boolean; data: AdminUser }, { id: number; name?: string; role?: string; isActive?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
    createUser: builder.mutation<{ success: boolean }, { name: string; email: string; password: string; role: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      invalidatesTags: ['Users'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetUsersQuery, useUpdateUserMutation, useCreateUserMutation } = usersApi;
