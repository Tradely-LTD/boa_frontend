import { emptyApi } from '../../../store/emptyApi';

export interface AdminProfile {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  isActive: boolean;
  createdAt: string;
}

export const settingsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getMyProfile: builder.query<{ success: boolean; data: AdminProfile }, void>({
      query: () => '/users/me',
      providesTags: ['Users'],
    }),
    updateMyProfile: builder.mutation<{ success: boolean; data: AdminProfile }, { name?: string; email?: string }>({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: ['Users'],
    }),
    changeMyPassword: builder.mutation<{ success: boolean; message: string }, { userId: number; currentPassword: string; newPassword: string }>({
      query: ({ userId, currentPassword, newPassword }) => ({
        url: `/users/${userId}/change-password`,
        method: 'POST',
        body: { currentPassword, newPassword },
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetMyProfileQuery, useUpdateMyProfileMutation, useChangeMyPasswordMutation } = settingsApi;
