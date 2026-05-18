import { emptyApi } from '../../../store/emptyApi';

export interface Notification {
  id: number;
  type: string;
  message: string;
  applicationRefId: string | null;
  centreId: number | null;
  createdAt: string;
}

export const notificationsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<{ success: boolean; data: Notification[] }, void>({
      query: () => '/notifications',
    }),
  }),
  overrideExisting: false,
});

export const { useGetNotificationsQuery } = notificationsApi;
