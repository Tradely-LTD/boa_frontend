import { emptyApi } from '../../../store/emptyApi';
import type { PaginatedResponse, PaginationParams } from '../../../types/pagination';

export interface Application {
  id: number;
  refId: string;
  // Identity
  centreName: string;
  centreType: string;
  regNumber: string | null;
  tinNumber: string | null;
  yearEstablished: number | null;
  // Ownership
  ownerName: string | null;
  ownerPhone: string | null;
  ownerNin: string | null;
  // Infrastructure
  commodities: string | null;
  capacityMt: number | null;
  coldStorageCapacityMt: number | null;
  numBays: number | null;
  floorAreaSqm: number | null;
  warehouseType: string | null;
  facilities: string | null;
  powerSource: string | null;
  waterSource: string | null;
  hasAccessRoad: boolean | null;
  warehouseReceiptCapable: boolean | null;
  // Location
  address: string | null;
  state: string | null;
  lga: string | null;
  gpsLat: string | null;
  gpsLng: string | null;
  // Manager
  managerName: string | null;
  managerPhone: string | null;
  managerNin: string | null;
  managerEmail: string | null;
  // Banking
  bankName: string | null;
  accountNumber: string | null;
  bvn: string | null;
  // Review
  status: 'pending' | 'under_review' | 'approved' | 'rejected';
  reviewNotes: string | null;
  reviewedBy: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const applicationsApi = emptyApi.injectEndpoints({
  endpoints: (builder) => ({
    getApplications: builder.query<PaginatedResponse<Application>, { status?: string; state?: string; search?: string } & PaginationParams>({
      query: (params) => ({ url: '/applications', params }),
      providesTags: ['Applications'],
    }),
    getApplication: builder.query<{ success: boolean; data: Application }, number>({
      query: (id) => `/applications/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Applications', id }],
    }),
    updateStatus: builder.mutation<{ success: boolean; data: Application }, { id: number; status: string; reviewNotes?: string }>({
      query: ({ id, ...body }) => ({ url: `/applications/${id}/status`, method: 'PATCH', body }),
      invalidatesTags: ['Applications'],
    }),
  }),
  overrideExisting: false,
});

export const { useGetApplicationsQuery, useGetApplicationQuery, useUpdateStatusMutation } = applicationsApi;
