import { emptyApi } from '../../../store/emptyApi';
import type { Centre } from '../../centres_screens/services/centresApiSlice';

export interface AnalyticsData {
  applications: {
    total: number; pending: number; under_review: number; approved: number; rejected: number;
  };
  centres: {
    total: number; active: number; suspended: number; decommissioned: number; totalCapacityMt: number;
  };
  intakes: {
    total: number; totalQtyKg: number;
    byCommodity: { commodity: string; total: number; totalQtyKg: number }[];
  };
  receipts: {
    total: number; active: number; pledged: number; redeemed: number; expired: number; totalQtyKg: number;
  };
  loans: {
    total: number; pending: number; approved: number; disbursed: number; repaid: number; defaulted: number; rejected: number;
    totalAmountRequested: number; totalAmountApproved: number;
  };
  collections: {
    total: number; pending: number; assigned: number; in_transit: number; collected: number; cancelled: number;
  };
  marketplace: {
    totalListings: number; activeListings: number; pausedListings: number; soldOutListings: number;
    totalOrders: number; completedOrders: number; paidOrders: number; cancelledOrders: number;
    totalRevenue: number;
  };
  revenue: {
    inventorySales: number; farmInputSales: number;
  };
  appsByState:  { state: string; total: number }[];
  appsByType:   { type:  string; total: number }[];
  appsByMonth:  { month: string; total: number }[];
}

export interface CentreReportData {
  centre: Centre;
  intakes: {
    total: number; totalQtyKg: number;
    byCommodity: { commodity: string; total: number; totalQtyKg: number }[];
    byMonth: { month: string; total: number; totalQtyKg: number }[];
  };
  receipts: {
    total: number; active: number; pledged: number; redeemed: number; expired: number; totalQtyKg: number;
  };
  loans: {
    total: number; pending: number; approved: number; disbursed: number; repaid: number; defaulted: number; rejected: number;
    totalAmountRequested: number; totalAmountApproved: number;
  };
  collections: {
    total: number; pending: number; assigned: number; in_transit: number; collected: number; cancelled: number;
  };
  marketplace: {
    totalListings: number; activeListings: number; pausedListings: number; soldOutListings: number;
    totalOrders: number; completedOrders: number; paidOrders: number; cancelledOrders: number;
    totalRevenue: number;
  };
  revenue: {
    inventorySales: number; farmInputSales: number;
  };
}

export const analyticsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<{ success: boolean; data: AnalyticsData }, void>({
      query: () => '/analytics',
    }),
    getCentreReport: builder.query<{ success: boolean; data: CentreReportData }, number>({
      query: (centreId) => `/analytics/centre/${centreId}`,
    }),
  }),
  overrideExisting: false,
});

export const { useGetAnalyticsQuery, useGetCentreReportQuery } = analyticsApi;
