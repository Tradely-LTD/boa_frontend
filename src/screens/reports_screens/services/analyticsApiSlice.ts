import { emptyApi } from '../../../store/emptyApi';

export interface AnalyticsData {
  applications: {
    total: number; pending: number; under_review: number; approved: number; rejected: number;
  };
  centres: {
    total: number; active: number; suspended: number; decommissioned: number; totalCapacityMt: number;
  };
  appsByState:  { state: string; total: number }[];
  appsByType:   { type:  string; total: number }[];
  appsByMonth:  { month: string; total: number }[];
}

export const analyticsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<{ success: boolean; data: AnalyticsData }, void>({
      query: () => '/analytics',
    }),
  }),
  overrideExisting: false,
});

export const { useGetAnalyticsQuery } = analyticsApi;
